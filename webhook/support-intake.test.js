import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from './server.js';
import {createSupportIntake} from './support-intake.js';
import {TYPES} from './inquiry-contract.js';
import {INQUIRY_NOTICE_VERSION} from './inquiry-privacy.js';
import crypto from 'node:crypto';
import vm from 'node:vm';
import http from 'node:http';
import {parseUnambiguousJson} from './strict-json.js';
import {parseUnambiguousForm} from './strict-form.js';
import {marketplaceTelemetry} from './marketplace-telemetry.js';
import {createInquiryRateLimiter} from './inquiry-rate-limit.js';

const payload = {inquiryProcessing:'requested',privacyNoticeVersion:INQUIRY_NOTICE_VERSION,name:'Synthetic Reader',email:'reader@example.test',product:'Website',type:'Documentation',title:'Synthetic inquiry',description:'Synthetic question only.',steps:'',environment:''};
const response = (body, ok=true) => ({ok,json:async()=>body});
function backend(options={}) {
  const calls=[],logs=[];
  const fetchImpl=async(url,init)=>{
    calls.push({url,init});
    if (url.endsWith('/assignees')) return response({assignees:[{login:'example-owner'}]});
    if (url.endsWith('/issues')) return response({number:7,html_url:'https://example.test/private/7'});
    return response({private:true});
  };
  const config={enabled:true,token:'synthetic-not-a-credential',repo:'example/private-inbox',assignee:'example-owner',fetchImpl,log:r=>logs.push(r),...options};
  return {config,calls,logs,intake:createSupportIntake(config)};
}
async function httpFixture(t, options={}) {
  const b=backend(options);
  const server=createServer({env:{SUPPORT_INQUIRY_ENABLED:b.config.enabled===true?'true':'false',SUPPORT_GITHUB_TOKEN:b.config.token,SUPPORT_GITHUB_REPO:b.config.repo,SUPPORT_GITHUB_ASSIGNEE:b.config.assignee},fetchImpl:b.config.fetchImpl,log:b.config.log});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve)}));
  const post=(input,form=false,origin='https://infrastructureproductworks.com')=>fetch(`http://127.0.0.1:${server.address().port}/api/support`,{
    method:'POST',redirect:'manual',headers:{origin,'content-type':form?'application/x-www-form-urlencoded':'application/json'},
    body:form?new URLSearchParams(input):JSON.stringify(input)});
  const postRawForm=body=>fetch(`http://127.0.0.1:${server.address().port}/api/support`,{
    method:'POST',redirect:'manual',headers:{origin:'https://infrastructureproductworks.com','content-type':'application/x-www-form-urlencoded'},body});
  return {...b,post,postRawForm};
}

test('all displayed categories work for JSON and HTML form encodings', async t=>{
  const html=await readFile(new URL('../support/index.html',import.meta.url),'utf8');
  const select=html.match(/<select id="type"[^>]*>(.*?)<\/select>/s)[1];
  const types=[...select.matchAll(/<option>(.*?)<\/option>/g)].map(m=>m[1]);
  assert.deepEqual(types,TYPES);
  for(const form of [false,true]) for(const type of types) await t.test(`${form?'form':'json'} ${type}`,async t=>{
    const b=await httpFixture(t);const r=await b.post({...payload,type},form);
    assert.equal(r.status,form?303:201);
    if(form) {const u=new URL(r.headers.get('location'));assert.equal(u.searchParams.get('submitted'),'1');assert.match(u.searchParams.get('reference'),/^IPW-/);}
    else {const body=await r.json();assert.equal(body.accepted,true);assert.match(body.reference,/^IPW-/);assert.equal(body.url,undefined);}
    assert.equal(b.calls.filter(c=>c.url.endsWith('/issues')).length,1);
  });
});
test('legacy mappings are bounded; installation, unknowns and malformed shapes fail closed',async t=>{
  for(const [type,expected] of [['Product question','Portfolio question'],['Bug','Public demo issue'],['Feature request','Feedback']]) await t.test(type,async t=>{
    const b=await httpFixture(t);assert.equal((await b.post({...payload,type})).status,201);
    const body=JSON.parse(b.calls.find(c=>c.url.endsWith('/issues')).init.body).body;
    const record=JSON.parse(body.match(/^```json\n([\s\S]*?)\n```$/m)[1]);
    assert.equal(record.type,expected);
  });
  for(const input of [null,[],42,{...payload,type:'Installation'},{...payload,type:'unknown'},{...payload,type:'toString'}]) await t.test(JSON.stringify(input),async t=>{
    const b=await httpFixture(t);assert.equal((await b.post(input)).status,400);assert.equal(b.calls.length,0);
  });
});
test('untrusted origin, missing configuration and public target do not create issues',async t=>{
  const b=await httpFixture(t);assert.equal((await b.post(payload,false,'https://example.test')).status,403);assert.equal(b.calls.length,0);
  assert.equal((await backend({token:''}).intake.submit(payload)).status,503);
  const publicTarget=backend({fetchImpl:async()=>response({private:false})});
  assert.equal((await publicTarget.intake.submit(payload)).status,502);
});
test('concurrent and sequential identical submissions reuse one receipt without storing raw cache keys',async()=>{
  const b=backend();const results=await Promise.all([b.intake.submit(payload),b.intake.submit(payload)]);
  assert.deepEqual(results[0],results[1]);assert.deepEqual(await b.intake.submit(payload),results[0]);
  assert.equal(b.calls.filter(c=>c.url.endsWith('/issues')).length,1);
  assert.doesNotMatch(JSON.stringify(b.logs),/reader@example|Synthetic Reader|Synthetic question|synthetic-not-a-credential/);
});
test('cache capacity and expiry are bounded',async()=>{
  let now=0;const b=backend({maxEntries:1,ttlMs:10,now:()=>now});
  await b.intake.submit(payload);assert.equal((await b.intake.submit({...payload,title:'Second'})).status,503);
  now=11;assert.equal((await b.intake.submit({...payload,title:'Second'})).status,201);
});
test('assignment failure preserves created receipt but records unconfirmed routing',async()=>{
  const b=backend({fetchImpl:async(url)=>url.endsWith('/assignees')?response({},false):response(url.endsWith('/issues')?{number:7}:{private:true})});
  assert.equal((await b.intake.submit(payload)).status,201);
  assert.equal(b.logs.at(-1).outcome,'assignment_unconfirmed');
});
test('issue timeout aborts, returns uncertain outcome and never retries the issue POST',async()=>{
  let creates=0,signal;
  const b=backend({timeoutMs:10,fetchImpl:async(url,init)=>{
    if(url.endsWith('/issues')) {creates++;signal=init.signal;return new Promise(()=>{});}
    return response({private:true});
  }});
  const first=await b.intake.submit(payload);assert.equal(first.body.error,'submission_outcome_unknown');assert.equal(signal.aborted,true);
  assert.deepEqual(await b.intake.submit(payload),first);assert.equal(creates,1);
});
test('response-body timeout and malformed issue receipt cannot produce success',async()=>{
  for(const value of [{ok:true,json:()=>new Promise(()=>{})},response({})]) {
    const b=backend({timeoutMs:10,fetchImpl:async url=>url.endsWith('/issues')?value:response({private:true})});
    assert.equal((await b.intake.submit(payload)).body.error,'submission_outcome_unknown');
  }
});
test('honeypot has no downstream writes and is distinct from a genuine receipt',async t=>{
  const b=await httpFixture(t);const r=await b.post({...payload,website:'bot'});assert.equal(r.status,202);
  assert.equal((await r.json()).reference,undefined);assert.equal(b.calls.length,0);
});

test('signed Marketplace route retains signature validation',async t=>{
  const secret='synthetic-webhook-secret';
  const server=createServer({env:{GITHUB_MARKETPLACE_WEBHOOK_SECRET:secret}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve)}));
  const body=JSON.stringify({action:'synthetic'});
  const signature='sha256='+crypto.createHmac('sha256',secret).update(body).digest('hex');
  const url=`http://127.0.0.1:${server.address().port}/api/github/marketplace`;
  assert.equal((await fetch(url,{method:'POST',body})).status,401);
  assert.equal((await fetch(url,{method:'POST',body,headers:{'x-hub-signature-256':'sha256=invalid'}})).status,401);
  assert.equal((await fetch(url,{method:'POST',body,headers:{'x-hub-signature-256':signature}})).status,202);
});
test('browser uncertain-outcome message discourages automatic duplicate submission',async()=>{
  const source=await readFile(new URL('../assets/support.js',import.meta.url),'utf8');
  const element={};let finalUrl;
  vm.runInNewContext(source,{URLSearchParams,document:{getElementById:()=>element},window:{location:{search:'?submitted=0&reason=submission_outcome_unknown&reference=IPW-20261028-ABCDEF12',pathname:'/support/'}},history:{replaceState:(_,__,url)=>finalUrl=url}});
  assert.match(element.textContent,/Do not automatically resubmit/);
  assert.match(element.textContent,/IPW-20261028-ABCDEF12/);
  assert.equal(finalUrl,'/support/#ipw-support-form');
});

test('stalled uploads receive a bounded error without downstream calls',async t=>{
  let calls=0;
  const server=createServer({bodyTimeoutMs:25,fetchImpl:async()=>{calls++;throw new Error('unexpected transport')}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve)}));
  for(const contentType of ['application/json','application/x-www-form-urlencoded']){
    const result=await new Promise((resolve,reject)=>{
      const req=http.request({hostname:'127.0.0.1',port:server.address().port,path:'/api/support',method:'POST',headers:{origin:'https://infrastructureproductworks.com','content-type':contentType}},res=>{
        const parts=[];res.on('data',c=>parts.push(c));res.on('end',()=>resolve({status:res.statusCode,body:Buffer.concat(parts).toString(),location:res.headers.location}));
      });
      req.on('error',reject);req.setTimeout(2000,()=>req.destroy(new Error('test timed out')));
      req.write(contentType==='application/json'?'{':'name='); // Deliberately never end the upload.
    });
    if(contentType==='application/json'){assert.equal(result.status,408);assert.equal(JSON.parse(result.body).error,'submission_timeout');}
    else {assert.equal(result.status,303);assert.equal(new URL(result.location).searchParams.get('submitted'),'0');}
  }
  assert.equal(calls,0);
});

test('oversized uploads get an error receipt rather than losing the response',async t=>{
  const b=await httpFixture(t);const r=await b.post({...payload,description:'x'.repeat(40000)});
  assert.equal(r.status,413);assert.equal((await r.json()).error,'request_too_large');assert.equal(b.calls.length,0);
});

test('a disconnected upload does not produce an unhandled request error',async t=>{
  let calls=0;const server=createServer({fetchImpl:async()=>{calls++;throw new Error('unexpected transport')}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve)}));
  await new Promise(resolve=>{
    server.once('request',req=>{req.once('close',resolve);client.destroy()});
    const client=http.request({hostname:'127.0.0.1',port:server.address().port,path:'/api/support',method:'POST',headers:{origin:'https://infrastructureproductworks.com','content-type':'application/json'}});
    client.on('error',()=>{});client.write('{');
  });
  const health=await fetch(`http://127.0.0.1:${server.address().port}/health`);
  assert.equal(health.status,200);assert.equal(calls,0);
});

async function marketplaceFixture(t,options={}){
  const secret='synthetic-webhook-secret';
  const server=createServer({env:{GITHUB_MARKETPLACE_WEBHOOK_SECRET:secret},...options});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve)}));
  const base=`http://127.0.0.1:${server.address().port}`;
  const signed=body=>fetch(`${base}/api/github/marketplace`,{method:'POST',body,headers:{'x-hub-signature-256':'sha256='+crypto.createHmac('sha256',secret).update(body).digest('hex')}});
  return {server,base,signed};
}

test('Marketplace rejects an oversized signed upload and preserves its failure response',async t=>{
  const {signed}=await marketplaceFixture(t,{marketplaceBodyMaxBytes:128});
  const res=await signed(JSON.stringify({action:'synthetic',padding:'x'.repeat(256)}));
  assert.equal(res.status,413);assert.equal(await res.text(),'Request too large');
});

test('Marketplace accepts signed bodies beyond the inquiry limit without changing byte verification',async t=>{
  const {signed}=await marketplaceFixture(t);
  const body=JSON.stringify({action:'synthetic',padding:'x'.repeat(40000)});
  assert.equal((await signed(body)).status,202);
});

test('Marketplace stalled uploads receive a bounded timeout response',async t=>{
  const {server}=await marketplaceFixture(t,{bodyTimeoutMs:25});
  const result=await new Promise((resolve,reject)=>{
    const req=http.request({hostname:'127.0.0.1',port:server.address().port,path:'/api/github/marketplace',method:'POST'},res=>{
      const parts=[];res.on('data',c=>parts.push(c));res.on('end',()=>resolve({status:res.statusCode,body:Buffer.concat(parts).toString()}));
    });
    req.on('error',reject);req.setTimeout(2000,()=>req.destroy(new Error('test timed out')));req.write('{');
  });
  assert.equal(result.status,408);assert.equal(result.body,'Request timeout');
});

test('Marketplace client disconnect leaves the receiver healthy',async t=>{
  const {server,base}=await marketplaceFixture(t);
  await new Promise(resolve=>{
    server.once('request',req=>{req.once('close',resolve);client.destroy()});
    const client=http.request({hostname:'127.0.0.1',port:server.address().port,path:'/api/github/marketplace',method:'POST'});
    client.on('error',()=>{});client.write('{');
  });
  assert.equal((await fetch(`${base}/health`)).status,200);
});

test('inquiry processing fails closed without the current purpose request in either encoding',async t=>{
  const invalid=[undefined,false,'false','true',['requested','false'],{},'marketing'];
  for(const form of [false,true]) for(const choice of invalid){
    const b=await httpFixture(t);
    const input={...payload,inquiryProcessing:choice};if(choice===undefined)delete input.inquiryProcessing;
    const res=await b.post(input,form);
    assert.equal(res.status,form?303:400);
    if(form)assert.equal(new URL(res.headers.get('location')).searchParams.get('submitted'),'0');
    else assert.equal((await res.json()).error,'inquiry_processing_request_required');
    assert.equal(b.calls.length,0);
  }
});

test('core intake rejects missing or stale notice versions before any downstream request',async()=>{
  for(const version of [undefined,'old-version',INQUIRY_NOTICE_VERSION+' ',true,{}]){
    const b=backend();const res=await b.intake.submit({...payload,privacyNoticeVersion:version});
    assert.equal(res.status,400);assert.equal(b.calls.length,0);
  }
});

test('operator enablement is explicit and denied by default',async t=>{
  for(const enabled of [undefined,false,'true']){
    const b=backend({enabled});assert.equal((await b.intake.submit(payload)).status,503);assert.equal(b.calls.length,0);
  }
  const b=await httpFixture(t,{enabled:false});assert.equal((await b.post(payload)).status,503);assert.equal(b.calls.length,0);
  const server=createServer({env:{SUPPORT_GITHUB_TOKEN:'synthetic',SUPPORT_GITHUB_REPO:'example/private-inbox'},fetchImpl:async()=>{throw new Error('unexpected transport')}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve)}));
  const res=await fetch(`http://127.0.0.1:${server.address().port}/api/support`,{method:'POST',headers:{origin:'https://infrastructureproductworks.com','content-type':'application/json'},body:JSON.stringify(payload)});
  assert.equal(res.status,503);assert.equal((await res.json()).error,'support_intake_disabled');
});

test('form choice is unchecked and the private receipt binds purpose, notice and server time',async()=>{
  const html=await readFile(new URL('../support/index.html',import.meta.url),'utf8');
  const checkbox=html.match(/<input[^>]+id="inquiry-processing"[^>]*>/)[0];
  assert.match(checkbox,/type="checkbox"/);assert.match(checkbox,/required/);assert.doesNotMatch(checkbox,/\schecked(?:\s|=|>)/);
  assert.ok(html.includes(`name="privacyNoticeVersion" value="${INQUIRY_NOTICE_VERSION}"`));
  const privacy=await readFile(new URL('../privacy/index.html',import.meta.url),'utf8');
  assert.ok(privacy.includes(INQUIRY_NOTICE_VERSION));assert.ok(privacy.includes('id="inquiries"'));
  const b=backend({now:()=>Date.UTC(2026,9,29)});assert.equal((await b.intake.submit(payload)).status,201);
  const issue=JSON.parse(b.calls.find(c=>c.url.endsWith('/issues')).init.body);
  assert.ok(issue.body.includes(`Privacy notice: ${INQUIRY_NOTICE_VERSION}`));
  assert.match(issue.body,/Processing requested: inquiry-response/);assert.match(issue.body,/2026-10-29T00:00:00.000Z/);
  assert.doesNotMatch(JSON.stringify(b.logs),/reader@example|Synthetic Reader/);
});

test('conflicting form choices cannot be accepted by taking the last value',async t=>{
  const b=backend();const server=createServer({env:{SUPPORT_INQUIRY_ENABLED:'true',SUPPORT_GITHUB_TOKEN:b.config.token,SUPPORT_GITHUB_REPO:b.config.repo},fetchImpl:b.config.fetchImpl});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve)}));
  for(const field of ['inquiryProcessing','privacyNoticeVersion']){
    const body=new URLSearchParams(payload);body.append(field,payload[field]);
    const res=await fetch(`http://127.0.0.1:${server.address().port}/api/support`,{method:'POST',redirect:'manual',headers:{origin:'https://infrastructureproductworks.com'},body});
    assert.equal(res.status,303);assert.equal(new URL(res.headers.get('location')).searchParams.get('submitted'),'0');
  }
  assert.equal(b.calls.length,0);
});

test('submitted fields remain literal data and cannot close the issue record fence',async()=>{
  const hostile='![image](https://example.invalid/pixel)\n<img src="https://example.invalid/raw">\n@someone\n```\n``````\n~~~\n[link](https://example.invalid/)';
  const b=backend();const input={...payload,name:hostile,description:hostile,steps:hostile,environment:hostile};
  assert.equal((await b.intake.submit(input)).status,201);
  const body=JSON.parse(b.calls.find(c=>c.url.endsWith('/issues')).init.body).body;
  const blocks=[...body.matchAll(/^```json\n([\s\S]*?)\n```$/gm)];
  assert.equal(blocks.length,1,'one closed literal record is required');
  const record=JSON.parse(blocks[0][1]);
  for(const field of ['name','description','steps','environment'])assert.equal(record[field],hostile);
  assert.doesNotMatch(blocks[0][1],/`/,'data cannot close or introduce a fence');
  const outside=body.replace(blocks[0][0],'');
  assert.doesNotMatch(outside,/example\.invalid|@someone|<img|!\[/);
  assert.doesNotMatch(JSON.stringify(b.logs),/example\.invalid|@someone/);
});

test('literal records preserve bounded text without forwarding undeclared fields',async()=>{
  const input={...payload,name:'`'.repeat(100),title:'`'.repeat(140),description:'`'.repeat(5000),steps:'`'.repeat(4000),environment:'`'.repeat(500),undeclared:'must-not-be-forwarded'};
  const b=backend();assert.equal((await b.intake.submit(input)).status,201);
  const body=JSON.parse(b.calls.find(c=>c.url.endsWith('/issues')).init.body).body;
  const record=JSON.parse(body.match(/^```json\n([\s\S]*?)\n```$/m)[1]);
  for(const field of ['name','title','description','steps','environment'])assert.equal(record[field],input[field]);
  assert.equal(record.undeclared,undefined);assert.doesNotMatch(body,/must-not-be-forwarded/);
  assert.ok(Buffer.byteLength(body,'utf8')<65536,'bounded field expansion fits the issue record');
});



test('ambiguous JSON consent, escaped duplicate keys and invalid encoding stop before downstream calls', async t => {
  const base=JSON.stringify(payload);
  const cases=[
    base.replace('"inquiryProcessing":"requested"','"inquiryProcessing":false,"inquiryProcessing":"requested"'),
    base.replace('"inquiryProcessing":"requested"','"inquiryProcessing":"requested","inquiryProcessing":false'),
    base.replace('"inquiryProcessing":"requested"','"inquiryProcessing":false,"inquiry\\u0050rocessing":"requested"'),
    base.replace('"privacyNoticeVersion":','"privacyNoticeVersion":"stale","privacyNoticeVersion":'),
    base.slice(0,-1)+',"extra":{"key":1,"key":2}}',
    base.slice(0,-1)+',"extra":'+ '['.repeat(40)+'0'+']'.repeat(40)+'}',
    Buffer.from([0xff]), Buffer.from('\ufeff'+base)
  ];
  for (let i=0;i<cases.length;i++) await t.test(String(i),async t=>{
    const b=backend();
    const server=createServer({env:{SUPPORT_INQUIRY_ENABLED:'true',SUPPORT_GITHUB_TOKEN:b.config.token,SUPPORT_GITHUB_REPO:b.config.repo},fetchImpl:b.config.fetchImpl,log:b.config.log});
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve)}));
    const result=await fetch(`http://127.0.0.1:${server.address().port}/api/support`,{method:'POST',headers:{origin:'https://infrastructureproductworks.com','content-type':'application/json'},body:cases[i]});
    assert.equal(result.status,400);assert.deepEqual(await result.json(),{error:'invalid_submission'});
    assert.equal(b.calls.length,0);assert.equal(b.logs.length,0);
  });
});

test('strict parser preserves valid JSON values, escaped strings and separate object scopes',()=>{
  for (const value of [null,true,false,42,0,-0,'quotes " and \\ escapes',[],{},
    {one:{key:1},two:{key:2},items:[1,'a',null,{'__proto__':3}]},
    {nested:['unicode \u2603', {'punctuation':'a,b}[]:c'}]}]) {
    const raw=JSON.stringify(value);
    assert.deepEqual(parseUnambiguousJson(Buffer.from(raw)),JSON.parse(raw));
  }
  for (const raw of ['{"a":1,"\\u0061":2}','[', '1 2', '{"x":NaN}', '"unterminated']) {
    assert.throws(()=>parseUnambiguousJson(Buffer.from(raw)));
  }
  assert.deepEqual(parseUnambiguousJson(Buffer.from('{"__proto__":1}')),JSON.parse('{"__proto__":1}'));
  assert.throws(()=>parseUnambiguousJson(Buffer.from('{"__proto__":1,"__proto__":2}')));
});

test('Marketplace telemetry permits only bounded routing metadata',()=>{
  const delivery='12345678-ABCD-1234-ABCD-1234567890AB', date='2026-10-29T17:00:00.000Z';
  for (const action of ['purchased','changed','cancelled','pending_change','pending_change_cancelled']) {
    assert.deepEqual(marketplaceTelemetry('marketplace_purchase',{action,email:'canary@example.test'},delivery,date),
      {event:'marketplace_purchase',action,delivery:delivery.toLowerCase(),receivedAt:date});
  }
  for (const input of [null,[],{},'canary@example.test', {action:{email:'canary@example.test'}}, {action:'canary@example.test'}, {action:'x'.repeat(100000)}]) {
    const result=marketplaceTelemetry('canary@example.test',input,'canary@example.test',date);
    assert.deepEqual(result,{event:'unrecognized',action:null,delivery:null,receivedAt:date});
    assert.doesNotMatch(JSON.stringify(result),/canary|xxxxx/);
  }
  assert.equal(marketplaceTelemetry('ping',{action:'purchased'},[],date).action,null);
});

test('signed Marketplace HTTP requests minimize logs; ambiguous payloads and bad signatures log nothing',async t=>{
  const secret='synthetic-webhook-secret',logs=[];
  const server=createServer({env:{GITHUB_MARKETPLACE_WEBHOOK_SECRET:secret},log:r=>logs.push(r)});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve)}));
  const url=`http://127.0.0.1:${server.address().port}/api/github/marketplace`;
  const post=(body,valid=true)=>fetch(url,{method:'POST',body,headers:{
    'x-hub-signature-256':valid?'sha256='+crypto.createHmac('sha256',secret).update(body).digest('hex'):'sha256=invalid',
    'x-github-event':'canary@example.test','x-github-delivery':'canary@example.test'}});
  const body=JSON.stringify({action:{email:'canary@example.test'},account:{email:'canary@example.test'}});
  assert.equal((await post(body)).status,202);assert.equal(logs.length,1);
  assert.equal(logs[0].event,'unrecognized');assert.equal(logs[0].action,null);assert.equal(logs[0].delivery,null);
  assert.match(logs[0].receivedAt,/^\d{4}-\d{2}-\d{2}T/);
  assert.doesNotMatch(JSON.stringify(logs),/canary|account|email/);
  for (const raw of ['{"action":"purchased","action":"cancelled"}','{',body]) {
    const valid=raw!==body;
    assert.equal((await post(raw,valid)).status,valid?400:401);assert.equal(logs.length,1);
  }
});

test('duplicate contact and topic fields in HTML forms also stop before provider access',async t=>{
  for (const [key,value] of [['email','other@example.test'],['name','Another Reader'],['type','Feedback']]) await t.test(key,async t=>{
    const b=backend();const server=createServer({env:{SUPPORT_INQUIRY_ENABLED:'true',SUPPORT_GITHUB_TOKEN:b.config.token,SUPPORT_GITHUB_REPO:b.config.repo},fetchImpl:b.config.fetchImpl});
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve)}));
    const params=new URLSearchParams(payload);params.append(key,value);
    const result=await fetch(`http://127.0.0.1:${server.address().port}/api/support`,{method:'POST',redirect:'manual',headers:{origin:'https://infrastructureproductworks.com','content-type':'application/x-www-form-urlencoded'},body:params});
    assert.equal(result.status,303);assert.equal(new URL(result.headers.get('location')).searchParams.get('reason'),'invalid_submission');assert.equal(b.calls.length,0);
  });
});

test('strict parser matches native JSON across deterministic nested valid values and depth boundaries',()=>{
  let state=17;
  const next=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state;};
  const build=depth=>{
    if(!depth) return [null,true,false,next(), 'quote"slash\\unicode☃'][next()%5];
    const values=Array.from({length:next()%5},()=>build(depth-1));
    return next()%2?values:Object.fromEntries(values.map((v,i)=>['key'+i,v]));
  };
  for(let i=0;i<1000;i++) {
    const raw=JSON.stringify(build(4));
    assert.deepEqual(parseUnambiguousJson(Buffer.from(raw)),JSON.parse(raw));
  }
  assert.deepEqual(parseUnambiguousJson(Buffer.from('['.repeat(32)+'0'+']'.repeat(32))),JSON.parse('['.repeat(32)+'0'+']'.repeat(32)));
  assert.throws(()=>parseUnambiguousJson(Buffer.from('['.repeat(33)+'0'+']'.repeat(33))));
});

test('malformed form encoding cannot silently change inquiry records',async t=>{
  const base=new URLSearchParams(payload).toString();
  const cases=[
    ['bare percent',base.replace('Synthetic+question+only.','Synthetic%question+only.')],
    ['short escape',base.replace('Synthetic+question+only.','Synthetic+question%2')],
    ['nonhex escape',base.replace('Synthetic+question+only.','Synthetic+question%GG')],
    ['incomplete UTF-8',base.replace('reader%40', 'reader%E2%82%40')],
    ['overlong UTF-8',base.replace('reader%40', 'reader%C0%AF%40')],
    ['encoded surrogate',base.replace('reader%40', 'reader%ED%A0%80%40')],
    ['invalid encoded field name',base+'&unused%FF=value'],
    ['invalid raw byte',Buffer.concat([Buffer.from(base.slice(0,base.indexOf('reader%40'))+'reader'),Buffer.from([0xff]),Buffer.from(base.slice(base.indexOf('reader%40')+'reader'.length))])]
  ];
  for(const [label,body] of cases) await t.test(label,async t=>{
    const b=await httpFixture(t);const result=await b.postRawForm(body);
    assert.equal(result.status,303);
    const location=new URL(result.headers.get('location'));
    assert.equal(location.searchParams.get('submitted'),'0');
    assert.equal(location.searchParams.get('reason'),'invalid_submission');
    assert.equal(b.calls.length,0,'malformed text must not reach any provider request');
    assert.equal(b.logs.length,0,'submitted data must not reach application logs');
  });
});

test('valid browser form encoding preserves Unicode, literal percent, plus and delimiters',async t=>{
  const input={...payload,name:'Zoë 雪 🙂',description:'Literal % + & = and café; do not reinterpret.'};
  const b=await httpFixture(t);const result=await b.postRawForm(new URLSearchParams(input).toString());
  assert.equal(result.status,303);assert.equal(new URL(result.headers.get('location')).searchParams.get('submitted'),'1');
  const issue=JSON.parse(b.calls.find(c=>c.url.endsWith('/issues')).init.body);
  const record=JSON.parse(issue.body.match(/^```json\n([\s\S]*?)\n```$/m)[1]);
  assert.equal(record.name,input.name);assert.equal(record.description,input.description);
});

test('strict form decoding preserves browser encoding semantics across generated values',()=>{
  const values=['','plain','Zoë 雪 🙂','a+b c%&=','\uFFFD','\0','\uFEFF','\r\n','quote" slash\\','x'.repeat(5000)];
  for(let i=0;i<500;i++){
    const entries=[['field'+i,values[i%values.length]],['other',values[(i*7+3)%values.length]]];
    const raw=new URLSearchParams(entries).toString();
    assert.deepEqual(parseUnambiguousForm(Buffer.from(raw)),Object.fromEntries(new URLSearchParams(raw)));
  }
  for(const raw of ['&&a=one=two&b&','x=%2B+%25%26%3D','%5F%5Fproto%5F%5F=safe&constructor=data']){
    assert.deepEqual(parseUnambiguousForm(Buffer.from(raw)),Object.fromEntries(new URLSearchParams(raw)));
  }
});

test('encoded aliases of contact and purpose keys remain duplicate denials',async t=>{
  for(const extra of ['%65mail=other%40example.test','inquiry%50rocessing=requested','privacyNotice%56ersion='+INQUIRY_NOTICE_VERSION]) await t.test(extra.split('=')[0],async t=>{
    const b=await httpFixture(t);const result=await b.postRawForm(new URLSearchParams(payload).toString()+'&'+extra);
    assert.equal(new URL(result.headers.get('location')).searchParams.get('reason'),'invalid_submission');
    assert.equal(b.calls.length,0);assert.equal(b.logs.length,0);
  });
});

function rateClock(options={}) {
  let time=0,unrefs=0;
  const pending=new Map();
  const limiter=createInquiryRateLimiter({windowMs:10,max:2,maxClients:2,...options,
    now:()=>time,
    setTimer:(fn,delay)=>{const handle={unref(){unrefs++;}};pending.set(handle,{fn,at:time+delay});return handle;},
    clearTimer:handle=>pending.delete(handle)});
  return {limiter,pending,get unrefs(){return unrefs;},
    advance(value){time=value;for(;;){const due=[...pending].find(([,job])=>job.at<=time);if(!due)break;pending.delete(due[0]);due[1].fn();}},
    jump(value){time=value;}};
}

test('rate state expires without a later request',()=>{
  const clock=rateClock();assert.equal(clock.limiter.limited('192.0.2.1'),false);
  assert.equal(clock.limiter.trackedClients,1);clock.advance(10);
  assert.equal(clock.limiter.trackedClients,0);assert.equal(clock.pending.size,0);
});

test('sliding window preserves later requests and boundary expiry',()=>{
  const clock=rateClock();assert.equal(clock.limiter.limited('192.0.2.1'),false);
  clock.advance(5);assert.equal(clock.limiter.limited('192.0.2.1'),false);
  assert.equal(clock.limiter.limited('192.0.2.1'),true);
  clock.advance(10);assert.equal(clock.limiter.trackedClients,1);
  assert.equal(clock.limiter.limited('192.0.2.1'),false);
  assert.equal(clock.limiter.limited('192.0.2.1'),true);
  clock.advance(20);assert.equal(clock.limiter.trackedClients,0);
});

test('full rate capacity denies new clients without evicting active limits',()=>{
  const clock=rateClock();
  for(const address of ['192.0.2.1','192.0.2.2']){
    assert.equal(clock.limiter.limited(address),false);assert.equal(clock.limiter.limited(address),false);
  }
  for(let i=0;i<20;i++)assert.equal(clock.limiter.limited('192.0.2.'+(i+3)),true);
  assert.equal(clock.limiter.trackedClients,2);assert.equal(clock.limiter.limited('192.0.2.1'),true);
  clock.advance(10);assert.equal(clock.limiter.limited('192.0.2.3'),false);
});

test('denied retries do not extend retention or the rate window',()=>{
  const clock=rateClock();clock.limiter.limited('192.0.2.1');clock.limiter.limited('192.0.2.1');
  clock.advance(9);assert.equal(clock.limiter.limited('192.0.2.1'),true);
  clock.advance(10);assert.equal(clock.limiter.trackedClients,0);
  assert.equal(clock.limiter.limited('192.0.2.1'),false);
});

test('one unreferenced expiry timer remains bounded under repeated traffic',()=>{
  const clock=rateClock();
  for(let i=0;i<1000;i++){clock.limiter.limited('192.0.2.1');assert.equal(clock.pending.size,1);}
  assert.equal(clock.unrefs,1000);clock.advance(10);assert.equal(clock.pending.size,0);
});

test('late expiry callbacks prune all elapsed state without a request',()=>{
  const clock=rateClock();clock.limiter.limited('192.0.2.1');clock.advance(4);clock.limiter.limited('192.0.2.2');
  clock.advance(100);assert.equal(clock.limiter.trackedClients,0);assert.equal(clock.pending.size,0);
});

test('rate shutdown clears state and timer and permits a fresh process lifecycle',()=>{
  const clock=rateClock();clock.limiter.limited('192.0.2.1');clock.limiter.limited('192.0.2.1');
  clock.limiter.clear();assert.equal(clock.limiter.trackedClients,0);assert.equal(clock.pending.size,0);
  clock.advance(100);assert.equal(clock.limiter.limited('192.0.2.1'),false);
  clock.limiter.clear();assert.equal(clock.pending.size,0);
});

test('request-time expiry recovers capacity even before a delayed timer runs',()=>{
  const clock=rateClock();clock.limiter.limited('192.0.2.1');clock.limiter.limited('192.0.2.2');
  clock.jump(20);assert.equal(clock.limiter.limited('192.0.2.3'),false);
  assert.equal(clock.limiter.trackedClients,1);assert.equal(clock.pending.size,1);
});

test('HTTP admission retains six-request limit and blocks the seventh before providers',async t=>{
  const b=await httpFixture(t);
  for(let i=0;i<6;i++)assert.equal((await b.post({...payload,title:'Synthetic inquiry '+i})).status,201);
  const calls=b.calls.length,logs=b.logs.length;
  const result=await b.post({...payload,title:'Synthetic seventh inquiry'});
  assert.equal(result.status,429);assert.equal((await result.json()).error,'rate_limited');
  assert.equal(b.calls.length,calls);assert.equal(b.logs.length,logs);
});

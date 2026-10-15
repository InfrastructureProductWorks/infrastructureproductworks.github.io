const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context={document:{addEventListener(){}},console};
vm.createContext(context);
vm.runInContext(fs.readFileSync('assets/portfolio.js','utf8'),context);
const valid=value=>{context.input=value;return vm.runInContext('validPublicPortfolioText(input)',context);};
const unknown=['PrivatePartner','secret-repo'].join('/');
const guard=['InfrastructureProductWorks','iaap-guard'].join('/');
const host=['github','com'].join('.')+'/';
const app=host+['apps','iaap-guard'].join('/');
const negatives=[
  ...['%80','%C0%AF','%C3%28','%ED%A0%80','%F4%90%80%80','%E2%82'].flatMap(value=>[value,encodeURIComponent(value)]),
  ...['Tab','NewLine','commat'].map(entity=>'InfrastructureProductWorks&'+entity+'/iaap-guard'),
  unknown,unknown.toUpperCase(),'x/y','crash/restart','`'+unknown+'`','('+unknown+')',
  'before '+unknown+' after',unknown.replace('/','%2F'),unknown.replace('/','&#47;'),
  unknown.replace('/','&sol;'),unknown.replace('/','\\/'),unknown.replace('/','\\u002f'),
  unknown.replace('-','\\-'),unknown+'/file',guard+'/../private-repo',
  guard+'/../../'+unknown,unknown+'/../../'+guard,host+unknown+'/../../'+guard,
  guard+'/./file','./'+guard,host+guard+'/../private-repo/../iaap-guard',
  unknown+'/'+host+guard,unknown+'/'+app,host+guard+' '+unknown,app+' '+unknown,
  unknown+' '+app,'apps/iaap-guard',app.replace('com/','com:'),app+'/extra',app+'.git',app+'/'+unknown,
  'https:'+['','',host+guard].join('/'),'git@'+host.replace(/\/$/,':')+unknown,
  'a'.repeat(40),'evidence '+ 'B'.repeat(40)+' suffix',
  ['portfolio-bundle','v2'].join('/'),['portfolio-presentation','v1'].join('/')
];
// Known restricted slugs must not leak as bare text, including encoded forms.
const privateNames=vm.runInContext('PRIVATE_PORTFOLIO_NAMES',context);
for(const name of privateNames){
  negatives.push('\\x'+name.charCodeAt(0).toString(16)+name.slice(1),'\\u{'+name.charCodeAt(0).toString(16)+'}'+name.slice(1));
  for(let depth=1;depth<=10;depth++){
    const escaped='\\u'+name.charCodeAt(0).toString(16).padStart(4,'0')+name.slice(1);
    const nested=escaped.replace('\\','\\u005c'+'u005c'.repeat(depth-1));
    negatives.push(nested,encodeURIComponent(nested));
  }
  for(const value of [name,name.toUpperCase(),'prefix-'+name+'-suffix','Evidence '+name+'.git',
    [...name].map(c=>'%'+c.charCodeAt(0).toString(16)).join(''),
    [...name].map(c=>'&#'+c.charCodeAt(0)+';').join(''),
    [...name].map(c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0')).join('')])negatives.push(value);
}
// Query/search paths must not turn a declared public repository into a carrier
// for a second, undeclared repository coordinate.
for(const prefix of [host+'search?q=',host+guard+'/search?q=',host+guard+'?q=']){
  for(const query of ['repo:'+unknown, 'repo:'+unknown+' repo:'+guard, unknown]){
    negatives.push(prefix+query,prefix+encodeURIComponent(query),prefix+encodeURIComponent(encodeURIComponent(query)));
  }
}
for(const suffix of [';private','@private','!private',':private','%3Bprivate','/','?q=private','#private',')',',','.'])negatives.push(app+suffix);
for(const suffix of [unknown,'blob/main/'+unknown,'tree/main/file','blob/topic/file','blob/main/file/extra','issues/1/extra','pull/name','main/'+unknown,'blob/main/.hidden']){
  for(const base of [guard,host+guard,['raw','githubusercontent','com'].join('.')+'/'+guard]){
    const value=base+'/'+suffix;negatives.push(value,encodeURIComponent(value),encodeURIComponent(encodeURIComponent(value)));
  }
}
for(const route of [guard,guard+'/issues/123',guard+'/pull/12',guard+'/blob/main/file',['raw','githubusercontent','com'].join('.')+'/'+guard+'/main/file'])for(const suffix of [';private',':private','@private','/','?private','#private',')'])negatives.push(route+suffix);
for(const route of [app,guard,host+guard,guard+'/issues/123',guard+'/pull/12',guard+'/blob/main/file',['raw','githubusercontent','com'].join('.')+'/'+guard+'/main/file']){
  for(const space of ['%09','%0A','%0D','%2509','&#9;','%20','%2520','&#32;','&amp;#32;','\\u0020','%C2%A0','&#160;']){
    for(const tail of ['/private',' private',''])negatives.push(route+space+tail);
  }
}
for(const code of [...Array(32).keys(),...Array.from({length:33},(_,i)=>127+i),...Array.from({length:32},(_,i)=>0xfdd0+i),...Array.from({length:17},(_,i)=>[i*65536+65534,i*65536+65535]).flat()]){
  for(const route of [app,guard,host+guard,guard+'/blob/main/file']){
    for(const suffix of [String.fromCodePoint(code),'&#'+code+';','&#x'+code.toString(16)+';',encodeURIComponent(String.fromCodePoint(code)),'\\u'+code.toString(16).padStart(4,'0')]){
      negatives.push(route+suffix,route+suffix+'/private',route+encodeURIComponent(suffix));
    }
  }
}
for(const markup of ['<wbr>','<!-- -->','<span></span>','<b>','</b>']){
  for(const value of ['PrivatePartner/'+markup+'secret-repo',guard+markup,app+markup]){
    negatives.push(value,encodeURIComponent(value),encodeURIComponent(encodeURIComponent(value)),value.replaceAll('<','&lt;').replaceAll('>','&gt;'));
  }
}
for(const marker of ['*','**','~','~~','[',']','`']){
  for(const value of ['PrivatePartner/'+marker+'secret-repo',guard+marker])negatives.push(value,encodeURIComponent(value),encodeURIComponent(encodeURIComponent(value)));
}
let ignorableCount=0;
for(let code=0;code<=0x10ffff;code++){
  const char=String.fromCodePoint(code);
  if(/\p{Default_Ignorable_Code_Point}/u.test(char)){
    ignorableCount++;
    negatives.push('PrivatePartner/'+char+'secret-repo');
    if(code>0xffff){
      const pair='\\u'+(0xd800+((code-0x10000)>>10)).toString(16)+'\\u'+(0xdc00+((code-0x10000)&1023)).toString(16);
      negatives.push('PrivatePartner/'+pair+'secret-repo',encodeURIComponent('PrivatePartner/'+pair+'secret-repo'));
    }
  }
}
assert.equal(ignorableCount,4174,'Complete default-ignorable class must be covered');
for(const char of ['\u034f','\u180b','\u200b','\u3164','\u{e0100}']){
  for(const value of ['PrivatePartner/'+char+'secret-repo',guard+char,app+char])negatives.push(encodeURIComponent(value),encodeURIComponent(encodeURIComponent(value)));
}
negatives.push('Public \\ud800 text','Public \\udfff text');
let encoded=unknown;
for(let i=0;i<10;i++){encoded=encodeURIComponent(encoded);negatives.push(encoded);}
for(const first of 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.'){
  const text='//'+first+'.internal';negatives.push(text,encodeURIComponent(text));
}
for(let code=0;code<33;code++){
  for(const text of ['//'+String.fromCodePoint(code)+'s.internal',...(code<32?['/'+String.fromCodePoint(code)+'/s.internal']:[])]){
    negatives.push(text,encodeURIComponent(text),encodeURIComponent(encodeURIComponent(text)));
  }
}
for(const text of negatives){
  for(const input of [{dashboard:{products:[{evidence:text}]}},{presentation:{nested:[text]}},{presentation:{[text]:'value'}},{dashboard:{products:[{versions:{[text]:'v1'}}]}}]){
    assert.equal(valid(input),false,JSON.stringify(input));
  }
}
const positives=['Public emoji 😀','Public emoji \\ud83d\\ude00','Public evidence','100% bounded validation','/forge/','/storefront/',app,
  'www.'+app,app+' public app','a'.repeat(64),'b'.repeat(64)];
for(const slug of ['iaap-guard','ai-powered-infrastructure-as-a-product','infrastructureproductworks.github.io']){
  const repo=['InfrastructureProductWorks',slug].join('/');
  positives.push(repo,repo.toUpperCase(),repo+'.git',repo+'/blob/main/file',repo+'/issues/12',repo+'/pull/34',host+repo,
    ['github','dev'].join('.')+'/'+repo,['raw','githubusercontent','com'].join('.')+'/'+repo+'/main/file',
    ['api','github','com'].join('.')+'/repos/'+repo,['vscode','dev'].join('.')+'/github/'+repo);
}
for(const route of [app,guard,guard+'/issues/12',guard+'/blob/main/file'])positives.push(encodeURIComponent(route),encodeURIComponent(encodeURIComponent(route)),route.replaceAll('/','&amp;sol;'));
for(const text of positives)assert.equal(valid({presentation:{text}}),true,text);
const schemas={schemaVersion:'portfolio-bundle/v2',dashboard:{schemaVersion:'portfolio-dashboard/v2'},
  roadmap:{schemaVersion:'roadmap-relationship-view/v6',progressModel:{method:'evidence-backed-epic-rollup/v1'},forecastModel:{method:'linear-evidence-trend/v1'}},
  presentation:{schemaVersion:'portfolio-presentation/v1'}};
assert.equal(valid(schemas),true);
for(const input of [{presentation:{schemaVersion:'portfolio-presentation/v2'}},{presentation:{nested:{schemaVersion:'portfolio-presentation/v1'}}},{presentation:{'portfolio-presentation/v1':'value'}},{'roadmap.progressModel.method':'evidence-backed-epic-rollup/v1'}]){
  assert.equal(valid(input),false,JSON.stringify(input));
}
// Public source identities preserve each exact source through a domain-separated
// commitment; the consumer retains the field without exposing a repository path.
const crypto=require('node:crypto');
const sourceRoadmap=JSON.parse(fs.readFileSync('data/roadmap-relationships.json','utf8'));
const sourceCommitted=JSON.parse(JSON.stringify(sourceRoadmap));
for(const kr of sourceCommitted.keyResults){
  kr.source='evidence-source-'+crypto.createHash('sha256').update('ipw-public-evidence/v1:measure-source:'+kr.source).digest('hex');
  assert.equal(valid({roadmap:{keyResults:[{source:kr.source}]}}),true);
}
context.sourceCommitted=sourceCommitted;
assert.equal(vm.runInContext('validRoadmapRelationships(sourceCommitted)',context),true,'Committed provenance must retain the structural roadmap contract');
for(let index=0;index<sourceCommitted.keyResults.length;index++){
  const projected=sourceCommitted.keyResults[index],original=sourceRoadmap.keyResults[index];
  assert.equal(projected.source.length,'evidence-source-'.length+64);
  assert.deepEqual({...projected,source:original.source},original,'Source projection must preserve all other measure fields');
}
if(process.argv[2]){
  context.input=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
  assert.equal(vm.runInContext('validPortfolioBundle(input)',context),true,'Real producer output must satisfy both text and structural contracts');
  for(const kr of context.input.roadmap.keyResults)assert.match(kr.source,/^evidence-source-[0-9a-f]{64}$/,'Every public measure must retain its opaque source commitment');
}
console.log(`Portfolio publication boundary: ${negatives.length*4} negative placements, ${positives.length} allowed texts and exact schema scopes PASS`);

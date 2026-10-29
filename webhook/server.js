import http from 'node:http';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {PRODUCTS, inquiryType} from './inquiry-contract.js';
import {createSupportIntake} from './support-intake.js';

export function createServer({env = process.env, fetchImpl = fetch, timeoutMs = 5000, bodyTimeoutMs = 10000, marketplaceBodyMaxBytes = 25 * 1024 * 1024, log} = {}) {

const secret = env.GITHUB_MARKETPLACE_WEBHOOK_SECRET;
const supportToken = env.SUPPORT_GITHUB_TOKEN;
const supportRepo = env.SUPPORT_GITHUB_REPO || '';
const supportAssignee = env.SUPPORT_GITHUB_ASSIGNEE || '';
const allowedOrigins = new Set([
  'https://infrastructureproductworks.com',
  'https://www.infrastructureproductworks.com'
]);
const rate = new Map();
const intake = createSupportIntake({enabled:env.SUPPORT_INQUIRY_ENABLED==='true',token:supportToken,repo:supportRepo,assignee:supportAssignee,fetchImpl,timeoutMs,log});

function safeEqual(a,b){const x=Buffer.from(a);const y=Buffer.from(b);return x.length===y.length&&crypto.timingSafeEqual(x,y)}
function json(res,status,body,origin){
  const headers={'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'};
  if(origin&&allowedOrigins.has(origin)){headers['access-control-allow-origin']=origin;headers['vary']='Origin'}
  res.writeHead(status,headers);res.end(JSON.stringify(body));
}
function supportResult(res,formMode,status,body,origin){
  if(!formMode)return json(res,status,body,origin);
  const targetOrigin=allowedOrigins.has(origin)?origin:'https://infrastructureproductworks.com';
  const params=new URLSearchParams();
  params.set('submitted',body.accepted?'1':'0');
  if(body.reference)params.set('reference',body.reference);
  if(!body.accepted&&body.error)params.set('reason',body.error);
  res.writeHead(303,{
    'location':`${targetOrigin}/support/?${params.toString()}#support-form`,
    'cache-control':'no-store',
    'x-content-type-options':'nosniff'
  });
  res.end();
}
function clean(value,max){return typeof value==='string'?value.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,'').slice(0,max):''}
function validEmail(value){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)&&value.length<=254}
function clientIp(req){return String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'unknown').split(',')[0].trim()}
function limited(req){
  const now=Date.now(), ip=clientIp(req), windowMs=10*60*1000, max=6;
  for (const [key, times] of rate) if (times.at(-1) <= now-windowMs) rate.delete(key);
  if (!rate.has(ip) && rate.size >= 1000) return true;
  const prior=(rate.get(ip)||[]).filter(t=>now-t<windowMs);
  if(prior.length>=max){rate.set(ip,prior);return true}
  prior.push(now);rate.set(ip,prior);return false;
}
function readBody(req,maxBytes=32768){
  return new Promise((resolve,reject)=>{
    const chunks=[];let size=0,settled=false;
    const finish=(error)=>{
      if(settled)return;settled=true;clearTimeout(timer);
      req.removeListener('data',onData);req.removeListener('end',onEnd);
      req.removeListener('aborted',onAborted);
      // Keep the guarded error listener for a late ECONNRESET after abort/close.
      if(error){req.pause();reject(error)}else resolve(Buffer.concat(chunks));
    };
    const onData=chunk=>{size+=chunk.length;if(size>maxBytes)return finish(new Error('too_large'));chunks.push(chunk)};
    const onEnd=()=>finish();
    const onAborted=()=>finish(new Error('incomplete'));
    const onError=()=>finish(new Error('incomplete'));
    const timer=setTimeout(()=>finish(new Error('body_timeout')),bodyTimeoutMs);
    req.on('data',onData);req.on('end',onEnd);req.on('aborted',onAborted);req.on('error',onError);
  });
}
async function handleSupport(req,res,origin){
  const contentType=String(req.headers['content-type']||'').split(';')[0].trim().toLowerCase();
  const formMode=contentType==='application/x-www-form-urlencoded';
  if(!origin||!allowedOrigins.has(origin))return supportResult(res,formMode,403,{error:'origin_not_allowed'},origin);
  if(limited(req))return supportResult(res,formMode,429,{error:'rate_limited'},origin);
  let raw;try{raw=await readBody(req)}catch(error){
    // Finish the error response before closing a partial/oversized upload.
    res.once('finish',()=>req.destroy());
    const timedOut=error.message==='body_timeout';
    return supportResult(res,formMode,timedOut?408:error.message==='too_large'?413:400,
      {error:timedOut?'submission_timeout':error.message==='too_large'?'request_too_large':'invalid_submission'},origin);
  }
  let input;
  try{
    if(contentType==='application/json')input=JSON.parse(raw.toString('utf8'));
    else if(formMode){
      const params=new URLSearchParams(raw.toString('utf8'));
      if(['inquiryProcessing','privacyNoticeVersion'].some(key=>params.getAll(key).length>1)){
        return supportResult(res,formMode,400,{error:'invalid_submission'},origin);
      }
      input=Object.fromEntries(params.entries());
    }
    else return supportResult(res,formMode,415,{error:'unsupported_content_type'},origin);
  }catch{return supportResult(res,formMode,400,{error:'invalid_submission'},origin)}
  if(!input || typeof input !== 'object' || Array.isArray(input))return supportResult(res,formMode,400,{error:'invalid_submission'},origin);
  if(clean(input.website,200))return supportResult(res,formMode,202,{accepted:true},origin);
  const payload={
    name:clean(input.name,100),
    email:clean(input.email,254),
    product:clean(input.product,80),
    type:inquiryType(clean(input.type,80)),
    title:clean(input.title,140),
    description:clean(input.description,5000),
    steps:clean(input.steps,4000),
    environment:clean(input.environment,500),
    inquiryProcessing:input.inquiryProcessing,
    privacyNoticeVersion:input.privacyNoticeVersion
  };
  if(!payload.name||!validEmail(payload.email)||!PRODUCTS.includes(payload.product)||!payload.type||payload.title.length<4||payload.description.length<10){
    return supportResult(res,formMode,400,{error:'invalid_submission'},origin);
  }
  const result = await intake.submit(payload);
  return supportResult(res,formMode,result.status,result.body,origin);
}

const server=http.createServer(async(req,res)=>{
  const origin=typeof req.headers.origin==='string'?req.headers.origin:'';
  if(req.method==='GET'&&req.url==='/health'){return json(res,200,{status:'ok'},origin);}
  if(req.method==='OPTIONS'&&req.url==='/api/support'){
    if(!allowedOrigins.has(origin)){res.writeHead(403);return res.end()}
    res.writeHead(204,{
      'access-control-allow-origin':origin,
      'access-control-allow-methods':'POST, OPTIONS',
      'access-control-allow-headers':'content-type',
      'access-control-max-age':'600',
      'vary':'Origin'
    });return res.end();
  }
  if(req.method==='POST'&&req.url==='/api/support')return handleSupport(req,res,origin);
  if(req.method!=='POST'||req.url!=='/api/github/marketplace'){res.writeHead(404);return res.end();}
  if(!secret){res.writeHead(503);return res.end('Webhook secret not configured');}
  let body;
  try { body=await readBody(req,marketplaceBodyMaxBytes); }
  catch(error){
    res.once('finish',()=>req.destroy());
    const status=error.message==='body_timeout'?408:error.message==='too_large'?413:400;
    res.writeHead(status,{'content-type':'text/plain','cache-control':'no-store'});
    return res.end(status===408?'Request timeout':status===413?'Request too large':'Incomplete request');
  }
    const supplied=req.headers['x-hub-signature-256'];
    if(typeof supplied!=='string'||!supplied.startsWith('sha256=')){res.writeHead(401);return res.end('Missing signature');}
    const expected='sha256='+crypto.createHmac('sha256',secret).update(body).digest('hex');
    if(!safeEqual(supplied,expected)){res.writeHead(401);return res.end('Invalid signature');}
    const event=req.headers['x-github-event']||'unknown';
    let payload;try{payload=JSON.parse(body.toString('utf8'))}catch{res.writeHead(400);return res.end('Invalid JSON');}
    console.log(JSON.stringify({event,action:payload?.action||null,delivery:req.headers['x-github-delivery']||null,receivedAt:new Date().toISOString()}));
    res.writeHead(202,{'content-type':'application/json'});res.end(JSON.stringify({accepted:true}));
});
return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = process.env.PORT || 10000;
  createServer().listen(port,()=>console.log(`Marketplace webhook + support intake listening on ${port}`));
}



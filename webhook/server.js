import http from 'node:http';
import crypto from 'node:crypto';

const port = process.env.PORT || 10000;
const secret = process.env.GITHUB_MARKETPLACE_WEBHOOK_SECRET;
const supportToken = process.env.SUPPORT_GITHUB_TOKEN;
const supportRepo = process.env.SUPPORT_GITHUB_REPO || '';
const allowedOrigins = new Set([
  'https://infrastructureproductworks.com',
  'https://www.infrastructureproductworks.com'
]);
const rate = new Map();

function safeEqual(a,b){const x=Buffer.from(a);const y=Buffer.from(b);return x.length===y.length&&crypto.timingSafeEqual(x,y)}
function json(res,status,body,origin){
  const headers={'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'};
  if(origin&&allowedOrigins.has(origin)){headers['access-control-allow-origin']=origin;headers['vary']='Origin'}
  res.writeHead(status,headers);res.end(JSON.stringify(body));
}
function clean(value,max){return typeof value==='string'?value.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,'').slice(0,max):''}
function validEmail(value){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)&&value.length<=254}
function clientIp(req){return String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'unknown').split(',')[0].trim()}
function limited(req){
  const now=Date.now(), ip=clientIp(req), windowMs=10*60*1000, max=6;
  const prior=(rate.get(ip)||[]).filter(t=>now-t<windowMs);
  if(prior.length>=max){rate.set(ip,prior);return true}
  prior.push(now);rate.set(ip,prior);return false;
}
function readBody(req,maxBytes=32768){
  return new Promise((resolve,reject)=>{
    const chunks=[];let size=0;
    req.on('data',chunk=>{size+=chunk.length;if(size>maxBytes){reject(new Error('too_large'));req.destroy();return}chunks.push(chunk)});
    req.on('end',()=>resolve(Buffer.concat(chunks)));
    req.on('error',reject);
  });
}
async function createSupportIssue(payload,reference){
  if(!supportToken||!supportRepo)return null;
  const body=[
    'Website support intake',
    '',
    `Reference: ${reference}`,
    `Product: ${payload.product}`,
    `Request type: ${payload.type}`,
    `Contact name: ${payload.name}`,
    `Contact email: ${payload.email}`,
    payload.environment ? `Environment: ${payload.environment}` : null,
    '',
    'Description',
    payload.description,
    payload.steps ? ['', 'Reproduction / additional steps', payload.steps].join('\n') : null,
    '',
    '_Created from infrastructureproductworks.com/support. Do not copy secrets or sensitive customer data into this issue._'
  ].filter(Boolean).join('\n');
  const response=await fetch(`https://api.github.com/repos/${supportRepo}/issues`,{
    method:'POST',
    headers:{
      'accept':'application/vnd.github+json',
      'authorization':`Bearer ${supportToken}`,
      'x-github-api-version':'2022-11-28',
      'content-type':'application/json',
      'user-agent':'InfrastructureProductWorks-Support-Intake'
    },
    body:JSON.stringify({
      title:`[Support] ${payload.product} · ${payload.title}`,
      body,
      labels:['support-intake',`product:${payload.product.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,`type:${payload.type.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`]
    })
  });
  if(!response.ok)throw new Error(`github_${response.status}`);
  const issue=await response.json();
  return {number:issue.number,url:issue.html_url};
}
async function handleSupport(req,res,origin){
  if(!origin||!allowedOrigins.has(origin))return json(res,403,{error:'origin_not_allowed'},origin);
  if(limited(req))return json(res,429,{error:'rate_limited'},origin);
  let raw;try{raw=await readBody(req)}catch{return json(res,413,{error:'request_too_large'},origin)}
  let input;try{input=JSON.parse(raw.toString('utf8'))}catch{return json(res,400,{error:'invalid_json'},origin)}
  if(clean(input.website,200))return json(res,202,{accepted:true},origin);
  const payload={
    name:clean(input.name,100),
    email:clean(input.email,254),
    product:clean(input.product,80),
    type:clean(input.type,80),
    title:clean(input.title,140),
    description:clean(input.description,5000),
    steps:clean(input.steps,4000),
    environment:clean(input.environment,500)
  };
  const products=new Set(['Storefront','IaaP Guard','IaaP Forge','IaaP Console','IaaP Assurance','Crossplane','Website','General']);
  const types=new Set(['Product question','Bug','Documentation','Installation','Feature request','Other']);
  if(!payload.name||!validEmail(payload.email)||!products.has(payload.product)||!types.has(payload.type)||payload.title.length<4||payload.description.length<10){
    return json(res,400,{error:'invalid_submission'},origin);
  }
  const reference=`IPW-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  if(!supportToken||!supportRepo){
    console.error(JSON.stringify({kind:'support-intake-not-configured',reference,product:payload.product,type:payload.type,receivedAt:new Date().toISOString()}));
    return json(res,503,{error:'support_intake_not_configured'},origin);
  }
  try{
    const issue=await createSupportIssue(payload,reference);
    console.log(JSON.stringify({kind:'support-intake',reference,issue:issue?.number||null,product:payload.product,type:payload.type,receivedAt:new Date().toISOString()}));
    return json(res,201,{accepted:true,reference});
  }catch(error){
    console.error(JSON.stringify({kind:'support-intake-error',reference,message:String(error?.message||error)}));
    return json(res,502,{error:'support_intake_unavailable'},origin);
  }
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
  const chunks=[];
  req.on('data',c=>chunks.push(c));
  req.on('end',()=>{
    const body=Buffer.concat(chunks);
    const supplied=req.headers['x-hub-signature-256'];
    if(typeof supplied!=='string'||!supplied.startsWith('sha256=')){res.writeHead(401);return res.end('Missing signature');}
    const expected='sha256='+crypto.createHmac('sha256',secret).update(body).digest('hex');
    if(!safeEqual(supplied,expected)){res.writeHead(401);return res.end('Invalid signature');}
    const event=req.headers['x-github-event']||'unknown';
    let payload;try{payload=JSON.parse(body.toString('utf8'))}catch{res.writeHead(400);return res.end('Invalid JSON');}
    console.log(JSON.stringify({event,action:payload?.action||null,delivery:req.headers['x-github-delivery']||null,receivedAt:new Date().toISOString()}));
    res.writeHead(202,{'content-type':'application/json'});res.end(JSON.stringify({accepted:true}));
  });
});
server.listen(port,()=>console.log(`Marketplace webhook + support intake listening on ${port}`));
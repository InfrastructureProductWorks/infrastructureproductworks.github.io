import http from 'node:http';
import crypto from 'node:crypto';

const port = process.env.PORT || 10000;
const secret = process.env.GITHUB_MARKETPLACE_WEBHOOK_SECRET;

function safeEqual(a,b){const x=Buffer.from(a);const y=Buffer.from(b);return x.length===y.length&&crypto.timingSafeEqual(x,y)}

const server=http.createServer((req,res)=>{
  if(req.method==='GET'&&req.url==='/health'){res.writeHead(200,{'content-type':'application/json'});return res.end(JSON.stringify({status:'ok'}));}
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
    // Public Beta receiver intentionally performs no billing, provisioning, or privileged action.
    console.log(JSON.stringify({event,action:payload?.action||null,delivery:req.headers['x-github-delivery']||null,receivedAt:new Date().toISOString()}));
    res.writeHead(202,{'content-type':'application/json'});res.end(JSON.stringify({accepted:true}));
  });
});
server.listen(port,()=>console.log(`Marketplace webhook listening on ${port}`));
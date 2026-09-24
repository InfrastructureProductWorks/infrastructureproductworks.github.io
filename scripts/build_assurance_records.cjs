// Reproduce the bounded browser records consumed by the Portal. No network or credentials.
const fs=require('node:fs');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const context=vm.createContext({window:{crypto:webcrypto},TextEncoder,document:{addEventListener(){}}});
vm.runInContext(fs.readFileSync('assets/assurance-demo.js','utf8'),context);
(async()=>{
  const entries=await vm.runInContext(`(async()=>{
    const cases=[...BATCH_ORDERS.map(order=>({name:order.scenario,order})),...Object.keys(SCENARIOS).map(name=>({name,order:null}))];
    return Promise.all(cases.map(async({name,order})=>{
      const result=await evaluateScenario(name,order);
      return {record:result.record,requestedAt:result.request.requested_at,requestSummary:name==='broadened'?'Disable public access; request includes a second resource.':'Disable public access on one synthetic storage resource.',initial:!!order};
    }));
  })()`,context);
  const catalog={schemaVersion:'iaap-assurance-record-catalog/v1',scopeRef:'synthetic-public-demo',source:{repository:'InfrastructureProductWorks/infrastructureproductworks.github.io',revision:'f800ef87db872e0255b5028a4c0c43b728decad8',path:'assets/assurance-demo.js'},asOf:'2026-08-31T12:16:00Z',entries};
  const text=JSON.stringify(catalog,null,2)+'\n';
  const path='assets/assurance-records.json';
  if(process.argv.includes('--check')){if(fs.readFileSync(path,'utf8')!==text)throw Error('Assurance record catalog differs from producer output');}
  else fs.writeFileSync(path,text);
})().catch(error=>{console.error(error);process.exitCode=1;});

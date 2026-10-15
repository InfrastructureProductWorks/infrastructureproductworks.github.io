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
// Query/search paths must not turn a declared public repository into a carrier
// for a second, undeclared repository coordinate.
for(const prefix of [host+'search?q=',host+guard+'/search?q=',host+guard+'?q=']){
  for(const query of ['repo:'+unknown, 'repo:'+unknown+' repo:'+guard, unknown]){
    negatives.push(prefix+query,prefix+encodeURIComponent(query),prefix+encodeURIComponent(encodeURIComponent(query)));
  }
}
for(const suffix of [';private','@private','!private',':private','%3Bprivate','/','?q=private','#private',')',',','.'])negatives.push(app+suffix);
let encoded=unknown;
for(let i=0;i<10;i++){encoded=encodeURIComponent(encoded);negatives.push(encoded);}
for(const first of 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.'){
  const text='//'+first+'.internal';negatives.push(text,encodeURIComponent(text));
}
for(let code=0;code<33;code++){
  for(const text of ['//'+String.fromCharCode(code)+'s.internal',...(code<32?['/'+String.fromCharCode(code)+'/s.internal']:[])]){
    negatives.push(text,encodeURIComponent(text),encodeURIComponent(encodeURIComponent(text)));
  }
}
for(const text of negatives){
  for(const input of [{dashboard:{products:[{evidence:text}]}},{presentation:{nested:[text]}},{presentation:{[text]:'value'}},{dashboard:{products:[{versions:{[text]:'v1'}}]}}]){
    assert.equal(valid(input),false,JSON.stringify(input));
  }
}
const positives=['Public evidence','100% bounded validation','/forge/','/storefront/',app,
  'www.'+app,app+' public app',app+'\n Public app','a'.repeat(64),'b'.repeat(64)];
for(const slug of ['iaap-guard','ai-powered-infrastructure-as-a-product','infrastructureproductworks.github.io']){
  const repo=['InfrastructureProductWorks',slug].join('/');
  positives.push(repo,repo.toUpperCase(),repo+'.git',repo+'/blob/main/file',host+repo,
    ['github','dev'].join('.')+'/'+repo,['raw','githubusercontent','com'].join('.')+'/'+repo+'/main/file',
    ['api','github','com'].join('.')+'/repos/'+repo,['vscode','dev'].join('.')+'/github/'+repo);
}
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

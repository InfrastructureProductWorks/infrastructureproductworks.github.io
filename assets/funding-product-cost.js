/* ipw-product-cost-demo/v2 — fictional composition and rates; no order or spending authority. */
(function(global){
'use strict';
const CONTRACT='ipw-product-cost-demo/v2', FIXTURE='fictional-composition-usd-2026-10-11/v2';
const clone=value=>JSON.parse(JSON.stringify(value));
const freeze=value=>{Object.values(value).forEach(v=>{if(v&&typeof v==='object')freeze(v);});return Object.freeze(value);};
const RATES=freeze({aws:{label:'AWS · us-east-1',compute:10,storage:2,egress:8,network:10000,logging:5000,ingestion:5,backup:1,analytics:20},azure:{label:'Azure · eastus',compute:11,storage:2,egress:7,network:11000,logging:4500,ingestion:6,backup:1,analytics:22},gcp:{label:'Google Cloud · us-east1',compute:9,storage:3,egress:9,network:9000,logging:5500,ingestion:4,backup:2,analytics:18}});
const CATALOG=freeze({
 'cloud-foundation':{label:'Cloud Foundation Environment',version:'demo-1',children:['foundation','runtime']},
 'data-platform':{label:'Data Platform Environment',version:'demo-1',children:['foundation','data-lake','ingestion','processing','backup']},
 foundation:{label:'Infrastructure Landing Zone',version:'demo-1',children:['network','identity','observability']},
 network:{label:'Network baseline',version:'demo-1',meters:['network']},
 identity:{label:'Identity baseline',version:'demo-1',meters:['identity']},
 observability:{label:'Logging baseline',version:'demo-1',meters:['logging']},
 runtime:{label:'Workload runtime',version:'demo-1',children:['foundation'],meters:['compute','storage','egress']},
 'data-lake':{label:'Data storage',version:'demo-1',children:['foundation'],meters:['storage','egress']},
 ingestion:{label:'Data ingestion',version:'demo-1',children:['foundation','data-lake'],meters:['ingestion']},
 processing:{label:'Data processing',version:'demo-1',children:['foundation','data-lake'],meters:['compute']},
 backup:{label:'Data backup',version:'demo-1',children:['data-lake'],meters:['backup']},
 analytics:{label:'Analytics workspace',version:'demo-1',children:['data-lake'],meters:['analytics']},
 recovery:{label:'Cross-region recovery',version:'demo-1',children:['foundation'],meters:['recovery']}
});
const PRODUCTS=['cloud-foundation','data-platform'];
const defaults=()=>({product:'cloud-foundation',productVersion:'demo-1',provider:'aws',foundation:'new',share:25,analytics:false,recovery:false,teams:[10,15,20],instances:2,hours:730,storage:100,egress:50,shared:300,support:1000,setup:12000,capacity:1.5});
// IDs are resolved instance identities in this bounded fixture. Multiple paths do not create instances.
function resolve(root,extras=[],catalog=CATALOG){
 const nodes=[],edges=[],visiting=new Set(),seen=new Set();
 function visit(id,parent){
  if(!Object.hasOwn(catalog,id))throw Error('Missing required component: '+id);
  if(parent)edges.push({parent,component:id});
  if(visiting.has(id))throw Error('Cyclic product composition.');
  if(seen.has(id))return;
  visiting.add(id);const node=catalog[id];
  for(const child of [...(node.children||[]),...(id===root?extras:[])])visit(child,id);
  visiting.delete(id);seen.add(id);nodes.push({id,...clone(node)});
 }
 visit(root,null);return {nodes,edges};
}
function validate(input){
 if(!input||Object.keys(input).sort().join()!==Object.keys(defaults()).sort().join()||!Object.hasOwn(RATES,input.provider)||!PRODUCTS.includes(input.product)||input.productVersion!==CATALOG[input.product].version)throw Error('Choose a supported product version and fictional provider.');
 if(!['new','reuse'].includes(input.foundation)||typeof input.analytics!=='boolean'||typeof input.recovery!=='boolean'||(input.analytics&&input.product!=='data-platform'))throw Error('Unsupported product configuration.');
 if(!Array.isArray(input.teams)||input.teams.length!==3||input.teams.some(n=>!Number.isInteger(n)||n<0||n>1000))throw Error('Enter three monthly team counts from 0 to 1,000.');
 for(const k of ['instances','hours','storage','egress','shared','support','setup','share'])if(!Number.isSafeInteger(input[k])||input[k]<0||input[k]>(k==='hours'?744:k==='share'?100:100000))throw Error('Enter whole nonnegative quantities; hours ≤ 744, allocation ≤ 100%, other quantities ≤ 100,000.');
 if(!Number.isFinite(input.capacity)||input.capacity<0||input.capacity>1000||Math.abs(Math.round(input.capacity*100)-input.capacity*100)>0.000001)throw Error('Enter capacity from 0 to 1,000 FTE quarters, with at most two decimals.');
}
function estimate(input){
 validate(input);
 const graph=resolve(input.product,[...(input.analytics?['analytics']:[]),...(input.recovery?['recovery']:[])]),rates=RATES[input.provider];
 const foundationIds=new Set(['network','identity','observability']);
 const units={network:'foundation-month',identity:'foundation-month',logging:'foundation-month',compute:'instance-hour',storage:'GB-month',egress:'GB egress',ingestion:'GB ingested',backup:'GB-month retained',analytics:'workspace-hour',recovery:'recovery configuration'};
 const quantities={network:1,identity:1,logging:1,compute:input.instances*input.hours,storage:input.storage,egress:input.egress,ingestion:input.storage,backup:input.storage,analytics:input.hours,recovery:1};
 const rows=[];
 for(const node of graph.nodes){
  if(input.foundation==='reuse'&&foundationIds.has(node.id))continue;
  for(const meter of node.meters||[]){
   const shared=foundationIds.has(node.id),rate=meter==='identity'?0:meter==='recovery'?null:rates[meter];
   const monthlyQuantities=input.teams.map(teams=>quantities[meter]*(shared||meter==='recovery'?1:teams));
   const monthly=monthlyQuantities.map(q=>rate===null?null:q*rate);
   rows.push({id:node.id+'/'+meter,component:node.id,label:node.label,version:node.version,meter,unit:units[meter],rate,quantities:monthlyQuantities,monthly,total:rate===null?null:monthly.reduce((a,b)=>a+b,0),state:rate===null?'Unknown price':rate===0?'Included · no added charge':'Priced',owner:shared?'foundation/demo-shared':input.product+'/demo-instance'});
  }
 }
 let allocation=null;
 if(input.foundation==='reuse'){
  const pool=input.shared*100,amount=pool*input.share/100;
  allocation={pool,share:input.share,amount,residual:pool-amount,basis:'Allocated existing cost; not incremental provider spend'};
  rows.unshift({id:'foundation/allocation',component:'foundation',label:'Existing Infrastructure Landing Zone',version:'demo-1',meter:'allocation',unit:'share of monthly pool',rate:pool,quantities:[input.share/100,input.share/100,input.share/100],monthly:[amount,amount,amount],total:amount*3,state:'Allocated existing cost',owner:'foundation/demo-shared'});
 }
 const complete=rows.every(r=>r.total!==null),knownCloud=rows.reduce((s,r)=>s+(r.total===null?0:r.total),0);
 const months=input.teams.map((teams,i)=>({teams,known:rows.reduce((s,r)=>s+(r.monthly[i]===null?0:r.monthly[i]),0),total:complete?rows.reduce((s,r)=>s+r.monthly[i],0):null}));
 const support=input.support*300,setup=input.setup*100,knownTotal=knownCloud+support+setup;
 if(!Number.isSafeInteger(knownTotal)||knownTotal>100000000000)throw Error('Scenario exceeds the demo funding limit.');
 return {contract:CONTRACT,fixture:FIXTURE,currency:'USD',period:'FY27 Q1',input:clone(input),product:{id:input.product,label:CATALOG[input.product].label,version:input.productVersion},graph,rows,allocation,complete,months,cloud:complete?knownCloud:null,knownCloud,support,setup,total:complete?knownTotal:null,knownTotal,exclusions:['Taxes, discounts, reservations and live billing','Unselected optional capabilities'],assumptions:['Fictional demo composition; not the released provisioning specification','One shared foundation across the monthly team ramp','Hours are a user assumption, not a calendar-derived total','Support and enablement are separate management estimates','Management capacity is independent of cloud resource capacity']};
}
function decode(value){
 if(!value||Object.keys(value).sort().join()!=='contract,fixture,input'||value.contract!==CONTRACT||value.fixture!==FIXTURE)throw Error('Unsupported cost scenario contract or fixture version. Recreate older generic scenarios in this product composition lab.');
 return estimate(value.input);
}
const money=n=>n===null?'Unavailable':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n/100);
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function breakdown(q){
 return '<div class="ipw-cost-scroll" tabindex="0" role="region" aria-label="Product component cost breakdown"><table><caption>'+esc(q.product.label)+' · '+esc(q.product.version)+' · component cost breakdown</caption><thead><tr>'+['Component / meter','Basis','Quantity Oct / Nov / Dec','Sample unit rate','Quarter cost'].map(s=>'<th scope="col">'+s+'</th>').join('')+'</tr></thead><tbody>'+q.rows.map(r=>'<tr><th scope="row">'+esc(r.label)+'<small>'+esc(r.meter+' · '+r.version)+'</small></th><td>'+esc(r.state)+'<small>'+esc(r.unit)+'</small></td><td>'+r.quantities.map(esc).join(' / ')+'</td><td>'+money(r.rate)+'</td><td>'+money(r.total)+'</td></tr>').join('')+'</tbody></table></div>'+(q.allocation?'<p>Existing foundation pool: '+money(q.allocation.pool)+'/month × '+q.allocation.share+'% = '+money(q.allocation.amount)+'/month. Remaining with other owners: '+money(q.allocation.residual)+'/month. '+esc(q.allocation.basis)+'. Compatibility and capacity are assumed in this demo.</p>':'<p>New foundation services are counted once for this product, including when several components depend on them.</p>')+'<details><summary>Product dependencies and estimate assumptions</summary><ul>'+q.graph.edges.map(e=>'<li>'+esc(CATALOG[e.parent].label)+' → '+esc(CATALOG[e.component].label)+'</li>').join('')+'</ul><p>All components: demo-1. Repeated references resolve to one instance in this fixture; separate real instances require separate identities.</p><ul>'+q.assumptions.map(a=>'<li>'+esc(a)+'</li>').join('')+'</ul><p>Excluded: '+q.exclusions.map(esc).join('; ')+'. '+(q.input.analytics?'Analytics selected.':'Analytics not selected.')+' '+(q.input.recovery?'Cross-region recovery selected; sample price unavailable.':'Cross-region recovery not selected.')+'</p></details>';
}
function mount(container,options={}){
 let current=options.initialInput?estimate(options.initialInput).input:defaults(),result=null;
 container.classList.add('ipw-cost');
 const field=(name,label,value,step='1')=>'<label>'+label+'<input name="'+name+'" type="number" min="0" step="'+step+'" value="'+value+'" required></label>';
 container.innerHTML='<header><small>PRODUCT COST LAB · SYNTHETIC</small><h3>Estimate a composed product</h3><p>Select an environment product, inspect its components, and carry its estimate into a Northstar Epic.</p></header><p class="ipw-cost-note"><strong>Sample products and rates, not provider quotes.</strong> USD · FY27 Q1 (Oct–Dec 2026). Fictional definitions demonstrate product composition; they are not the released provisioning specifications. Data Platform is estimate-only. Azure is comparison-only; ordering remains AWS/GCP.</p><form data-cost-form><div class="ipw-cost-fields"><label>Environment product<select name="product">'+PRODUCTS.map(id=>'<option value="'+id+'">'+CATALOG[id].label+'</option>').join('')+'</select><small>Product version demo-1</small></label><label>Sample provider<select name="provider">'+Object.entries(RATES).map(([id,r])=>'<option value="'+id+'">'+r.label+'</option>').join('')+'</select></label><label>Infrastructure Landing Zone<select name="foundation"><option value="new">Create new foundation</option><option value="reuse">Reuse existing foundation</option></select></label><label>Analytics workspace<select name="analytics"><option value="false">Not selected</option><option value="true">Include · Data Platform only</option></select></label><label>Cross-region recovery<select name="recovery"><option value="false">Not selected</option><option value="true">Include · sample price unavailable</option></select></label>'+current.teams.map((v,i)=>field('month'+i,['October teams','November teams','December teams'][i],v)).join('')+field('instances','Runtime / processing instances per team',current.instances)+field('hours','Hours per instance / workspace per month',current.hours)+field('storage','Storage / ingestion / backup GB per team',current.storage)+field('egress','Egress GB per team / month',current.egress)+'<div data-cost-reuse>'+field('shared','Existing foundation pool USD / month',current.shared)+field('share','This product allocation (%)',current.share)+'</div>'+field('support','Operations support USD / month',current.support)+field('setup','One-time enablement USD',current.setup)+field('capacity','Management capacity · FTE quarters',current.capacity,'.01')+'</div><div class="ipw-cost-submit"><button type="submit">Calculate scenario</button></div></form><p data-cost-status role="status"></p><div data-cost-result></div><div class="ipw-cost-actions"><button type="button" data-cost-export>Download scenario</button><label>Load a scenario from Storefront<input type="file" accept=".json,application/json" data-cost-file></label>'+(options.onImport?'<button type="button" data-cost-import>Add estimate to Epic ledger</button>':'<a href="https://infrastructureproductworks.com/northstar-signal/demo/">Continue in Northstar Signal →</a>')+'</div><p>Scenario files retain the exact product/configuration and fixture version; totals are recalculated on load. In Northstar: Funding &amp; Capacity → Product cost lab → load the file → choose Morgan → add to Epic ledger. Reload clears browser-only state.</p>';
 const form=container.querySelector('form'),status=container.querySelector('[data-cost-status]'),out=container.querySelector('[data-cost-result]');
 const setStatus=(text,error=false)=>{status.textContent=text;status.setAttribute('role',error?'alert':'status');};
 const sync=()=>{const data=form.elements.namedItem('product').value==='data-platform';form.elements.namedItem('analytics').disabled=!data;if(!data)form.elements.namedItem('analytics').value='false';const reuse=form.elements.namedItem('foundation').value==='reuse';container.querySelector('[data-cost-reuse]').hidden=!reuse;for(const k of ['shared','share'])form.elements.namedItem(k).disabled=!reuse;};
 const fill=input=>{for(const [k,v]of Object.entries(input)){if(k==='teams')v.forEach((n,i)=>form.elements.namedItem('month'+i).value=n);else if(k!=='productVersion')form.elements.namedItem(k).value=String(v);}sync();};
 const invalidate=()=>{result=null;out.innerHTML='';sync();container.querySelector('[data-cost-export]').disabled=true;const b=container.querySelector('[data-cost-import]');if(b)b.disabled=true;setStatus('Inputs changed. Calculate the scenario before export or import.');};
 fill(current);
 function calculate(){
  try{
   const numeric=k=>{const raw=form.elements.namedItem(k).value;if(!raw.trim())throw Error('Missing usage is unavailable, not zero. Complete all scenario fields.');return Number(raw);};
   current={product:form.elements.namedItem('product').value,productVersion:'demo-1',provider:form.elements.namedItem('provider').value,foundation:form.elements.namedItem('foundation').value,analytics:form.elements.namedItem('analytics').value==='true',recovery:form.elements.namedItem('recovery').value==='true',teams:[0,1,2].map(i=>numeric('month'+i)),...Object.fromEntries(['instances','hours','storage','egress','shared','share','support','setup','capacity'].map(k=>[k,numeric(k)]))};
   result=estimate(current);if(options.onCalculate)options.onCalculate(result.input);
   out.innerHTML='<div class="ipw-cost-metrics"><article><span>Quarter cloud estimate</span><strong>'+money(result.cloud)+'</strong><small>'+ (result.complete?'Required selected components priced':'Incomplete · known cloud subtotal '+money(result.knownCloud))+'</small></article><article><span>Total funding estimate</span><strong>'+money(result.total)+'</strong><small>Cloud + support + one-time enablement</small></article><article><span>Delivery capacity</span><strong>'+current.capacity+' FTE quarters</strong><small>Separate management assumption</small></article></div>'+breakdown(result)+'<div class="ipw-cost-scroll"><table><caption>Monthly cloud estimate · '+RATES[current.provider].label+'</caption><thead><tr><th scope="col">Month</th><th scope="col">Teams</th><th scope="col">Cloud cost</th></tr></thead><tbody>'+result.months.map((m,i)=>'<tr><th scope="row">'+['Oct','Nov','Dec'][i]+'</th><td>'+m.teams+'</td><td>'+money(m.total)+'</td></tr>').join('')+'</tbody></table></div><p>Operations support: '+money(result.support)+'/quarter. Enablement: '+money(result.setup)+' once. Known funding subtotal: '+money(result.knownTotal)+'. No tax, negotiated discounts, reservations or live billing.</p><div class="ipw-cost-scroll"><table><caption>Same configured product · fictional provider comparison</caption><thead><tr><th scope="col">Provider</th><th scope="col">Quarter cloud</th><th scope="col">Quarter funding</th></tr></thead><tbody>'+Object.entries(RATES).map(([id,r])=>{const q=estimate({...current,provider:id});return '<tr><th scope="row">'+r.label+'</th><td>'+money(q.cloud)+'</td><td>'+money(q.total)+'</td></tr>';}).join('')+'</tbody></table></div><p>Component quantities → one product estimate → one owning Epic → Objective allocations. Fixture '+FIXTURE+'.</p>';
   container.querySelector('[data-cost-export]').disabled=false;const b=container.querySelector('[data-cost-import]');if(b)b.disabled=!result.complete;setStatus(result.complete?'Scenario calculated. This is an estimate, not approved funding.':'Scenario calculated but incomplete. Required recovery price is unknown; funding import is blocked.');
  }catch(e){invalidate();setStatus(e.message,true);}
 }
 form.addEventListener('submit',e=>{e.preventDefault();e.stopPropagation();calculate();});form.addEventListener('input',invalidate);form.addEventListener('change',invalidate);
 container.querySelector('[data-cost-export]').onclick=()=>{if(!result)return;const blob=new Blob([JSON.stringify({contract:CONTRACT,fixture:FIXTURE,input:result.input},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ipw-product-cost-scenario.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 container.querySelector('[data-cost-file]').onchange=async e=>{invalidate();try{const file=e.target.files[0];if(!file||file.size>10000)throw Error('Choose a scenario JSON file smaller than 10 KB.');const q=decode(JSON.parse(await file.text()));fill(q.input);calculate();}catch(err){setStatus(err.message,true);}finally{e.target.value='';}};
 if(options.onImport)container.querySelector('[data-cost-import]').onclick=async()=>{if(!result||!result.complete)return;try{await options.onImport(clone(result.input));}catch(e){setStatus(e.message,true);}};
 calculate();
}
const api=Object.freeze({CONTRACT,FIXTURE,RATES,CATALOG,defaults,resolve,estimate,decode,breakdown,mount});
if(typeof module!=='undefined'&&module.exports)module.exports=api;else{global.IPWProductCost=api;document.querySelectorAll('[data-product-cost]').forEach(node=>mount(node));}
})(typeof globalThis==='undefined'?this:globalThis);

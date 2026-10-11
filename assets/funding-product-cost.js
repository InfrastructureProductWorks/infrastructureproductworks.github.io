/* ipw-product-cost-demo/v1 — fictional rates, no quote or spending authority. */
(function(global){
'use strict';
const CONTRACT='ipw-product-cost-demo/v1', FIXTURE='fictional-usd-2026-10-11/v1';
const RATES=Object.freeze({aws:Object.freeze({label:'AWS · us-east-1',compute:10,storage:2,egress:8}),azure:Object.freeze({label:'Azure · eastus',compute:11,storage:2,egress:7}),gcp:Object.freeze({label:'Google Cloud · us-east1',compute:9,storage:3,egress:9})});
const defaults=()=>({provider:'aws',teams:[10,15,20],instances:2,hours:730,storage:100,egress:50,shared:300,support:1000,setup:12000,capacity:1.5});
function estimate(input){
 if(!input || Object.keys(input).sort().join()!==Object.keys(defaults()).sort().join() || !Object.hasOwn(RATES,input.provider))throw Error('Choose a supported fictional provider and complete the scenario.');
 if(!Array.isArray(input.teams)||input.teams.length!==3||input.teams.some(n=>!Number.isInteger(n)||n<0||n>1000))throw Error('Enter three monthly team counts from 0 to 1,000.');
 for(const k of ['instances','hours','storage','egress','shared','support','setup'])if(!Number.isSafeInteger(input[k])||input[k]<0||input[k]>(k==='hours'?744:100000))throw Error('Enter whole nonnegative quantities; hours cannot exceed 744 and other quantities cannot exceed 100,000.');
 if(!Number.isFinite(input.capacity)||input.capacity<0||input.capacity>1000||Math.abs(Math.round(input.capacity*100)-input.capacity*100)>0.000001)throw Error('Enter management capacity from 0 to 1,000 FTE quarters, with at most two decimals.');
 const rates=RATES[input.provider];
 const unit={compute:input.instances*input.hours*rates.compute,storage:input.storage*rates.storage,egress:input.egress*rates.egress};
 const perTeam=unit.compute+unit.storage+unit.egress;
 const months=input.teams.map(teams=>({teams,compute:teams*unit.compute,storage:teams*unit.storage,egress:teams*unit.egress,shared:input.shared*100,total:teams*perTeam+input.shared*100}));
 const cloud=months.reduce((sum,m)=>sum+m.total,0), support=input.support*300,setup=input.setup*100,total=cloud+support+setup;
 if(!Number.isSafeInteger(total)||total>100000000000)throw Error('Scenario exceeds the demo funding limit.');
 return {contract:CONTRACT,fixture:FIXTURE,currency:'USD',period:'FY27 Q1',input:JSON.parse(JSON.stringify(input)),unit,perTeam,months,cloud,support,setup,total};
}
function decode(value){
 if(!value||Object.keys(value).sort().join()!=='contract,fixture,input'||value.contract!==CONTRACT||value.fixture!==FIXTURE)throw Error('Unsupported cost scenario contract or fixture version.');
 return estimate(value.input);
}
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n/100);
function mount(container,options={}){
 let current=options.initialInput?estimate(options.initialInput).input:defaults(), result=null;
 container.classList.add('ipw-cost');
 const field=(name,label,value,step='1')=>'<label>'+label+'<input name="'+name+'" type="number" min="0" step="'+step+'" value="'+value+'" required></label>';
 container.innerHTML='<header><small>PRODUCT COST LAB · SYNTHETIC</small><h3>From cloud capacity to funding</h3><p>Size a Cloud Foundation Environment, compare fictional provider rates, then carry the estimate into a Northstar Epic.</p></header><p class="ipw-cost-note"><strong>Sample rates, not provider quotes.</strong> USD · FY27 Q1 (Oct–Dec 2026). All costs are future, uncommitted planning assumptions. No tax, negotiated discounts, reservations, support tiers or live billing. Azure is comparison-only; ordering remains AWS/GCP.</p><form data-cost-form><div class="ipw-cost-fields"><label>Sample provider<select name="provider">'+Object.entries(RATES).map(([id,r])=>'<option value="'+id+'">'+r.label+'</option>').join('')+'</select></label>'+current.teams.map((v,i)=>field('month'+i,['October teams','November teams','December teams'][i],v)).join('')+field('instances','Instances per team',current.instances)+field('hours','Hours per instance / month',current.hours)+field('storage','Storage GB-month per team',current.storage)+field('egress','Egress GB per team / month',current.egress)+field('shared','Shared platform USD / month',current.shared)+field('support','Operations support USD / month',current.support)+field('setup','One-time enablement USD',current.setup)+field('capacity','Management capacity · FTE quarters',current.capacity,'.01')+'</div><button type="submit">Calculate scenario</button></form><p data-cost-status role="status"></p><div data-cost-result></div><div class="ipw-cost-actions"><button type="button" data-cost-export>Download scenario</button><label>Load a scenario from Storefront<input type="file" accept=".json,application/json" data-cost-file></label>'+(options.onImport?'<button type="button" data-cost-import>Add estimate to Epic ledger</button>':'<a href="https://infrastructureproductworks.com/northstar-signal/demo/">Continue in Northstar Signal →</a>')+'</div><p>Export contains only sample scenario inputs and fixture version. In Northstar: Funding &amp; Capacity → Product cost lab → load the file → choose Morgan → add to Epic ledger. State is held only in this page; reload clears it.</p>';
 const form=container.querySelector('form'),status=container.querySelector('[data-cost-status]'),out=container.querySelector('[data-cost-result]');
 const setStatus=(text,error=false)=>{status.textContent=text;status.setAttribute('role',error?'alert':'status');};
 const invalidate=()=>{result=null;out.innerHTML='';container.querySelector('[data-cost-export]').disabled=true;const b=container.querySelector('[data-cost-import]');if(b)b.disabled=true;setStatus('Inputs changed. Calculate the scenario before export or import.');};
 for(const [k,v]of Object.entries(current)){if(k!=='teams')form.elements.namedItem(k).value=v;}
 function calculate(){
  try{
   const data=new FormData(form), numeric=k=>{const raw=data.get(k);if(typeof raw!=='string'||!raw.trim())throw Error('Missing usage is unavailable, not zero. Complete all scenario fields.');return Number(raw);};
   current={provider:data.get('provider'),teams:[0,1,2].map(i=>numeric('month'+i)),...Object.fromEntries(['instances','hours','storage','egress','shared','support','setup','capacity'].map(k=>[k,numeric(k)]))};result=estimate(current);if(options.onCalculate)options.onCalculate(result.input);
   const r=RATES[current.provider];
   out.innerHTML='<div class="ipw-cost-metrics"><article><span>Quarter cloud estimate</span><strong>'+money(result.cloud)+'</strong><small>Shared platform counted once per month</small></article><article><span>Total funding estimate</span><strong>'+money(result.total)+'</strong><small>Cloud + support + one-time enablement</small></article><article><span>Delivery capacity</span><strong>'+current.capacity+' FTE quarters</strong><small>Separate management assumption</small></article></div><div class="ipw-cost-scroll" tabindex="0" role="region" aria-label="Monthly cost breakdown"><table><caption>Cloud estimate · '+r.label+'</caption><thead><tr><th>Month</th><th>Teams</th><th>Compute</th><th>Storage</th><th>Egress</th><th>Shared</th><th>Total</th></tr></thead><tbody>'+result.months.map((m,i)=>'<tr><th>'+['Oct','Nov','Dec'][i]+'</th><td>'+m.teams+'</td>'+['compute','storage','egress','shared','total'].map(k=>'<td>'+money(m[k])+'</td>').join('')+'</tr>').join('')+'</tbody></table></div><p>Per-team cloud: '+money(result.perTeam)+'/month. Sample rates: '+money(r.compute)+'/instance-hour, '+money(r.storage)+'/GB-month, '+money(r.egress)+'/egress GB. Support: '+money(result.support)+'/quarter. Enablement: '+money(result.setup)+' once.</p><div class="ipw-cost-scroll"><table><caption>Identical usage · fictional provider comparison</caption><thead><tr><th>Sample provider</th><th>Quarter cloud</th><th>Quarter total funding</th></tr></thead><tbody>'+Object.entries(RATES).map(([id,r])=>{const q=estimate({...current,provider:id});return '<tr><th>'+r.label+'</th><td>'+money(q.cloud)+'</td><td>'+money(q.total)+'</td></tr>';}).join('')+'</tbody></table></div><p><strong>Lineage:</strong> resource quantities → one product estimate → one owning Epic → weighted Objective allocations. Links to Key Results never duplicate cost. Fixture '+FIXTURE+'.</p>';
   container.querySelector('[data-cost-export]').disabled=false;const b=container.querySelector('[data-cost-import]');if(b)b.disabled=false;setStatus('Scenario calculated. This is an estimate, not approved funding.');
  }catch(e){invalidate();setStatus(e.message,true);}
 }
 form.addEventListener('submit',e=>{e.preventDefault();e.stopPropagation();calculate();});
 form.addEventListener('input',invalidate);form.addEventListener('change',invalidate);
 container.querySelector('[data-cost-export]').onclick=()=>{if(!result)return;const blob=new Blob([JSON.stringify({contract:CONTRACT,fixture:FIXTURE,input:result.input},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ipw-product-cost-scenario.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 container.querySelector('[data-cost-file]').onchange=async e=>{invalidate();try{const file=e.target.files[0];if(!file||file.size>10000)throw Error('Choose a scenario JSON file smaller than 10 KB.');const q=decode(JSON.parse(await file.text()));for(const [k,v]of Object.entries(q.input)){if(k==='teams')v.forEach((n,i)=>form.elements.namedItem('month'+i).value=n);else form.elements.namedItem(k).value=v;}calculate();}catch(err){setStatus(err.message,true);}finally{e.target.value='';}};
 if(options.onImport)container.querySelector('[data-cost-import]').onclick=async()=>{if(!result)return;try{await options.onImport(JSON.parse(JSON.stringify(result.input)));}catch(e){setStatus(e.message,true);}};
 calculate();
}
const api=Object.freeze({CONTRACT,FIXTURE,RATES,defaults,estimate,decode,mount});
if(typeof module!=='undefined'&&module.exports)module.exports=api;else{global.IPWProductCost=api;document.querySelectorAll('[data-product-cost]').forEach(node=>mount(node));}
})(typeof globalThis==='undefined'?this:globalThis);

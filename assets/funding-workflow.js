/* Shared synthetic workflow reference. No authentication, storage or finance authority. */
(function (global) {
  'use strict';
  const CONTRACT = 'northstar-funding-workflow-reference/v1';
  const LIMIT = 100000000000;
  const POLICY = 'synthetic-independent-review/v1';
  const SCOPE = Object.freeze({organization:'Example Organization', division:'Cloud Platform Division', period:'FY27 Q1', currency:'USD', startsOn:'2026-10-01', endsOn:'2026-12-31', timezone:'America/New_York'});
  const OBJECTIVES = Object.freeze({O9:Object.freeze(['KR9.3','KR9.6']), O10:Object.freeze(['KR10.2']), O11:Object.freeze(['KR11.1'])});
  const ACTORS = Object.freeze({
    leader:Object.freeze({name:'Alex · simulated leader / proposal author', grants:Object.freeze(['plan','submit','approve']), limit:100000000}),
    manager:Object.freeze({name:'Morgan · simulated management estimator', grants:Object.freeze(['estimate','submit']), limit:0}),
    reviewer:Object.freeze({name:'Jordan · simulated independent financial reviewer', grants:Object.freeze(['approve']), limit:200000000}),
    finance:Object.freeze({name:'Casey · simulated finance reconciler', grants:Object.freeze(['reconcile']), limit:0}),
    viewer:Object.freeze({name:'Taylor · simulated read-only viewer', grants:Object.freeze([]), limit:0})
  });
  const clone = value => JSON.parse(JSON.stringify(value));
  const insist = (ok, message) => { if (!ok) throw new Error(message); };
  const canonical = value => Array.isArray(value) ? '['+value.map(canonical).join(',')+']' : value && typeof value === 'object' ? '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}' : JSON.stringify(value);
  const amount = (value, nullable=false) => (nullable && value===null) || (Number.isSafeInteger(value) && value>=0 && value<=LIMIT);
  function total(values) { if (values.includes(null)) return null; const n=values.reduce((a,b)=>a+b,0); insist(amount(n),'Financial rollup exceeds the supported minor-unit range.'); return n; }
  function dollars(value) {
    insist(typeof value==='string' && /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value.trim()),'Enter a nonnegative USD amount with at most two decimal places.');
    const [whole,fraction='']=value.trim().split('.'); const n=Number(whole)*100+Number(fraction.padEnd(2,'0'));
    insist(amount(n),'Amount exceeds the supported minor-unit range.'); return n;
  }
  function distribute(value, shares) {
    if (value===null) return Object.fromEntries(Object.keys(shares).map(k=>[k,null]));
    insist(amount(value),'Invalid cost amount.');
    const entries=Object.entries(shares).sort(([a],[b])=>a.localeCompare(b));
    insist(entries.length>0 && entries.every(([id,w])=>Object.hasOwn(OBJECTIVES,id) && Number.isInteger(w) && w>0 && w<=10000) && entries.reduce((s,[,w])=>s+w,0)===10000,'Objective cost shares must be positive basis points totaling 100%.');
    const rows=entries.map(([id,w])=>({id,n:Number(BigInt(value)*BigInt(w)/10000n),remainder:Number(BigInt(value)*BigInt(w)%10000n)}));
    let extra=value-rows.reduce((s,r)=>s+r.n,0);
    [...rows].sort((a,b)=>b.remainder-a.remainder || a.id.localeCompare(b.id)).forEach(r=>{if(extra>0){r.n++;extra--;}});
    return Object.fromEntries(rows.map(r=>[r.id,r.n]));
  }
  function seedEpic(id,title,allocation,remaining,shares,capacity,basis) {
    return {id,title,revision:1,costId:'COST-'+id,scopeAcceptance:'synthetic-accepted-scope/'+id+'/1',allocation,remaining,shares,capacity,basis};
  }
  function create() {
    return {contract:CONTRACT,synthetic:true,scope:clone(SCOPE),policyRevision:POLICY,revision:1,authors:[],sourceVersion:1,active:null,submissions:[],decisions:[],events:[],receipts:[],unmatched:[],
      draft:{envelope:100000000,objectives:{O9:45000000,O10:30000000,O11:15000000},epics:[
        seedEpic('EP-FUND-FOUNDATION','Shared foundation',35000000,19000000,{O9:8000,O10:2000},4,'Synthetic management estimate; foundation supports decision quality and reuse.'),
        seedEpic('EP-FUND-DISCOVERY','Option discovery',8000000,8000000,{O9:10000},1,'Synthetic option-discovery estimate; no committed costs.'),
        seedEpic('EP-FUND-REUSE','Governed reuse',20000000,11000000,{O10:10000},3,'Synthetic reusable-product adoption estimate.'),
        seedEpic('EP-FUND-EVIDENCE','Evidence confidence',12000000,9000000,{O11:10000},2,'Actual source coverage missing; affordability stays unknown.')
      ]},
      observations:{'EP-FUND-FOUNDATION':{actual:12000000,commitments:14000000,source:'synthetic-finance/foundation/1'},'EP-FUND-DISCOVERY':{actual:0,commitments:0,source:'synthetic-finance/attested-zero/1'},'EP-FUND-REUSE':{actual:8000000,commitments:9000000,source:'synthetic-finance/reuse/1'},'EP-FUND-EVIDENCE':{actual:null,commitments:3000000,source:'synthetic-finance/incomplete-evidence/1'}}};
  }
  function validatePlan(plan) {
    insist(plan && amount(plan.envelope) && canonical(Object.keys(plan.objectives).sort())===canonical(Object.keys(OBJECTIVES).sort()),'Invalid envelope or Objective registry.');
    Object.values(plan.objectives).forEach(v=>insist(amount(v),'Invalid Objective allocation.'));
    insist(Array.isArray(plan.epics) && plan.epics.length>0 && new Set(plan.epics.map(e=>e.id)).size===plan.epics.length && new Set(plan.epics.map(e=>e.costId)).size===plan.epics.length,'Epic and cost ownership must be unique.');
    plan.epics.forEach(e=>{
      insist(/^EP-[A-Z0-9-]+$/.test(e.id) && e.costId==='COST-'+e.id && Number.isInteger(e.revision) && e.revision>0 && e.scopeAcceptance==='synthetic-accepted-scope/'+e.id+'/1','Invalid exact Epic/scope binding.');
      insist(typeof e.title==='string' && e.title.trim() && e.title.length<=200 && typeof e.basis==='string' && e.basis.trim() && e.basis.length<=1000,'An Epic title and estimate basis are required.');
      insist(amount(e.allocation) && amount(e.remaining,true) && Number.isFinite(e.capacity) && e.capacity>=0 && e.capacity<=1000,'Invalid Epic allocation, remaining estimate or capacity.');
      distribute(e.allocation,e.shares);
    });
    return plan;
  }
  function validate(state) {
    insist(state && state.contract===CONTRACT && state.synthetic===true && canonical(state.scope)===canonical(SCOPE) && state.policyRevision===POLICY,'Only the exact synthetic scope and policy are supported.');
    insist(Number.isInteger(state.revision) && state.revision>0 && Number.isInteger(state.sourceVersion) && state.sourceVersion>0,'Invalid workflow/source revision.');
    validatePlan(state.draft);
    insist(state.authors.every(id=>Object.hasOwn(ACTORS,id)) && new Set(state.authors).size===state.authors.length,'Invalid author binding.');
    state.draft.epics.forEach(e=>{const o=state.observations[e.id]; insist(o && amount(o.actual,true) && amount(o.commitments,true) && typeof o.source==='string' && o.source,'Missing or invalid finance observation.'); total([o.actual,o.commitments,e.remaining]);});
    insist(new Set(state.unmatched.map(o=>o.id)).size===state.unmatched.length && state.unmatched.every(o=>amount(o.amount) && o.source==='synthetic-finance/unmatched-sample'),'Invalid unmatched observations.');
    return state;
  }
  function ledger(state, plan=state.draft) {
    validate(state); validatePlan(plan);
    const rows=plan.epics.map(e=>{const o=state.observations[e.id]; const forecast=total([o.actual,o.commitments,e.remaining]); return {...clone(e),...clone(o),forecast,allocations:distribute(e.allocation,e.shares),costShares:{actual:distribute(o.actual,e.shares),commitments:distribute(o.commitments,e.shares),remaining:distribute(e.remaining,e.shares),forecast:Object.fromEntries(Object.keys(e.shares).map(id=>[id,total([distribute(o.actual,e.shares)[id],distribute(o.commitments,e.shares)[id],distribute(e.remaining,e.shares)[id]])]))},krs:[...new Set(Object.keys(e.shares).flatMap(id=>OBJECTIVES[id]))]};});
    const objectives=Object.keys(OBJECTIVES).map(id=>{
      const owned=rows.filter(e=>Object.hasOwn(e.shares,id)); const allocations=total(owned.map(e=>e.allocations[id]));
      const forecast=state.unmatched.length?null:total(owned.map(e=>e.costShares.forecast[id]));
      return {id,allocation:plan.objectives[id],epicAllocation:allocations,reserve:plan.objectives[id]-allocations,forecast,headroom:forecast===null?null:plan.objectives[id]-forecast,krs:clone(OBJECTIVES[id])};
    });
    const allocated=total(Object.values(plan.objectives)), unmatched=total(state.unmatched.map(o=>o.amount));
    const forecast=unmatched>0?null:total(rows.map(e=>e.forecast));
    return {rows,objectives,envelope:plan.envelope,allocated,reserve:plan.envelope-allocated,forecast,unmatched,coverage:rows.filter(e=>e.forecast!==null).length};
  }
  function conserved(state) {
    const p=ledger(state); insist(p.reserve>=0,'Objective allocations exceed the proposed envelope.');
    insist(p.objectives.every(o=>o.reserve>=0),'Epic allocations exceed an Objective allocation; revise the amounts or splits.'); return p;
  }
  function currentSubmission(state) { return [...state.submissions].reverse().find(s=>s.revision===state.revision) || null; }
  function event(state,type,actor,reason) { state.events.push({id:state.events.length+1,type,actor,revision:state.revision,sourceVersion:state.sourceVersion,reason,at:new Date().toISOString()}); }
  function revise(state,actor,reason) {
    const pending=currentSubmission(state); if(pending && pending.status==='SUBMITTED'){pending.status='SUPERSEDED';event(state,'REVIEW_INVALIDATED',actor,'Material change: '+reason);}
    state.revision++; state.authors=[...new Set([...state.authors,actor])]; event(state,'DRAFT_REVISED',actor,reason);
  }
  async function digest(value) {
    const cryptoAPI=global.crypto || (typeof require==='function'?require('node:crypto').webcrypto:null);
    insist(cryptoAPI && cryptoAPI.subtle,'SHA-256 is unavailable; simulated review cannot proceed.');
    const bytes=await cryptoAPI.subtle.digest('SHA-256',new TextEncoder().encode(canonical(value)));
    return [...new Uint8Array(bytes)].map(v=>v.toString(16).padStart(2,'0')).join('');
  }
  const PROPOSAL = 'northstar-investment-proposal-reference/v1';
  const proposalSnapshot = state => ({contract:state.contract,scope:state.scope,policyRevision:state.policyRevision,revision:state.revision,sourceVersion:state.sourceVersion,draft:state.draft,observations:state.observations,unmatched:state.unmatched});
  async function generateInvestmentProposal(state, input, provider='reference') {
    validate(state);
    insist(provider==='reference','Live Composite AI is not configured. Connect an approved server-side provider and evaluator; no reference fallback is used.');
    insist(input && typeof input.intent==='string' && input.intent.trim().length>=10 && input.intent.length<=2000 && amount(input.envelope),'Enter an investment intent of 10–2000 characters and a valid funding envelope.');
    insist(input.priorities && canonical(Object.keys(input.priorities).sort())===canonical(Object.keys(OBJECTIVES).sort()) && Object.values(input.priorities).every(v=>Number.isInteger(v)&&v>=1&&v<=5),'Choose a priority from 1 to 5 for every Objective.');
    const p=ledger(state), floors=Object.fromEntries(p.objectives.map(o=>{const known=total(p.rows.filter(r=>Object.hasOwn(r.shares,o.id)).map(r=>total(['actual','commitments','remaining'].map(k=>r.costShares[k][o.id]===null?0:r.costShares[k][o.id]))));return [o.id,Math.max(o.epicAllocation,known)];}));
    const required=total(Object.values(floors)), blocked=required>input.envelope, remaining=Math.max(0,input.envelope-required);
    const weights=Object.values(input.priorities).reduce((a,b)=>a+b,0);
    const rows=Object.keys(OBJECTIVES).map(id=>({id,n:Number(BigInt(remaining)*BigInt(input.priorities[id])/BigInt(weights)),r:Number(BigInt(remaining)*BigInt(input.priorities[id])%BigInt(weights))}));
    let cents=remaining-rows.reduce((n,r)=>n+r.n,0);
    [...rows].sort((a,b)=>b.r-a.r||a.id.localeCompare(b.id)).forEach(r=>{if(cents>0){r.n++;cents--;}});
    return {contract:PROPOSAL,provider:'reference',sourceDigest:await digest(proposalSnapshot(state)),input:clone(input),status:blocked?'BLOCKED':'INCOMPLETE',envelope:input.envelope,objectives:Object.fromEntries(rows.map(r=>[r.id,floors[r.id]+r.n])),minimumKnownFunding:required,shortfall:Math.max(0,required-input.envelope),financeCoverage:p.coverage+'/'+p.rows.length,missingFinance:p.rows.filter(r=>r.forecast===null).map(r=>r.id),unmatched:p.unmatched,requiredCapacity:state.draft.epics.reduce((n,e)=>n+e.capacity,0),capacityStatus:'MANAGEMENT_VALIDATION_REQUIRED',method:'Retain Epic allocations and known forecast floors; distribute the remaining envelope by explicit Objective priorities. Intent is retained for review, not interpreted by a model.',alternatives:['Revise Objective priorities to compare reserve allocations.','Ask management to estimate scope deferral or additional capacity before changing Epic costs.','Reconcile missing finance evidence before asserting affordability.']};
  }
  async function evaluateInvestmentProposal(state, proposal) {
    insist(proposal && proposal.contract===PROPOSAL && proposal.provider==='reference','Unsupported proposal provider or contract.');
    insist(proposal.sourceDigest===await digest(proposalSnapshot(state)),'Stale investment proposal; generate again against the current funding and finance sources.');
    const expected=await generateInvestmentProposal(state,proposal.input);
    insist(canonical(expected)===canonical(proposal),'Investment proposal failed independent reference evaluation; output changed.');
    insist(proposal.status!=='BLOCKED','Funding envelope is below known allocation and forecast floors; revise the proposal.');
    return {status:proposal.status,digest:await digest(proposal)};
  }
  async function command(input, request) {
    validate(input); insist(request && Object.hasOwn(ACTORS,request.actor) && canonical(request.scope)===canonical(SCOPE),'Wrong synthetic actor or organization/division/period/currency scope.');
    insist(typeof request.key==='string' && /^[a-zA-Z0-9-]{1,100}$/.test(request.key),'A retry key is required.');
    const requestDigest=await digest(clone(request)); const receiptIndex=input.receipts.findIndex(r=>r.key===request.key);
    if(receiptIndex>=0){const previous=input.receipts[receiptIndex];insist(previous.digest===requestDigest,'Retry key reused with different content or actor.');return {...clone(previous.result),receipts:clone(input.receipts.slice(0,receiptIndex+1))};}
    const grants={investment:'plan',envelope:'plan',epic:'estimate',revise:'submit',submit:'submit',approve:'approve',reject:'approve',finance:'reconcile',unmatched:'reconcile',map:'reconcile'};
    insist(Object.hasOwn(grants,request.type) && ACTORS[request.actor].grants.includes(grants[request.type]),'The selected simulated actor cannot perform this action.');
    insist(request.expectedRevision===input.revision,'Stale proposal revision; reload the current package and review again.');
    const state=clone(input); const actor=request.actor;
    if(request.type==='investment') {
      const evaluation=await evaluateInvestmentProposal(input,request.proposal);
      revise(state,actor,'Reference investment proposal added as an incomplete planning draft.');
      state.draft.envelope=request.proposal.envelope;state.draft.objectives=clone(request.proposal.objectives);
      event(state,'INVESTMENT_PROPOSAL_IMPORTED',actor,'Reference provider · '+evaluation.status+' · intent: '+request.proposal.input.intent+' · SHA-256 '+evaluation.digest+' · management capacity validation required.');
      state.events[state.events.length-1].proposal=clone(request.proposal);
    } else if(request.type==='envelope') {
      insist(amount(request.envelope) && request.objectives && canonical(Object.keys(request.objectives).sort())===canonical(Object.keys(OBJECTIVES).sort()),'Invalid envelope/Objective input.');
      Object.values(request.objectives).forEach(v=>insist(amount(v),'Invalid Objective amount.'));
      revise(state,actor,'Envelope or Objective allocations changed.'); state.draft.envelope=request.envelope; state.draft.objectives=clone(request.objectives);
    } else if(request.type==='epic') {
      insist(request.epic && typeof request.epic.id==='string','An Epic is required.');
      const old=state.draft.epics.find(e=>e.id===request.epic.id);
      insist(['create','update'].includes(request.mode) && (request.mode==='create'?!old:!!old),'Choose a new unique Epic for creation or an existing Epic for update.');
      insist(old || /^EP-DEMO-[A-Z0-9-]+$/.test(request.epic.id),'New fictional Epic IDs must start EP-DEMO-.');
      const e=seedEpic(request.epic.id,request.epic.title,request.epic.allocation,request.epic.remaining,clone(request.epic.shares),request.epic.capacity,request.epic.basis);e.revision=old?old.revision+1:1;
      revise(state,actor,'Epic estimate, allocation or Objective cost shares changed.');
      if(old)state.draft.epics[state.draft.epics.findIndex(x=>x.id===e.id)]=e; else {state.draft.epics.push(e);state.observations[e.id]={actual:null,commitments:null,source:'synthetic-finance/not-supplied'};}
    } else if(request.type==='revise') {
      revise(state,actor,'Explicit new draft; active approval remains historical and effective.');
    } else if(request.type==='submit') {
      conserved(state); insist(!currentSubmission(state),'Revise the package before submitting it again.');
      insist(typeof request.reason==='string' && request.reason.trim().length>=10 && request.reason.length<=1000,'Provide a review rationale of 10–1000 characters.');
      const body={contract:CONTRACT,scope:clone(state.scope),policyRevision:POLICY,revision:state.revision,sourceVersion:state.sourceVersion,financeDigest:await digest({observations:state.observations,unmatched:state.unmatched}),expectedActiveRevision:state.active?state.active.revision:'NONE',authors:[...new Set([...state.authors,actor])].sort(),submittedBy:actor,reason:request.reason.trim(),plan:clone(state.draft)};
      state.submissions.push({id:'FUND-'+state.revision+'-'+(state.submissions.length+1),revision:state.revision,status:'SUBMITTED',digest:await digest(body),body});event(state,'SUBMITTED',actor,'Exact package submitted for independent simulated review.');
    } else if(request.type==='approve' || request.type==='reject') {
      const submission=state.submissions.find(s=>s.id===request.submissionId);
      insist(submission && submission.status==='SUBMITTED' && submission.revision===state.revision,'No current submitted package; a revised or decided package needs new review.');
      insist(!submission.body.authors.includes(actor),'Independent approver required; a package author cannot approve or reject their own package.');
      insist(typeof request.reason==='string' && request.reason.trim().length>=10 && request.reason.length<=1000,'Provide a decision reason of 10–1000 characters.');
      insist(submission.digest===await digest(submission.body) && canonical(submission.body.plan)===canonical(state.draft) && submission.body.sourceVersion===state.sourceVersion && submission.body.financeDigest===await digest({observations:state.observations,unmatched:state.unmatched}) && canonical(submission.body.scope)===canonical(state.scope) && submission.body.policyRevision===POLICY,'Package digest or source bindings changed; new review required.');
      insist(submission.body.expectedActiveRevision===(state.active?state.active.revision:'NONE'),'Effective package changed; rebase and resubmit.');
      if(request.type==='approve') {
        conserved(state); insist(state.draft.envelope<=ACTORS[actor].limit,'Proposed envelope exceeds this simulated reviewer’s delegated limit.');
        if(state.active){const earlier=state.submissions.find(s=>s.id===state.active.submissionId);if(earlier)earlier.status='SUPERSEDED';}
        state.active={revision:state.revision,submissionId:submission.id,digest:submission.digest,plan:clone(submission.body.plan)};
      }
      submission.status=request.type==='approve'?'APPROVED':'REJECTED';
      state.decisions.push({id:'DEC-'+(state.decisions.length+1),action:submission.status,submissionId:submission.id,revision:state.revision,digest:submission.digest,actor,policyRevision:POLICY,sourceVersion:state.sourceVersion,reason:request.reason.trim(),at:new Date().toISOString()});
      event(state,'SIMULATED_'+submission.status,actor,request.reason.trim());
    } else {
      insist(request.expectedSourceVersion===state.sourceVersion,'Stale financial source revision.');
      if(request.type==='finance') {
        state.draft.epics.forEach(e=>{const o=state.observations[e.id];if(o.actual===null)o.actual=e.id==='EP-FUND-EVIDENCE'?4000000:0;if(o.commitments===null)o.commitments=0;o.source='synthetic-finance/complete-sample/'+(state.sourceVersion+1);});
      } else if(request.type==='unmatched') {
        insist(typeof request.observationId==='string' && /^OBS-DEMO-[A-Z0-9-]+$/.test(request.observationId) && !state.unmatched.some(o=>o.id===request.observationId) && !state.events.some(e=>e.observationId===request.observationId),'Duplicate or invalid source observation identity.');
        state.unmatched.push({id:request.observationId,amount:12345,source:'synthetic-finance/unmatched-sample'});
      } else {
        const observation=state.unmatched.find(o=>o.id===request.observationId);const target=state.observations[request.epicId];
        insist(observation && Object.hasOwn(state.observations,request.epicId) && state.draft.epics.some(e=>e.id===request.epicId) && target && target.actual!==null,'Select an unmatched observation and an Epic with complete actuals before mapping.');
        target.actual=total([target.actual,observation.amount]);target.source='synthetic-finance/reconciled-sample/'+(state.sourceVersion+1);state.unmatched=state.unmatched.filter(o=>o.id!==observation.id);
      }
      state.sourceVersion++;const pending=currentSubmission(state);
      if(pending && pending.status==='SUBMITTED'){pending.status='SUPERSEDED';state.revision++;event(state,'REVIEW_INVALIDATED',actor,'Finance source changed; submit the new exact source binding.');}
      event(state,'SOURCE_'+request.type.toUpperCase(),actor,'Synthetic finance sample only; no external data or writes.');
      if(request.observationId)state.events[state.events.length-1].observationId=request.observationId;
    }
    validate(state);
    // Snapshots omit receipt payloads to avoid recursive/exponential history copies.
    const result=clone(state);delete result.receipts;
    state.receipts.push({key:request.key,digest:requestDigest,result});return state;
  }
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=n=>n===null?'Unavailable':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2}).format(n/100);
  const editMoney=n=>n===null?'':(n/100).toFixed(2);
  const field=(label,name,value,note='')=>'<label>'+esc(label)+'<input name="'+name+'" value="'+esc(value)+'" inputmode="decimal" autocomplete="off">'+(note?'<small>'+esc(note)+'</small>':'')+'</label>';
  let memory={state:create(),actor:'leader',step:'plan',epic:'EP-FUND-FOUNDATION',message:'',error:false,key:0,forms:{},reason:'Reviewed synthetic allocation and source limitations for this planning period.'};
  function markup(state, actor='leader', step='plan', epicId='EP-FUND-FOUNDATION', message='', error=false) {
    const p=ledger(state), selected=state.draft.epics.find(e=>e.id===epicId), isNew=!selected;
    const e=selected || seedEpic('EP-DEMO-NEW','New fictional Epic',0,0,{O9:10000},0,'Fictional management estimate.');
    const submission=currentSubmission(state), status=submission?submission.status:'DRAFT';
    const can=grant=>ACTORS[actor].grants.includes(grant);
    const independent=!!submission && !submission.body.authors.includes(actor);
    const table=(caption,headers,rows)=>'<div class="nfw-table" tabindex="0" role="region" aria-label="'+esc(caption)+'"><table><caption>'+esc(caption)+'</caption><thead><tr>'+headers.map(h=>'<th scope="col">'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table></div>';
    const cell=v=>'<td>'+esc(v)+'</td>';
    const objectives=table('Proposed Objective rollups · not a spending authorization',['Objective / KRs','Proposed allocation','Epic allocations','Reserve','Forecast','Headroom'],p.objectives.map(o=>'<tr><th scope="row">'+esc(o.id+' · '+o.krs.join(', '))+'</th>'+[o.allocation,o.epicAllocation,o.reserve,o.forecast,o.headroom].map(n=>cell(money(n))).join('')+'</tr>'));
    const epics=table('Draft Epic cost ledger · each cost counted once',['Epic / cost ID','Objective cost shares / KRs','Proposed allocation','Actuals','Outstanding commitments','Uncommitted remaining','Forecast','Capacity'],p.rows.map(r=>'<tr><th scope="row">'+esc(r.id)+'<small>'+esc(r.costId)+'</small></th>'+cell(Object.entries(r.shares).map(([id,w])=>id+' '+(w/100)+'%').join(' / ')+' · '+r.krs.join(', '))+[r.allocation,r.actual,r.commitments,r.remaining,r.forecast].map(n=>cell(money(n))).join('')+cell(r.capacity+' FTE quarters')+'</tr>'));
    const active=state.active?ledger(state,state.active.plan):null;
    const activeDetails=active?'<p>Effective envelope '+money(active.envelope)+' · current reconciled forecast '+money(active.forecast)+' · '+active.coverage+'/'+active.rows.length+' Epic forecasts known.</p>'+table('Effective approved Objective allocations · simulated',['Objective','Allocation','Current forecast','Headroom'],active.objectives.map(o=>'<tr><th scope="row">'+esc(o.id)+'</th>'+[o.allocation,o.forecast,o.headroom].map(n=>cell(money(n))).join('')+'</tr>')):'<p>No effective package. Draft envelope and allocations remain proposed until independent simulated approval.</p>';
    return '<section class="nfw" aria-labelledby="funding-workspace-title"><div class="nfw-heading"><small>SIMULATED WORKFLOW · BROWSER MEMORY ONLY</small><h2 id="funding-workspace-title" tabindex="-1">Funding entry &amp; Epic ledger</h2><p>'+esc(SCOPE.organization)+' · '+esc(SCOPE.division)+' · '+esc(SCOPE.period)+' · USD</p><p>Period '+esc(SCOPE.startsOn)+'–'+esc(SCOPE.endsOn)+' · '+esc(SCOPE.timezone)+' · Finance sample revision '+state.sourceVersion+'</p><p>Fictional data and role play only. No authenticated identity, durable storage, finance imports, payments, staffing or spending authority. CAR and Epic acceptance are unchanged.</p><button type="button" data-fw-back>Back to reference overview</button></div>'+
      '<div class="nfw-context"><label>Simulated funding actor<select data-fw-actor aria-label="Simulated funding actor">'+Object.entries(ACTORS).map(([id,a])=>'<option value="'+id+'" '+(actor===id?'selected':'')+'>'+esc(a.name)+'</option>').join('')+'</select></label><p>Draft revision '+state.revision+' · '+esc(status)+' · Effective revision '+(state.active?state.active.revision:'NONE')+'</p></div>'+
      '<div class="nfw-message" '+(message?'':'hidden')+' role="'+(error?'alert':'status')+'">'+esc(message)+'</div>'+
      '<nav class="nfw-steps" aria-label="Funding workflow steps">'+[['proposal','Draft investment proposal'],['plan','1 · Funding entry'],['ledger','2 · Epic ledger'],['review','3 · Funding review'],['reconcile','4 · Reconciliation'],['history','5 · Decision history']].map(([id,title])=>'<button type="button" data-fw-step="'+id+'" aria-pressed="'+(step===id)+'">'+title+'</button>').join('')+'</nav>'+
      '<section class="nfw-panel" '+(step==='proposal'?'':'hidden')+'><h3>Draft an investment proposal</h3><p><strong>Offline reference provider · live Composite AI is not connected.</strong> This example uses explicit priorities and known cost floors. Your intent is retained for review; a model does not interpret it.</p><form data-fw-form="proposal"><fieldset '+(can('plan')?'':'disabled')+'><legend>Leadership investment intent</legend><label>What outcome should this investment support?<textarea name="intent" minlength="10" maxlength="2000">Improve investment decisions while keeping delivery realistic.</textarea></label>'+field('Funding envelope (USD)','envelope',editMoney(state.draft.envelope))+'<div class="nfw-fields">'+[['O9','Investment decisions'],['O10','Governed reuse'],['O11','Evidence confidence']].map(([id,title])=>'<label>'+esc(id+' · '+title)+' priority<select name="'+id+'">'+[1,2,3,4,5].map(n=>'<option value="'+n+'" '+(n===3?'selected':'')+'>'+n+(n===1?' · lower':n===5?' · higher':'')+'</option>').join('')+'</select></label>').join('')+'</div><button type="submit">Generate reference proposal</button></fieldset></form><div data-fw-proposal-result>'+proposalMarkup(memory.proposal,can('plan'))+'</div></section>'+
      '<section class="nfw-panel" '+(step==='plan'?'':'hidden')+'><h3>Propose the funding package</h3><p>Enter USD values. This first draft binds a proposed envelope; independent approval activates envelope and allocations together. Draft deficits are visible and block submission.</p><form data-fw-form="envelope"><fieldset '+(can('plan')?'':'disabled')+'><legend>Envelope and Objective allocations</legend><div class="nfw-fields">'+field('Funding envelope (USD)','envelope',editMoney(state.draft.envelope))+Object.keys(OBJECTIVES).map(id=>field(id+' allocation (USD)',id,editMoney(state.draft.objectives[id]))).join('')+'</div><button type="submit">Save funding draft</button></fieldset></form>'+(!can('plan')?'<p>Choose Alex, the simulated leader, to edit the envelope and Objective allocations.</p>':'')+'<p>Proposed envelope reserve: '+money(p.reserve)+'. Reserves are allocations, not forecast spending.</p>'+objectives+'</section>'+
      '<section class="nfw-panel" '+(step==='ledger'?'':'hidden')+'><h3>Own each Epic cost once</h3><p>Objective shares must total 100%. KR links identify supported outcomes and never multiply costs. Each Epic has one aggregate synthetic cost record; the production itemized ledger remains planned.</p>'+epics+'<label>Epic to estimate<select data-fw-epic aria-label="Epic to estimate">'+state.draft.epics.map(r=>'<option value="'+esc(r.id)+'" '+(epicId===r.id?'selected':'')+'>'+esc(r.id)+'</option>').join('')+'<option value="NEW" '+(isNew?'selected':'')+'>Add a new fictional Epic</option></select></label><form data-fw-form="epic"><fieldset '+(can('estimate')?'':'disabled')+'><legend>Management estimate and allocation</legend>'+(isNew?'<label>New fictional Epic ID<input name="epicId" value="EP-DEMO-NEW" autocomplete="off"><small>Use EP-DEMO- followed by uppercase letters, digits or hyphens.</small></label>':'<p>Exact scope reference: '+esc(e.scopeAcceptance)+' · Epic estimate revision '+e.revision+'</p>')+'<label>Epic title<input name="title" value="'+esc(e.title)+'" maxlength="200"></label><div class="nfw-fields">'+field('Epic allocation (USD)','allocation',editMoney(e.allocation))+field('Uncommitted remaining forecast (USD)','remaining',editMoney(e.remaining),'Blank means unavailable; it never means zero.')+field('Required capacity (FTE quarters)','capacity',e.capacity)+Object.keys(OBJECTIVES).map(id=>field(id+' cost share (%)',id,((e.shares[id]||0)/100).toFixed(2))).join('')+'</div><label>Estimate basis<textarea name="basis" maxlength="1000">'+esc(e.basis)+'</textarea></label><button type="submit">'+(isNew?'Add fictional Epic':'Save Epic estimate')+'</button></fieldset></form>'+(!can('estimate')?'<p>Choose Morgan, the simulated management estimator, to add or revise an Epic.</p>':'')+'<p>Actuals and outstanding commitments are read-only finance samples. Forecast coverage: '+p.coverage+' of '+p.rows.length+' Epics. Complete portfolio forecast: '+money(p.forecast)+'.</p>'+objectives+'</section>'+
      '<section class="nfw-panel" '+(step==='review'?'':'hidden')+'><h3>Review the exact funding package</h3><p>Funding review is separate from CAR approval and management Epic acceptance. A package author cannot act as its independent financial reviewer.</p>'+objectives+'<p>Draft envelope '+money(p.envelope)+' · unique Epic forecast '+money(p.forecast)+' · unmatched '+money(p.unmatched)+'. Unknown or incomplete sources remain visible.</p>'+(submission?'<p>Package '+esc(submission.id)+' · '+esc(submission.status)+' · source revision '+submission.body.sourceVersion+'</p><p>SHA-256 <code>'+esc(submission.digest)+'</code></p>':'<p>No submitted package at this revision.</p>')+'<label>Submission or decision reason<textarea data-fw-reason aria-label="Submission or decision reason" maxlength="1000">'+esc(memory.reason)+'</textarea></label><div class="nfw-actions"><button type="button" data-fw-action="submit" '+(can('submit')&&!submission?'':'disabled')+'>Submit exact package</button><button type="button" data-fw-action="approve" '+(can('approve')&&independent&&status==='SUBMITTED'?'':'disabled')+'>Simulate approval</button><button type="button" data-fw-action="reject" '+(can('approve')&&independent&&status==='SUBMITTED'?'':'disabled')+'>Simulate rejection</button><button type="button" data-fw-action="revise" '+(can('submit')?'':'disabled')+'>Start new revision</button></div>'+(!independent&&submission?'<p>Independent reviewer required. Choose Jordan to simulate a separate financial decision.</p>':'')+'<p>Jordan’s simulated delegated envelope limit is $2,000,000.00. Review cannot override missing scope bindings, allocation deficits, stale sources or the limit.</p><h4>Effective approved package</h4>'+activeDetails+'</section>'+
      '<section class="nfw-panel" '+(step==='reconcile'?'':'hidden')+'><h3>Reconcile synthetic source evidence</h3><p>These buttons load fixed fictional source examples; they import no finance data. New Epics begin with unknown actuals and commitments. Complete zero samples are explicitly attested, not inferred from absence. A source change invalidates pending review; historical approved allocations stay effective.</p><div class="nfw-actions"><button type="button" data-fw-action="finance" '+(can('reconcile')?'':'disabled')+'>Load complete finance sample</button><button type="button" data-fw-action="unmatched" '+(can('reconcile')?'':'disabled')+'>Add unmatched sample cost</button></div>'+(!can('reconcile')?'<p>Choose Casey, the simulated finance reconciler, to load or map source examples.</p>':'')+'<p>Unmatched suspense: '+money(p.unmatched)+'. Any unmatched cost keeps the complete portfolio forecast unavailable.</p>'+table('Synthetic finance sources',['Epic','Actuals','Outstanding commitments','Source'],p.rows.map(r=>'<tr><th scope="row">'+esc(r.id)+'</th>'+cell(money(r.actual))+cell(money(r.commitments))+cell(r.source)+'</tr>'))+(state.unmatched.length?'<form data-fw-form="map"><fieldset '+(can('reconcile')?'':'disabled')+'><legend>Assign an unmatched source record once</legend><label>Unmatched observation<select name="observationId">'+state.unmatched.map(o=>'<option value="'+esc(o.id)+'">'+esc(o.id)+' · '+money(o.amount)+'</option>').join('')+'</select></label><label>Owning Epic<select name="epicId">'+p.rows.filter(r=>r.actual!==null).map(r=>'<option value="'+esc(r.id)+'">'+esc(r.id)+'</option>').join('')+'</select></label><button type="submit">Map unmatched sample</button></fieldset></form>':'<p>No unmatched observations remain.</p>')+'</section>'+
      '<section class="nfw-panel" '+(step==='history'?'':'hidden')+'><h3>Retained simulated decision history</h3><p>History exists only in this browser page’s memory. Reload or reset clears it. Exact digest-bound decisions remain visible when proposals change; no durable audit store is demonstrated.</p>'+table('Simulated funding decisions',['Decision','Package / revision','Actor / policy','Reason','Exact digest'],state.decisions.map(d=>'<tr><th scope="row">'+esc(d.action+' · '+d.id)+'</th>'+cell(d.submissionId+' / '+d.revision)+cell(d.actor+' / '+d.policyRevision)+cell(d.reason)+cell(d.digest)+'</tr>'))+'<ol class="nfw-history">'+state.events.map(e=>'<li><strong>'+esc(e.type)+'</strong> · revision '+e.revision+' · source '+e.sourceVersion+' · '+esc(e.actor)+'<p>'+esc(e.reason)+' · '+esc(e.at)+'</p></li>').join('')+'</ol><button type="button" data-fw-reset>Reset funding workspace</button></section></section>';
  }
  function proposalMarkup(proposal,canImport) {
    if(!proposal)return '<p>Enter your envelope and priorities, then generate a proposal to review before adding a draft.</p>';
    return '<h4>Proposed investment plan · '+esc(proposal.status)+'</h4><p>'+esc(proposal.method)+'</p><p>Intent: '+esc(proposal.input.intent)+' · priorities: '+esc(Object.entries(proposal.input.priorities).map(([id,n])=>id+' '+n+'/5').join(', '))+'</p><ul>'+Object.entries(proposal.objectives).map(([id,n])=>'<li>'+esc(id)+' proposed allocation: '+money(n)+'</li>').join('')+'</ul><p>Envelope: '+money(proposal.envelope)+' · known funding floor: '+money(proposal.minimumKnownFunding)+' · shortfall: '+money(proposal.shortfall)+'.</p><p>Finance coverage: '+esc(proposal.financeCoverage)+' · missing forecasts: '+esc(proposal.missingFinance.join(', ')||'none')+' · unmatched: '+money(proposal.unmatched)+'.</p><p>Management must validate '+esc(proposal.requiredCapacity)+' FTE quarters of existing demand against available people, skills, timing and dependencies. No engineer is added and no delivery improvement is assumed.</p><h4>Alternatives to review</h4><ul>'+proposal.alternatives.map(a=>'<li>'+esc(a)+'</li>').join('')+'</ul><p>Incomplete planning draft only. Independent reference evaluation checks exact inputs and source version on import. Adding a draft grants no spending or staffing authority.</p><div class="nfw-actions"><button type="button" data-fw-import '+(canImport&&proposal.status!=='BLOCKED'?'':'disabled')+'>Add proposal as draft</button><button type="button" data-fw-discard>Discard proposal</button></div>';
  }
  function mount(container, options={}) {
    if(options.initialStep)memory.step=options.initialStep;
    let busy=false;
    const draw=(focus=null)=>{
      container.innerHTML=markup(memory.state,memory.actor,memory.step,memory.epic,memory.message,memory.error);
      for(const [kind,buffer] of Object.entries(memory.forms)){if(buffer.revision!==memory.state.revision || (kind==='epic' && buffer.epic!==memory.epic))continue;const form=container.querySelector('[data-fw-form="'+kind+'"]');if(form)for(const [name,value] of Object.entries(buffer.values)){const field=form.elements.namedItem(name);if(field)field.value=value;}}
      if(focus){let target=container.querySelector(focus);if(target?.matches(':disabled'))target=container.querySelector('.nfw-message');if(target){if(target.matches('.nfw-message'))target.setAttribute('tabindex','-1');target.focus();}}
    };
    const execute=async (type, extra={}, focus=null)=>{
      if(busy)return;busy=true;
      container.setAttribute('aria-busy','true');
      try {
        const request={type,actor:memory.actor,scope:clone(SCOPE),expectedRevision:memory.state.revision,expectedSourceVersion:memory.state.sourceVersion,key:'UI-'+(++memory.key),...extra};
        memory.state=await command(memory.state,request);memory.error=false;memory.forms={};memory.proposal=null;
        if(type==='investment'){memory.step='plan';}
        memory.message=type==='investment'?'Reference proposal added as an incomplete planning draft. Management validation and independent financial review remain required.':type==='approve'?'SIMULATED APPROVED: the exact package is now effective in this fictional workspace.':type==='reject'?'SIMULATED REJECTED: no proposed allocations became effective.':type==='submit'?'Exact synthetic package submitted. Switch to Jordan for independent review.':'Synthetic workspace updated. Material changes require a new exact-version review.';
      } catch(error) {memory.error=true;memory.message=error.message;}
      finally {busy=false;container.removeAttribute('aria-busy');draw(focus || '.nfw-message');}
    };
    container.oninput=event=>{const form=event.target.closest('form[data-fw-form]');if(form?.dataset.fwForm==='proposal'){memory.proposal=null;container.querySelector('[data-fw-proposal-result]').innerHTML=proposalMarkup(null,false);}
      if(form)memory.forms[form.dataset.fwForm]={revision:memory.state.revision,epic:memory.epic,values:Object.fromEntries(new FormData(form))};if(event.target.matches('[data-fw-reason]'))memory.reason=event.target.value;};
    container.onchange=event=>{
      if(busy)return;
      if(event.target.matches('[data-fw-actor]')){memory.actor=event.target.value;memory.message='';draw('[data-fw-actor]');}
      if(event.target.matches('[data-fw-epic]')){memory.epic=event.target.value;draw('[data-fw-epic]');}
    };
    container.onclick=event=>{
      const button=event.target.closest('button');if(!button || !container.contains(button) || busy)return;
      if(button.hasAttribute('data-fw-step')){memory.step=button.dataset.fwStep;memory.message='';draw('[data-fw-step="'+memory.step+'"]');}
      else if(button.hasAttribute('data-fw-import')){execute('investment',{proposal:memory.proposal});}
      else if(button.hasAttribute('data-fw-discard')){memory.proposal=null;memory.message='Proposal discarded. Funding draft unchanged.';draw('.nfw-message');}
      else if(button.hasAttribute('data-fw-back')){if(options.onBack)options.onBack();}
      else if(button.hasAttribute('data-fw-reset')){memory={state:create(),actor:'leader',step:'plan',epic:'EP-FUND-FOUNDATION',message:'Synthetic funding workspace reset; browser-memory history cleared.',error:false,key:0,forms:{},reason:'Reviewed synthetic allocation and source limitations for this planning period.'};draw('#funding-workspace-title');}
      else if(button.hasAttribute('data-fw-action')){
        const type=button.dataset.fwAction, reason=container.querySelector('[data-fw-reason]');
        execute(type,{reason:reason?reason.value:'',submissionId:currentSubmission(memory.state)?.id,observationId:'OBS-DEMO-'+(memory.state.sourceVersion+1)},'[data-fw-action="'+type+'"]');
      }
    };
    container.onsubmit=event=>{
      event.preventDefault();if(busy)return;
      const form=event.target, kind=form.dataset.fwForm, data=new FormData(form);
      try {
        if(kind==='proposal'){
          const input={intent:data.get('intent').trim(),envelope:dollars(data.get('envelope')),priorities:Object.fromEntries(Object.keys(OBJECTIVES).map(id=>[id,Number(data.get(id))]))};
          const values=canonical(Object.fromEntries(data));busy=true;container.setAttribute('aria-busy','true');
          generateInvestmentProposal(memory.state,input).then(proposal=>{
            insist(values===canonical(Object.fromEntries(new FormData(form))),'Inputs changed during generation; generate again.');
            memory.proposal=proposal;memory.message='Reference proposal generated for review. Live Composite AI is not configured.';memory.error=false;
          }).catch(error=>{memory.proposal=null;memory.message=error.message;memory.error=true;}).finally(()=>{busy=false;container.removeAttribute('aria-busy');draw('.nfw-message');});
        } else if(kind==='envelope')execute('envelope',{envelope:dollars(data.get('envelope')),objectives:Object.fromEntries(Object.keys(OBJECTIVES).map(id=>[id,dollars(data.get(id))]))});
        else if(kind==='epic') {
          const shares=Object.fromEntries(Object.keys(OBJECTIVES).map(id=>[id,dollars(data.get(id))]).filter(([,w])=>w>0));
          const capacity=data.get('capacity').trim();insist(/^\d+(?:\.\d{1,2})?$/.test(capacity),'Enter a nonnegative aggregate capacity with up to two decimals.');
          const id=memory.epic==='NEW'?data.get('epicId').trim():memory.epic;
          execute('epic',{mode:memory.epic==='NEW'?'create':'update',epic:{id,title:data.get('title'),allocation:dollars(data.get('allocation')),remaining:data.get('remaining').trim()===''?null:dollars(data.get('remaining')),shares,capacity:Number(capacity),basis:data.get('basis')}}).then(()=>{if(!memory.error){memory.epic=id;draw('[data-fw-epic]');}});
        } else if(kind==='map')execute('map',{observationId:data.get('observationId'),epicId:data.get('epicId')});
      } catch(error){memory.error=true;memory.message=error.message;const status=container.querySelector('.nfw-message');status.hidden=false;status.setAttribute('role','alert');status.textContent=error.message;}
    };
    draw();
  }
  const api=Object.freeze({CONTRACT,SCOPE,ACTORS,create,validate,ledger,conserved,currentSubmission,command,digest,dollars,distribute,generateInvestmentProposal,evaluateInvestmentProposal,markup,mount});
  if(typeof module!=='undefined' && module.exports)module.exports=api;else global.NorthstarFundingWorkflow=api;
})(typeof globalThis==='undefined'?this:globalThis);

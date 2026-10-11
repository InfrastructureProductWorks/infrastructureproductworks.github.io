const assert = require('node:assert/strict');
const path = require('node:path');
const assetRoot = process.argv[2];
if (!assetRoot) throw new Error('Pass the dashboard asset directory');
const api = require(path.resolve(assetRoot,'funding-dashboard.js'));
const fixture = require(path.resolve(assetRoot,'funding-fixture.js'));
const copy = () => JSON.parse(JSON.stringify(fixture));
const before = JSON.stringify(fixture);
const baseline = api.project(fixture);
assert.equal(baseline.envelope,100000000);
assert.equal(baseline.allocated,90000000);
assert.equal(baseline.unallocated,10000000);
assert.equal(baseline.rows[0].forecast,53000000);
assert.equal(baseline.rows[0].headroom,-8000000);
assert.equal(baseline.rows[0].capacityGap,1);
assert.equal(baseline.forecast,null);
assert.equal(baseline.fundingGap,null);
assert.equal(baseline.coverage,2);
const complete = copy(); complete.investments[2].actual = 4000000;
assert.equal(api.project(complete).forecast,97000000);
assert.equal(api.project(complete,'reduction').fundingGap,7000000);
assert.equal(api.project(fixture,'reduction').unallocated,0);
const deferred = api.project(fixture,'defer');
assert.equal(deferred.rows[0].forecast,45000000);
assert.equal(deferred.rows[0].headroom,0);
assert.equal(deferred.rows[0].capacityGap,0);
assert.equal(deferred.rows[0].actual,baseline.rows[0].actual);
assert.equal(deferred.rows[0].commitments,baseline.rows[0].commitments);
assert.equal(JSON.stringify(fixture),before);
const absent = copy(); absent.investments[0].remaining = null; delete absent.investments[0].deferral;
assert.equal(api.project(absent).rows[0].forecast,null);
assert.equal(api.project(absent).coverage,1);
for (const mutate of [
 d => d.synthetic=false,
 d => d.currency='EUR',
 d => d.envelope=-1,
 d => d.investments[0].actual=NaN,
 d => d.investments[0].allocation=1.5,
 d => d.investments[0].organization='Other',
 d => d.investments[0].period='FY28 Q1',
 d => d.investments[0].krs=['KR10.2'],
 d => d.investments[0].epics=d.investments[1].epics,
 d => d.investments[0].deferral.cost=99999999,
 d => d.investments[0].deferral.capacity=9,
 d => d.investments[0].availableCapacity=-1,
 d => d.investments[0].actual=Number.MAX_SAFE_INTEGER,
 d => d.observedOn='2026-02-30'
]) { const d=copy(); mutate(d); assert.throws(() => api.project(d)); }
assert.throws(() => api.project(fixture,'approve'));
const html = api.markup(fixture,'defer','O9');
assert.match(html,/Delivery consequence/);
assert.match(html,/do not authorize spending/);
assert.match(html,/Unavailable/);
const malicious=copy(); malicious.investments[0].title='<script>alert(1)</script>';
assert.doesNotMatch(api.markup(malicious),/<script>/);
console.log('Funding semantic tests passed: nulls, arithmetic, source scope, scenarios, mutation and escaping.');

const alternate=copy();
alternate.investments[0].epics[1]='EP-ALTERNATE';
alternate.investments[0].deferral={epic:'EP-ALTERNATE',kr:'KR9.6',cost:12345,capacity:0.5,consequence:'Benefit evidence moves later.'};
alternate.investments[1].deferral={epic:'EP-FUND-REUSE',kr:'KR10.2',cost:120000,capacity:1.5,consequence:'Reuse onboarding moves later.'};
const multiple=api.markup(alternate,'defer','O9');
assert.match(multiple,/Defer 2 Epics/);
assert.match(multiple,/EP-ALTERNATE for KR9.6; remove \$123.45/);
assert.match(multiple,/EP-FUND-REUSE for KR10.2; remove \$1,200/);
assert.match(multiple,/1.5 FTE quarters/);
assert.doesNotMatch(multiple,/Assumption: defer EP-FUND-DISCOVERY/);
const noDeferral=copy();noDeferral.investments.forEach(i=>delete i.deferral);
assert.match(api.markup(noDeferral,'defer'),/No deferral records are available/);
assert.deepEqual(api.project(noDeferral,'defer').rows,api.project(noDeferral).rows);
assert.match(api.markup(fixture),/data-funding-control="queue-O9"/);
console.log('Funding variant tests passed: different/multiple/absent deferrals and cents.');

(async function workflowTests(){
  const w=require(path.resolve(assetRoot,'funding-workflow.js'));
  let key=0;
  const req=(s,type,actor='leader',extra={})=>({type,actor,scope:JSON.parse(JSON.stringify(w.SCOPE)),expectedRevision:s.revision,expectedSourceVersion:s.sourceVersion,key:'TEST-'+(++key),...extra});
  const send=(s,type,actor,extra)=>w.command(s,req(s,type,actor,extra));
  const rationale='Reviewed this exact synthetic package and its missing source coverage.';
  const submit=s=>send(s,'submit','leader',{reason:rationale});
  const approve=s=>send(s,'approve','reviewer',{submissionId:w.currentSubmission(s).id,reason:rationale});
  const expectFailure=async(s,request,pattern)=>{const original=JSON.stringify(s);await assert.rejects(w.command(s,request),pattern);assert.equal(JSON.stringify(s),original);};
  let s=w.create();const untouched=JSON.stringify(s);
  assert.equal(w.ledger(s).coverage,3);assert.equal(w.ledger(s).forecast,null);
  assert.deepEqual(w.ledger(s).objectives.map(o=>o.reserve),[9000000,3000000,3000000]);
  assert.equal(s.active,null);assert.equal(w.dollars('123.45'),12345);
  for(const value of ['1.001','-1','1e3','','NaN','1000000001','01.00'])assert.throws(()=>w.dollars(value));
  const cent=w.distribute(1,{O9:5000,O10:5000});assert.equal(cent.O10,1);assert.equal(cent.O9,0);
  assert.throws(()=>w.distribute(100,{O9:6000,O10:3000}));assert.throws(()=>w.distribute(1,{OTHER:10000}));
  const rounding=w.create();rounding.draft.epics[0].shares={O9:5000,O10:5000};rounding.draft.epics[0].remaining=1;rounding.observations['EP-FUND-FOUNDATION'].actual=1;rounding.observations['EP-FUND-FOUNDATION'].commitments=1;
  const row=w.ledger(rounding).rows[0];assert.equal(row.costShares.forecast.O10,3);assert.equal(row.costShares.forecast.O9,0);
  assert.equal(Object.values(row.costShares.forecast).reduce((a,b)=>a+b),row.forecast);
  s=await send(s,'envelope','leader',{envelope:100000000,objectives:{O9:45000000,O10:30000000,O11:15000000}});
  const e={...s.draft.epics[0],allocation:36000000};
  s=await send(s,'epic','manager',{mode:'update',epic:e});assert.equal(JSON.stringify(w.create()),untouched);
  s=await submit(s);const sub=w.currentSubmission(s);assert.match(sub.digest,/^[a-f0-9]{64}$/);assert.equal(sub.body.expectedActiveRevision,'NONE');assert.equal(sub.body.plan.envelope,100000000);assert.deepEqual(sub.body.authors,['leader','manager']);
  await expectFailure(s,req(s,'approve','leader',{submissionId:sub.id,reason:rationale}),/Independent approver/);
  await expectFailure(s,req(s,'approve','manager',{submissionId:sub.id,reason:rationale}),/cannot perform/);
  await expectFailure(s,req(s,'approve','viewer',{submissionId:sub.id,reason:rationale}),/cannot perform/);
  await expectFailure(s,req(s,'approve','reviewer',{submissionId:sub.id,reason:'short'}),/decision reason/);
  const badScope=req(s,'approve','reviewer',{submissionId:sub.id,reason:rationale});badScope.scope.period='FY28 Q1';await expectFailure(s,badScope,/scope/);
  for(const mutate of [t=>t.submissions[0].body.plan.envelope++,t=>t.submissions[0].body.scope.organization='Other',t=>t.observations['EP-FUND-FOUNDATION'].actual++,t=>t.submissions[0].body.policyRevision='other']){
    const t=JSON.parse(JSON.stringify(s));mutate(t);await expectFailure(t,req(t,'approve','reviewer',{submissionId:sub.id,reason:rationale}),/digest or source/);
  }
  const approval=req(s,'approve','reviewer',{submissionId:sub.id,reason:rationale});const approved=await w.command(s,approval);
  assert.equal(approved.active.revision,s.revision);assert.equal(approved.active.digest,sub.digest);assert.equal(approved.decisions.length,1);assert.equal(s.active,null);
  assert.deepEqual(await w.command(approved,approval),approved);
  await expectFailure(approved,{...approval,reason:'A changed retry body is not the retained request.'},/Retry key reused/);
  await expectFailure(approved,{...approval,actor:'leader'},/Retry key reused/);
  await expectFailure(approved,req(approved,'approve','reviewer',{submissionId:sub.id,reason:rationale}),/No current submitted/);
  let revised=await send(approved,'epic','manager',{mode:'update',epic:{...approved.draft.epics[0],remaining:18000000}});
  const laterState=JSON.stringify(revised);assert.deepEqual(await w.command(revised,approval),approved);assert.equal(JSON.stringify(revised),laterState);
  assert.deepEqual(await w.command(JSON.parse(JSON.stringify(revised)),approval),approved);
  assert.deepEqual(revised.active,approved.active);assert.equal(revised.decisions[0].digest,sub.digest);assert.equal(w.currentSubmission(revised),null);
  await expectFailure(revised,{...req(revised,'submit','leader',{reason:rationale}),expectedRevision:approved.revision},/Stale proposal/);
  revised=await submit(revised);assert.equal(w.currentSubmission(revised).body.expectedActiveRevision,approved.active.revision);
  const newSub=w.currentSubmission(revised);revised=await approve(revised);assert.equal(revised.decisions.length,2);assert.equal(revised.submissions[0].status,'SUPERSEDED');assert.equal(revised.active.digest,newSub.digest);
  let pending=await send(revised,'revise','manager');pending=await submit(pending);
  const pendingId=w.currentSubmission(pending).id;const refreshed=await send(pending,'finance','finance');
  assert.equal(refreshed.submissions.find(x=>x.id===pendingId).status,'SUPERSEDED');assert.deepEqual(refreshed.active,pending.active);assert.equal(w.ledger(refreshed).coverage,4);
  await expectFailure(refreshed,req(refreshed,'approve','reviewer',{submissionId:pendingId,reason:rationale}),/No current submitted/);
  let unmatched=await send(refreshed,'unmatched','finance',{observationId:'OBS-DEMO-ONE'});
  assert.equal(w.ledger(unmatched).forecast,null);assert.equal(w.ledger(unmatched).unmatched,12345);assert(w.ledger(unmatched).objectives.every(o=>o.forecast===null));
  await expectFailure(unmatched,req(unmatched,'unmatched','finance',{observationId:'OBS-DEMO-ONE'}),/Duplicate/);
  const beforeActual=unmatched.observations['EP-FUND-FOUNDATION'].actual;
  const mapped=await send(unmatched,'map','finance',{observationId:'OBS-DEMO-ONE',epicId:'EP-FUND-FOUNDATION'});
  assert.equal(mapped.observations['EP-FUND-FOUNDATION'].actual,beforeActual+12345);assert.equal(w.ledger(mapped).unmatched,0);assert.notEqual(w.ledger(mapped).forecast,null);
  assert.equal(w.ledger(mapped).objectives.reduce((n,o)=>n+o.forecast,0),w.ledger(mapped).forecast);
  await expectFailure(mapped,req(mapped,'unmatched','finance',{observationId:'OBS-DEMO-ONE'}),/Duplicate/);
  await expectFailure(mapped,req(mapped,'map','finance',{observationId:'OBS-DEMO-ONE',epicId:'EP-FUND-FOUNDATION'}),/Select an unmatched/);
  const rejected=await send(await submit(w.create()),'reject','reviewer',{submissionId:'FUND-1-1',reason:rationale});assert.equal(rejected.active,null);assert.equal(rejected.decisions[0].action,'REJECTED');
  const over=w.create();over.draft.envelope=1;await expectFailure(over,req(over,'submit','leader',{reason:rationale}),/exceed the proposed envelope/);
  const excessive=w.create();excessive.draft.epics[0].allocation=90000000;await expectFailure(excessive,req(excessive,'submit','leader',{reason:rationale}),/exceed an Objective/);
  const delegation=w.create();delegation.draft.envelope=250000000;const limit=await submit(delegation);await expectFailure(limit,req(limit,'approve','reviewer',{submissionId:w.currentSubmission(limit).id,reason:rationale}),/delegated limit/);
  const concurrent=JSON.parse(JSON.stringify(s));concurrent.active={revision:999};await expectFailure(concurrent,req(concurrent,'approve','reviewer',{submissionId:sub.id,reason:rationale}),/Effective package changed/);
  let added=w.create();const newEpic={id:'EP-DEMO-NEW',title:'New fictional delivery',allocation:10000,remaining:12345,shares:{O9:10000},capacity:0.25,basis:'Explicit fictional estimate.'};
  added=await send(added,'epic','manager',{mode:'create',epic:newEpic});assert.equal(w.ledger(added).rows.at(-1).forecast,null);
  await expectFailure(added,req(added,'epic','manager',{mode:'create',epic:newEpic}),/new unique Epic/);
  await expectFailure(added,req(added,'epic','manager',{mode:'update',epic:{...newEpic,shares:{O9:5000}}}),/totaling 100%/);
  const evil=w.create();evil.draft.epics[0].basis='<script>alert(1)</script>';assert.doesNotMatch(w.markup(evil,'manager','ledger'),/<script>/);
  assert.match(w.markup(approved,'reviewer','history'),/browser page’s memory/);assert.match(w.markup(approved,'reviewer','review'),/No authenticated identity/);
  console.log('Funding workflow semantics passed: cents, conserved shared costs, scoped role play, exact-version decisions, stale/source bindings, retries, active history and reconciliation.');
})().catch(error=>{console.error(error);process.exitCode=1;});

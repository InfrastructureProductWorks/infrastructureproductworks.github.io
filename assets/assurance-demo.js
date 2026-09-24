'use strict';

const FIXTURE_EVALUATED_AT='2026-08-31T12:10:00Z';
const EXPIRED_EVALUATED_AT='2026-08-31T12:16:00Z';
const EXPECTED_AUTHORITY_DIGEST='sha256:31333df3a6e63e684ca4d75a33e4c0a3a59e547fe6a426e0a435878bbe4ccaa0';
const EXPECTED_DESIRED_DIGEST='sha256:2bf08352d1520b3a14c4686cf59f85ad1e07d6f465252f31de5859b971b44ad2';
const EXPECTED_OBSERVED_DIGEST='sha256:8063fddfd480804345ca24cd5a682f243fb21e4e312e74762fb55dd83e3d80b1';
const EVIDENCE_CUSTODIAN='system:synthetic-independent-runtime-evidence';

const AUTHORITY_TEMPLATE={
  active_constraint_refs:['pdc:gate-5-synthetic-runtime'],
  approvals:[
    {approved_at:'2026-08-31T11:55:00Z',approver_ref:'person:fixture-approver-gate-5-a',role:'synthetic-runtime-owner'},
    {approved_at:'2026-08-31T11:57:00Z',approver_ref:'person:fixture-approver-gate-5-b',role:'synthetic-independent-reviewer'}
  ],
  authority_id:'auth:gate-5-runtime-reconciliation',
  authority_type:'STANDARD',
  cited_authority:['fixture://authority/gate-5-runtime-basis'],
  destinations:['system:synthetic-runtime-evidence-store'],
  operations:['ALTER'],
  protected_data_refs:['dataset:gate-5-synthetic-records'],
  provenance:{
    issued_at:'2026-08-31T11:59:00Z',
    issuer:'system:synthetic-authority-service',
    package_digest:EXPECTED_AUTHORITY_DIGEST,
    revocation_ref:'fixture://revocation/authority-gate-5',
    signature_ref:'fixture://signature/authority-gate-5'
  },
  purpose_description:'Evaluate one bounded synthetic runtime drift correction.',
  purpose_id:'synthetic-runtime-reconciliation',
  recipients:['role:synthetic-independent-runtime-reviewer'],
  requester_ref:'person:synthetic-runtime-operator',
  resources:['storage:gate-5-protected-records'],
  schema_version:'vanguard.authority-package/v1',
  status:'ACTIVE',
  subjects:['role:synthetic-runtime-operator'],
  valid_from:'2026-08-31T12:00:00Z',
  valid_until:'2026-08-31T12:15:00Z'
};

const REQUEST_TEMPLATE={
  approvals:{minimum_distinct_approvers:2},
  authority_package_digest:EXPECTED_AUTHORITY_DIGEST,
  authority_package_ref:'auth:gate-5-runtime-reconciliation',
  blast_radius:{max_resources:1,resource_refs:['storage:gate-5-protected-records']},
  desired_state_digest:EXPECTED_DESIRED_DIGEST,
  expires_at:'2026-08-31T12:20:00Z',
  managed_field:{authoritative_owner:'synthetic-reconciler',field:'public_access',provider_supported:true},
  mode:'APPLY',
  notification:{recipient_refs:['oversight:synthetic-independent-runtime-review'],required:true},
  observed_state_digest:EXPECTED_OBSERVED_DIGEST,
  operation:'ALTER',
  purpose_id:'synthetic-runtime-reconciliation',
  request_id:'runtime-request:gate-5-apply',
  requested_at:'2026-08-31T12:05:00Z',
  requester_ref:'person:synthetic-runtime-operator',
  resource_ref:'storage:gate-5-protected-records',
  risk_tier:'HIGH',
  rollback:{required:true,supported:true,value:true},
  schema_version:'vanguard.runtime-action-request/v1',
  target:{desired_value:false,field:'public_access',observed_value:true}
};

const DESIRED_STATE={public_access:false,resource_ref:'storage:gate-5-protected-records',schema_version:'vanguard.synthetic-runtime-state/v1'};
const OBSERVED_STATE={public_access:true,resource_ref:'storage:gate-5-protected-records',schema_version:'vanguard.synthetic-runtime-state/v1'};

const SCENARIOS={
  baseline:{label:'Valid authority',description:'All Gate 5-style checks pass and one bounded synthetic field is applied.'},
  expired:{label:'Expire authority',description:'Evaluate one minute after the Authority Package validity window.'},
  broadened:{label:'Broaden scope',description:'Request a second resource beyond the one-resource blast-radius contract.'},
  approver:{label:'Remove approver',description:'Issue a digest-valid package with only one approver when two are required.'},
  digest:{label:'Change digest',description:'Present an observed-state digest that does not match the fixed synthetic state.'},
  rollback:{label:'Fail verification',description:'Allow the bounded apply, then simulate post-apply verification failure and rollback.'}
};

let activeScenario='baseline';
let latestEvaluation=null;

const byId=id=>document.getElementById(id);
const clone=value=>JSON.parse(JSON.stringify(value));

function escapeHtml(value){
  return String(value)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

function canonicalJson(value){
  if(value===null||typeof value!=='object') return JSON.stringify(value);
  if(Array.isArray(value)) return '['+value.map(canonicalJson).join(',')+']';
  return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonicalJson(value[key])).join(',')+'}';
}

async function sha256(value){
  if(!window.crypto||!window.crypto.subtle) throw new Error('Web Crypto is unavailable in this browser.');
  const bytes=new TextEncoder().encode(value);
  const digest=await window.crypto.subtle.digest('SHA-256',bytes);
  return 'sha256:'+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}

async function digestObject(value){
  return sha256(canonicalJson(value));
}

async function authorityDigest(authority){
  const candidate=clone(authority);
  delete candidate.provenance.package_digest;
  return digestObject(candidate);
}

function parseUtc(value){
  return new Date(value).getTime();
}

function check(label,ok,reason){
  return {label,status:ok?'PASS':'FAIL',reason};
}

async function buildScenario(name){
  const authority=clone(AUTHORITY_TEMPLATE);
  const request=clone(REQUEST_TEMPLATE);
  let evaluatedAt=FIXTURE_EVALUATED_AT;
  let simulateVerificationFailure=false;

  if(name==='expired') evaluatedAt=EXPIRED_EVALUATED_AT;
  if(name==='broadened'){
    request.blast_radius.max_resources=2;
    request.blast_radius.resource_refs.push('storage:synthetic-second-resource');
  }
  if(name==='approver'){
    authority.approvals.pop();
    authority.provenance.package_digest=await authorityDigest(authority);
    request.authority_package_digest=authority.provenance.package_digest;
  }
  if(name==='digest') request.observed_state_digest='sha256:'+'0'.repeat(64);
  if(name==='rollback') simulateVerificationFailure=true;

  return {authority,request,evaluatedAt,simulateVerificationFailure};
}

async function evaluateScenario(name){
  const {authority,request,evaluatedAt,simulateVerificationFailure}=await buildScenario(name);
  const calculatedAuthorityDigest=await authorityDigest(authority);
  const desiredDigest=await digestObject(DESIRED_STATE);
  const observedDigest=await digestObject(OBSERVED_STATE);

  const packageIntegrity=calculatedAuthorityDigest===authority.provenance.package_digest && request.authority_package_digest===authority.provenance.package_digest;
  const now=parseUtc(evaluatedAt);
  const timeValid=now>=parseUtc(authority.valid_from)&&now<=parseUtc(authority.valid_until)&&now>=parseUtc(request.requested_at)&&now<=parseUtc(request.expires_at);
  const identityPurpose=request.requester_ref===authority.requester_ref&&request.purpose_id===authority.purpose_id&&authority.status==='ACTIVE'&&authority.authority_type==='STANDARD';
  const scopeValid=authority.resources.includes(request.resource_ref)&&authority.operations.includes(request.operation)&&request.blast_radius.max_resources===1&&request.blast_radius.resource_refs.length===1&&request.blast_radius.resource_refs[0]===request.resource_ref;
  const approvers=new Set(authority.approvals.map(item=>item.approver_ref));
  const approvalsValid=approvers.size>=request.approvals.minimum_distinct_approvers&&!approvers.has(authority.requester_ref)&&approvers.size===authority.approvals.length;
  const stateBinding=request.desired_state_digest===desiredDigest&&request.observed_state_digest===observedDigest&&request.resource_ref===DESIRED_STATE.resource_ref&&request.resource_ref===OBSERVED_STATE.resource_ref;
  const fieldBound=request.managed_field.field==='public_access'&&request.target.field==='public_access'&&request.managed_field.provider_supported===true&&request.managed_field.authoritative_owner==='synthetic-reconciler'&&request.target.observed_value===OBSERVED_STATE.public_access&&request.target.desired_value===DESIRED_STATE.public_access;
  const rollbackReady=request.rollback.required===true&&request.rollback.supported===true&&request.rollback.value===OBSERVED_STATE.public_access;
  const notificationReady=request.notification.required===true&&request.notification.recipient_refs.length>0;

  const checks=[
    check('Package integrity',packageIntegrity,packageIntegrity?'Authority digest matches the issued package.':'AUTHORITY_DIGEST_MISMATCH'),
    check('Active time window',timeValid,timeValid?'Authority and request windows include the fixture clock.':'AUTHORITY_EXPIRED'),
    check('Identity & purpose',identityPurpose,identityPurpose?'Requester and purpose remain bound.':'REQUESTER_OR_PURPOSE_MISMATCH'),
    check('Exact scope',scopeValid,scopeValid?'One authorized resource and ALTER operation.':'BLAST_RADIUS_EXCEEDED'),
    check('Distinct approvers',approvalsValid,approvalsValid?'Two distinct approvers; requester is separate.':'APPROVAL_THRESHOLD_NOT_MET'),
    check('Desired / observed digests',stateBinding,stateBinding?'Both synthetic state digests match.':'OBSERVED_STATE_DIGEST_MISMATCH'),
    check('Managed field',fieldBound,fieldBound?'Only public_access is in the bounded field contract.':'FIELD_NOT_MANAGED'),
    check('Rollback & notification',rollbackReady&&notificationReady,(rollbackReady&&notificationReady)?'Rollback is proven and independent notification is required.':'ROLLBACK_OR_NOTIFICATION_NOT_PROVEN')
  ];

  const firstFailure=checks.find(item=>item.status==='FAIL');
  let decision='ALLOW';
  let outcome='APPLIED';
  let reasonCode='RECONCILIATION_APPLIED';
  let actionPerformed=true;
  let reviewRequired=false;

  if(firstFailure){
    decision='DENY';
    outcome=firstFailure.reason==='APPROVAL_THRESHOLD_NOT_MET'?'REVIEW REQUIRED':'NO ACTION';
    reasonCode=firstFailure.reason;
    actionPerformed=false;
    reviewRequired=outcome==='REVIEW REQUIRED';
  }else if(simulateVerificationFailure){
    outcome='ROLLED BACK';
    reasonCode='VERIFICATION_FAILED_ROLLBACK_SUCCEEDED';
  }

  const record={
    schemaVersion:'iaap-assurance-browser-record/v1',
    evaluatedAt,
    authorityPackageRef:authority.authority_id,
    authorityPackageDigest:authority.provenance.package_digest,
    requestRef:request.request_id,
    requesterRef:request.requester_ref,
    resourceRef:request.resource_ref,
    managedField:request.target.field,
    assuranceDecision:decision,
    runtimeOutcome:outcome,
    reasonCode,
    actionPerformed,
    reviewRequired,
    evidenceCustodianRef:EVIDENCE_CUSTODIAN,
    custodyPreviewOnly:true,
    notice:'Synthetic browser demonstration. Independent evidence custody is modeled here but not persisted by this page.'
  };
  record.recordDigest=await digestObject(record);

  return {authority,request,evaluatedAt,checks,decision,outcome,reasonCode,actionPerformed,reviewRequired,record,calculatedAuthorityDigest,desiredDigest,observedDigest};
}

function shortDigest(value){
  if(!value) return '—';
  return value.length>27?value.slice(0,19)+'…'+value.slice(-6):value;
}

function renderScenarioInfo(){
  const meta=SCENARIOS[activeScenario];
  byId('scenario-name').textContent=meta.label;
  byId('scenario-description').textContent=meta.description;
  document.querySelectorAll('[data-scenario]').forEach(button=>{
    const active=button.dataset.scenario===activeScenario;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
}

function renderAuthority(result){
  const a=result.authority;
  byId('authority-id').textContent=a.authority_id;
  byId('requester-ref').textContent=a.requester_ref;
  byId('purpose-id').textContent=a.purpose_id;
  byId('authority-window').textContent=`${a.valid_from} → ${a.valid_until}`;
  byId('fixture-clock').textContent=result.evaluatedAt;
  byId('authority-digest').textContent=shortDigest(a.provenance.package_digest);
  byId('calculated-digest').textContent=shortDigest(result.calculatedAuthorityDigest);
  byId('approver-list').innerHTML=a.approvals.map((approval,index)=>`<div class="ad-approver"><span>${index+1}</span><div><b>${escapeHtml(approval.role)}</b><code>${escapeHtml(approval.approver_ref)}</code></div></div>`).join('');
}

function renderRequest(result){
  const r=result.request;
  byId('request-resource').textContent=r.resource_ref;
  byId('request-operation').textContent=`${r.operation} · ${r.target.field}`;
  byId('request-change').textContent=`${String(r.target.observed_value)} → ${String(r.target.desired_value)}`;
  byId('request-risk').textContent=r.risk_tier;
  byId('blast-radius').textContent=`${r.blast_radius.max_resources} max · ${r.blast_radius.resource_refs.length} requested`;
  byId('desired-digest').textContent=shortDigest(r.desired_state_digest);
  byId('observed-digest').textContent=shortDigest(r.observed_state_digest);
}

function renderChecks(result){
  byId('gate-checks').innerHTML=result.checks.map(item=>`
    <div class="ad-check ${item.status==='PASS'?'pass':'fail'}">
      <span class="ad-check-mark">${item.status==='PASS'?'✓':'×'}</span>
      <div><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.reason)}</small></div>
      <strong>${item.status}</strong>
    </div>`).join('');
}

function renderOutcome(result){
  const decision=byId('decision-badge');
  decision.textContent=result.decision;
  decision.className='ad-decision '+(result.decision==='ALLOW'?'allow':'deny');
  const outcome=byId('outcome-badge');
  const outcomeClass=result.outcome==='APPLIED'?'applied':result.outcome==='ROLLED BACK'?'rolled':result.outcome==='REVIEW REQUIRED'?'review':'stopped';
  outcome.textContent=result.outcome;
  outcome.className='ad-outcome '+outcomeClass;
  byId('reason-code').textContent=result.reasonCode;
  byId('outcome-copy').textContent=result.decision==='ALLOW'
    ? (result.outcome==='ROLLED BACK'
        ? 'Authority was valid, the bounded synthetic change was attempted, post-apply verification failed, and the prior observed state was restored.'
        : 'Authority remains valid for this exact request. The bounded synthetic field change can proceed and is shown as applied.')
    : (result.reviewRequired
        ? 'The approval threshold is not satisfied. No technical action occurs; the path remains fail-closed and requires accountable human review.'
        : 'At least one bounded assurance condition failed. No synthetic action is performed.');

  document.querySelectorAll('[data-flow-node]').forEach(node=>node.classList.remove('current','failed','complete'));
  const packageNode=byId('flow-package');
  const gateNode=byId('flow-gate');
  const actionNode=byId('flow-action');
  const evidenceNode=byId('flow-evidence');
  packageNode.classList.add('complete');
  if(result.decision==='DENY'){
    gateNode.classList.add('failed','current');
  }else{
    gateNode.classList.add('complete');
    actionNode.classList.add(result.outcome==='ROLLED BACK'?'failed':'complete','current');
    evidenceNode.classList.add('complete');
  }
  if(result.decision==='DENY') evidenceNode.classList.add('complete');
}

function renderEvidence(result){
  const record=result.record;
  byId('record-digest').textContent=record.recordDigest;
  byId('record-custodian').textContent=record.evidenceCustodianRef;
  byId('record-decision').textContent=`${record.assuranceDecision} · ${record.runtimeOutcome}`;
  byId('record-request').textContent=record.requestRef;
  byId('record-resource').textContent=record.resourceRef;
  byId('record-notice').textContent=record.notice;
}

async function runScenario(){
  byId('run-state').textContent='EVALUATING';
  byId('run-state').className='ad-run-state pending';
  document.querySelectorAll('[data-demo-action]').forEach(button=>button.disabled=true);
  try{
    const result=await evaluateScenario(activeScenario);
    latestEvaluation=result;
    renderAuthority(result);
    renderRequest(result);
    renderChecks(result);
    renderOutcome(result);
    renderEvidence(result);
    byId('run-state').textContent=result.decision==='ALLOW'?'AUTHORITY VALID':'FAIL CLOSED';
    byId('run-state').className='ad-run-state '+(result.decision==='ALLOW'?'allow':'deny');
  }catch(error){
    byId('run-state').textContent='VERIFICATION UNAVAILABLE';
    byId('run-state').className='ad-run-state deny';
    byId('outcome-copy').textContent=error.message;
  }finally{
    document.querySelectorAll('[data-demo-action]').forEach(button=>button.disabled=false);
  }
}

function exportRecord(){
  if(!latestEvaluation) return;
  const blob=new Blob([JSON.stringify(latestEvaluation.record,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;
  link.download='iaap-assurance-synthetic-decision-record.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded',async()=>{
  document.querySelectorAll('[data-scenario]').forEach(button=>{
    button.addEventListener('click',async()=>{
      activeScenario=button.dataset.scenario;
      renderScenarioInfo();
      await runScenario();
    });
  });
  byId('run-gate').addEventListener('click',runScenario);
  byId('export-record').addEventListener('click',exportRecord);
  renderScenarioInfo();
  await runScenario();
});

'use strict';

const EXPECTED_DIGEST='2325359a4f6a7cc23bab39e5cfb7ff905192b98301ed3478392f218af19647eb';

const PACKAGE_TEMPLATE={
  schemaVersion:'iaap-console-demo-package/v2',
  packageId:'SYN-CONSOLE-001',
  assessmentId:'ASSESS-482',
  profile:{ref:'trusted-profile/network-foundation',version:'v3'},
  scope:{
    customerId:'synthetic-customer',
    organizationId:'platform-engineering',
    environmentId:'dev',
    systemId:'managed-interconnect'
  },
  source:{product:'IaaP Guard',revision:'synthetic-guard-rev-482'},
  change:{
    title:'Managed Interconnect · Change 482',
    summary:'Add GCP support while preserving the AWS and Azure consumer contract'
  },
  guardSummary:{passed:18,review:2},
  forge:{
    productName:'Managed Interconnect',
    version:'v1.3',
    outcome:'Private, encrypted, highly available interconnect',
    consumerChoices:['provider pair','environments','classification'],
    platformOwned:['routing','gateways','encryption implementation','Crossplane composition']
  },
  requirements:[
    {id:'NET-001',category:'NETWORK',title:'CIDRs do not overlap across selected environments',status:'PASS'},
    {id:'SEC-014',category:'SECURITY',title:'Encryption and workload identity remain mandatory',status:'PASS'},
    {id:'DNS-007',category:'DNS',title:'Enterprise DNS ownership needs reviewer confirmation',status:'REVIEW'},
    {id:'FIN-004',category:'FINOPS',title:'Planning range requires cost-owner acknowledgment',status:'REVIEW'}
  ],
  evidence:[
    {id:'EVD-101',requirementId:'NET-001',artifact:'network-plan.synthetic.json',sourceRevision:'synthetic-guard-rev-482'},
    {id:'EVD-102',requirementId:'SEC-014',artifact:'security-envelope.synthetic.json',sourceRevision:'synthetic-guard-rev-482'},
    {id:'EVD-103',requirementId:'DNS-007',artifact:'dns-ownership.synthetic.json',sourceRevision:'synthetic-guard-rev-482'},
    {id:'EVD-104',requirementId:'FIN-004',artifact:'cost-plan.synthetic.json',sourceRevision:'synthetic-guard-rev-482'}
  ],
  planning:{
    okr:'Expand governed multi-cloud products',
    epic:'Managed Interconnect provider expansion',
    feature:'Add bounded GCP implementation'
  },
  decisionState:'AWAITING_HUMAN_REVIEW',
  authority:{approve:false,provision:false,deploy:false,reconcile:false}
};

const ORDERS=[
  {id:'ORDER-482',requester:'developer:maya',label:'Managed Interconnect · Change 482',template:PACKAGE_TEMPLATE,expectedDigest:EXPECTED_DIGEST},
  {id:'ORDER-483',requester:'developer:eli',label:'Application Network · Order 483',template:{...PACKAGE_TEMPLATE,packageId:'SYN-CONSOLE-002',assessmentId:'ASSESS-483',change:{title:'Application Network · Order 483',summary:'Standard development network request with complete checks'},guardSummary:{passed:20,review:0},requirements:PACKAGE_TEMPLATE.requirements.map(item=>({...item,status:'PASS'})),decisionState:'VALIDATED_AWAITING_AUTHORIZED_HANDOFF'},expectedDigest:'1437f2242f137f6833401d8821ce13775bc8d9b3e7a431951aa7e6b137c1c3bf'},
  {id:'ORDER-484',requester:'developer:jo',label:'Managed Interconnect · Change 484',template:{...PACKAGE_TEMPLATE,packageId:'SYN-CONSOLE-003',assessmentId:'ASSESS-484',change:{title:'Managed Interconnect · Change 484',summary:'Separate developer request requiring DNS ownership review'},source:{product:'IaaP Guard',revision:'synthetic-guard-rev-484'},evidence:PACKAGE_TEMPLATE.evidence.map(item=>({...item,sourceRevision:'synthetic-guard-rev-484'}))},expectedDigest:'f5caed9791cabd392df53a268a46e5235745c2cbdb3cdfb9261c1cf25ca819df'}
];
const orderStates=new Map(ORDERS.map(order=>[order.id,{activePackage:JSON.parse(JSON.stringify(order.template)),lastVerification:null,recordedReviewNote:'',draftNote:order.id==='ORDER-482'?'Confirm DNS ownership and the planning estimate with accountable domain owners.':''}]));
let activeOrder=ORDERS[0];
let activePackage=orderStates.get(activeOrder.id).activePackage;
let lastVerification=null;
let recordedReviewNote='';

const byId=id=>document.getElementById(id);
const clonePackage=()=>JSON.parse(JSON.stringify(activeOrder.template));
const state=()=>orderStates.get(activeOrder.id);
function renderOrderQueue(){
  byId('order-queue').innerHTML=ORDERS.map(order=>{
    const entry=orderStates.get(order.id),verification=entry.lastVerification;
    const status=verification?(verification.verified?(order.template.guardSummary.review?'Human review':'Validated · authorized handoff pending'):'Evidence rejected'):'Verification pending';
    return `<button type="button" data-order-id="${order.id}" aria-current="${order.id===activeOrder.id?'true':'false'}"><strong>${escapeHtml(order.id)}</strong> ${escapeHtml(order.label)}<small>${escapeHtml(order.requester)} · ${escapeHtml(status)}</small></button>`;
  }).join('');
  byId('queue-count').textContent=`${ORDERS.length} independent synthetic orders · ${ORDERS.filter(order=>orderStates.get(order.id).lastVerification?.verified&&order.template.guardSummary.review).length} require human review`;
}

function escapeHtml(value){
  return String(value)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

async function sha256Hex(value){
  if(!window.crypto||!window.crypto.subtle){
    throw new Error('Web Crypto is unavailable in this browser.');
  }
  const bytes=new TextEncoder().encode(value);
  const digest=await window.crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
}

function setBusy(isBusy){
  document.querySelectorAll('[data-demo-action],[data-order-id]').forEach(button=>{button.disabled=isBusy;});
}

function requirementPill(status){
  const cls=status==='PASS'?'pass':'review';
  return '<span class="cw-pill '+cls+'">'+escapeHtml(status)+'</span>';
}

function renderFindings(){
  const html=activePackage.requirements.map(item=>`
    <div class="cw-finding" data-requirement="${escapeHtml(item.id)}">
      <b>${escapeHtml(item.category)}</b>
      <span>${escapeHtml(item.title)}</span>
      ${requirementPill(item.status)}
    </div>`).join('');
  byId('overview-findings').innerHTML=html;
  byId('findings-detail').innerHTML=html;
}

function renderEvidence(){
  byId('evidence-detail').innerHTML=activePackage.evidence.map(item=>`
    <div class="evidence-item" data-evidence="${escapeHtml(item.id)}">
      <div><b>${escapeHtml(item.id)}</b><span>${escapeHtml(item.artifact)}</span></div>
      <div><small>REQUIREMENT</small><code>${escapeHtml(item.requirementId)}</code></div>
      <div><small>SOURCE REVISION</small><code>${escapeHtml(item.sourceRevision)}</code></div>
    </div>`).join('');
}

function renderStaticPackage(){
  byId('change-title').textContent=activePackage.change.title;
  byId('change-summary').textContent=activePackage.change.summary;
  byId('guard-summary').textContent=`${activePackage.guardSummary.passed} passed · ${activePackage.guardSummary.review} review`;
  byId('forge-product').textContent=`${activePackage.forge.productName} ${activePackage.forge.version}`;
  byId('forge-outcome').textContent=activePackage.forge.outcome.toLowerCase();
  byId('forge-choices').textContent=activePackage.forge.consumerChoices.join(', ');
  byId('forge-owned').textContent=activePackage.forge.platformOwned.join(', ');
  byId('plan-okr').textContent=activePackage.planning.okr;
  byId('plan-epic').textContent=activePackage.planning.epic;
  byId('plan-feature').textContent=activePackage.planning.feature;
  byId('package-id').textContent=activePackage.packageId;
  byId('assessment-id').textContent=activePackage.assessmentId;
  byId('profile-id').textContent=`${activePackage.profile.ref} @ ${activePackage.profile.version}`;
  byId('scope-id').textContent=`${activePackage.scope.organizationId} / ${activePackage.scope.environmentId} / ${activePackage.scope.systemId}`;
  byId('source-revision').textContent=activePackage.source.revision;
  byId('expected-digest').textContent=activeOrder.expectedDigest;
  byId('order-context').textContent=`${activeOrder.id} · ${activeOrder.requester}`;
  renderFindings();
  renderEvidence();
}

function renderPending(){
  lastVerification=null;

  const trust=byId('trust-state');
  trust.textContent='… VERIFYING SOURCE & DIGEST';
  trust.className='cw-trust pending';

  const headerState=byId('header-state');
  headerState.textContent='VERIFICATION PENDING';
  headerState.className='cw-state pending';

  const binding=byId('evidence-binding');
  binding.textContent='Pending';
  binding.className='';

  const decision=byId('decision-summary');
  decision.textContent='Unavailable until verified';
  decision.className='';

  byId('actual-digest').textContent='pending';
  byId('trace-digest').textContent='pending';
  byId('decision-state').textContent='VERIFICATION_REQUIRED';
  byId('decision-state').className='decision-state failed';

  const alert=byId('integrity-alert');
  alert.innerHTML='<b>Verification pending.</b> Console will not present this package as verified until the browser digest matches the pinned value.';
  alert.className='integrity-alert pending';

  byId('decision-copy').textContent='Console will not expose a review state until the synthetic package passes digest verification.';
  document.querySelectorAll('[data-evidence],[data-requirement]').forEach(el=>el.classList.remove('tampered'));
}

function renderVerification(result){
  lastVerification=result;
  state().lastVerification=result;
  const verified=result.verified;
  const decisionState=verified?activePackage.decisionState:'UNAVAILABLE_FAIL_CLOSED';

  const trust=byId('trust-state');
  trust.textContent=verified?'✓ SOURCE & DIGEST VERIFIED':'✕ DIGEST MISMATCH · FAIL CLOSED';
  trust.className='cw-trust '+(verified?'verified':'rejected');

  const headerState=byId('header-state');
  headerState.textContent=verified?(activePackage.guardSummary.review?'AWAITING HUMAN REVIEW':'VALIDATED · HANDOFF PENDING'):'EVIDENCE REJECTED';
  headerState.className='cw-state '+(verified?'review':'failed');

  const binding=byId('evidence-binding');
  binding.textContent=verified?'Verified':'Rejected';
  binding.className=verified?'pass':'failed';

  const decision=byId('decision-summary');
  decision.textContent=verified?(activePackage.guardSummary.review?'Human review':'Authorized handoff pending'):'Unavailable';
  decision.className=verified?'reviewing':'failed';

  byId('actual-digest').textContent=result.actualDigest;
  byId('trace-digest').textContent=result.actualDigest.slice(0,16)+'…';
  byId('decision-state').textContent=decisionState;
  byId('decision-state').className='decision-state '+(verified?'review':'failed');

  const alert=byId('integrity-alert');
  alert.innerHTML=verified
    ? '<b>Integrity verified.</b> Synthetic evidence matches the pinned package digest and is eligible for review.'
    : '<b>Fail closed.</b> The package digest changed. Console will not present the altered evidence as verified.';
  alert.className='integrity-alert '+(verified?'verified':'rejected');

  byId('decision-copy').textContent=verified
    ? (activePackage.guardSummary.review?'The evidence is verified and reviewable. This order stops at human review; Console has no approval or execution authority.':'All synthetic checks passed. This order can move to the next authorized boundary independently; Console cannot create a decision or execute it.')
    : 'The altered package is not eligible for verified review. Restore the synthetic package before continuing.';

  const tampered=activePackage.evidence.find(item=>item.artifact.includes('tampered'));
  document.querySelectorAll('[data-evidence],[data-requirement]').forEach(el=>el.classList.remove('tampered'));
  if(!verified&&tampered){
    document.querySelectorAll(`[data-evidence="${tampered.id}"],[data-requirement="${tampered.requirementId}"]`).forEach(el=>el.classList.add('tampered'));
  }
}

async function verifyPackage(){
  renderPending();
  setBusy(true);
  try{
    const actualDigest=await sha256Hex(JSON.stringify(activePackage));
    renderVerification({verified:actualDigest===activeOrder.expectedDigest,actualDigest});
  }catch(error){
    renderVerification({verified:false,actualDigest:'verification-unavailable'});
    byId('integrity-alert').innerHTML='<b>Verification unavailable.</b> '+escapeHtml(error.message);
  }finally{
    renderOrderQueue();
    setBusy(false);
  }
}

async function restorePackage(){
  renderPending();
  clearRecordedReviewNote();
  activePackage=clonePackage();
  state().activePackage=activePackage;
  renderStaticPackage();
  await verifyPackage();
}

async function tamperEvidence(){
  if(!activePackage) await restorePackage();
  renderPending();
  clearRecordedReviewNote();
  setBusy(true);
  activePackage.evidence[2].artifact='dns-ownership.tampered.json';
  renderEvidence();
  activateView('evidence');
  await verifyPackage();
}

function exportReview(){
  if(!activePackage||!lastVerification) return;
  const summary={
    demo:'IaaP Console synthetic review',
    orderId:activeOrder.id,
    requesterRef:activeOrder.requester,
    packageId:activePackage.packageId,
    assessmentId:activePackage.assessmentId,
    verification:lastVerification.verified?'VERIFIED':'REJECTED',
    expectedDigest:activeOrder.expectedDigest,
    actualDigest:lastVerification.actualDigest,
    decisionState:lastVerification.verified?activePackage.decisionState:'UNAVAILABLE_FAIL_CLOSED',
    reviewerNote:recordedReviewNote,
    authority:activePackage.authority,
    notice:'Synthetic demonstration only. No approval, provisioning, deployment, or reconciliation authority.'
  };
  const blob=new Blob([JSON.stringify(summary,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;
  link.download=`iaap-console-${activeOrder.id.toLowerCase()}-synthetic-review.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function clearRecordedReviewNote(){
  const hadRecordedNote=Boolean(recordedReviewNote);
  recordedReviewNote='';
  state().recordedReviewNote='';
  byId('note-status').textContent=hadRecordedNote
    ? 'Package state changed. The previously recorded review note was invalidated.'
    : 'No review note recorded. Add a synthetic note if review context is needed.';
}

function recordReviewNote(){
  const value=byId('review-note').value.trim();
  const message=byId('note-status');
  if(!value){
    recordedReviewNote='';
    message.textContent='Add a synthetic review note first.';
    return;
  }
  recordedReviewNote=value;
  state().recordedReviewNote=value;
  message.textContent='Review note recorded locally for this browser session. No decision or approval was recorded.';
}

function activateView(name){
  document.querySelectorAll('[data-view-target]').forEach(button=>{
    const active=button.dataset.viewTarget===name;
    button.classList.toggle('active',active);
    button.setAttribute('aria-selected',String(active));
  });
  document.querySelectorAll('[data-view]').forEach(panel=>{
    panel.hidden=panel.dataset.view!==name;
  });
}

document.addEventListener('DOMContentLoaded',async()=>{
  byId('order-queue').addEventListener('click',async event=>{
    const button=event.target.closest('[data-order-id]');
    const next=ORDERS.find(order=>order.id===button?.dataset.orderId);
    if(!next||next===activeOrder)return;
    state().draftNote=byId('review-note').value;
    activeOrder=next;
    activePackage=state().activePackage;
    recordedReviewNote=state().recordedReviewNote;
    byId('review-note').value=state().draftNote;
    byId('note-status').textContent=recordedReviewNote?'Review note recorded locally for this order. No decision or approval was recorded.':'No review note recorded for this order.';
    renderStaticPackage();
    renderOrderQueue();
    await verifyPackage();
  });
  document.querySelectorAll('[data-view-target]').forEach(button=>{
    button.addEventListener('click',()=>activateView(button.dataset.viewTarget));
  });
  byId('tamper-demo').addEventListener('click',tamperEvidence);
  byId('restore-demo').addEventListener('click',restorePackage);
  byId('export-demo').addEventListener('click',exportReview);
  byId('record-note').addEventListener('click',recordReviewNote);
  byId('review-note').addEventListener('input',()=>{
    const draft=byId('review-note').value.trim();
    const status=byId('note-status');
    if(recordedReviewNote&&draft!==recordedReviewNote){
      status.textContent='Draft changed since the recorded note. Record Review Note again to include the new text in export.';
    }else if(recordedReviewNote&&draft===recordedReviewNote){
      status.textContent='Review note recorded locally for this browser session. No decision or approval was recorded.';
    }else{
      status.textContent='Synthetic note only. Nothing is persisted.';
    }
  });
  await restorePackage();
});

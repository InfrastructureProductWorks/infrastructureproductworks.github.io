'use strict';

const EXPECTED_DIGEST='dcc8d60a0d3bb830a90248e927b82e438f50c4bf6dde83686dc7c1d1b493d8fc';

const PACKAGE_TEMPLATE={
  schemaVersion:'iaap-console-demo-package/v1',
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
  requirements:[
    {id:'NET-001',title:'CIDR ranges do not overlap',status:'PASS'},
    {id:'SEC-014',title:'Encryption remains mandatory',status:'PASS'},
    {id:'DNS-007',title:'Enterprise DNS ownership confirmed',status:'REVIEW'},
    {id:'FIN-004',title:'Cost owner acknowledges planning range',status:'REVIEW'}
  ],
  evidence:[
    {id:'EVD-101',requirementId:'NET-001',artifact:'network-plan.synthetic.json',sourceRevision:'synthetic-guard-rev-482'},
    {id:'EVD-102',requirementId:'SEC-014',artifact:'security-envelope.synthetic.json',sourceRevision:'synthetic-guard-rev-482'},
    {id:'EVD-103',requirementId:'DNS-007',artifact:'dns-ownership.synthetic.json',sourceRevision:'synthetic-guard-rev-482'},
    {id:'EVD-104',requirementId:'FIN-004',artifact:'cost-plan.synthetic.json',sourceRevision:'synthetic-guard-rev-482'}
  ],
  decisionState:'AWAITING_HUMAN_REVIEW',
  authority:{approve:false,provision:false,deploy:false,reconcile:false}
};

let activePackage=null;
let lastVerification=null;

const byId=id=>document.getElementById(id);
const clonePackage=()=>JSON.parse(JSON.stringify(PACKAGE_TEMPLATE));

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
  for(const id of ['load-demo','tamper-demo','restore-demo','export-demo']){
    const button=byId(id);
    if(button) button.disabled=isBusy;
  }
}

function pill(status){
  const normalized=status==='PASS'?'pass':'review';
  return `<span class="demo-pill ${normalized}">${escapeHtml(status)}</span>`;
}

function renderRequirements(){
  const target=byId('requirements-list');
  target.innerHTML=activePackage.requirements.map(item=>`
    <article class="demo-row">
      <div><strong>${escapeHtml(item.id)}</strong><span>${escapeHtml(item.title)}</span></div>
      ${pill(item.status)}
    </article>`).join('');
}

function renderEvidence(){
  const target=byId('evidence-list');
  target.innerHTML=activePackage.evidence.map(item=>`
    <article class="demo-row evidence-row">
      <div><strong>${escapeHtml(item.id)}</strong><span>${escapeHtml(item.artifact)}</span></div>
      <code>${escapeHtml(item.requirementId)}</code>
    </article>`).join('');
}

function renderFindings(){
  const target=byId('findings-list');
  target.innerHTML=activePackage.requirements.map(item=>`
    <article class="demo-finding">
      <strong>${escapeHtml(item.id)}</strong>
      <span>${escapeHtml(item.title)}</span>
      ${pill(item.status)}
    </article>`).join('');
}

function renderPackageFields(){
  byId('package-id').textContent=activePackage.packageId;
  byId('assessment-id').textContent=activePackage.assessmentId;
  byId('profile-id').textContent=`${activePackage.profile.ref} @ ${activePackage.profile.version}`;
  byId('scope-id').textContent=`${activePackage.scope.organizationId} / ${activePackage.scope.environmentId} / ${activePackage.scope.systemId}`;
  byId('source-id').textContent=`${activePackage.source.product} · ${activePackage.source.revision}`;
  byId('expected-digest').textContent=EXPECTED_DIGEST;
  renderRequirements();
  renderEvidence();
  renderFindings();
}

function renderVerification(result){
  lastVerification=result;
  const verified=result.verified;
  const state=verified?activePackage.decisionState:'UNAVAILABLE_FAIL_CLOSED';
  const trust=byId('trust-state');
  const decision=byId('decision-state');
  const actual=byId('actual-digest');
  const banner=byId('verification-banner');
  const traceDigest=byId('trace-digest');

  trust.textContent=verified?'VERIFIED':'REJECTED';
  trust.className=`demo-status ${verified?'verified':'rejected'}`;
  decision.textContent=state;
  decision.className=`decision-state ${verified?'review':'failed'}`;
  actual.textContent=result.actualDigest;
  traceDigest.textContent=result.actualDigest.slice(0,16)+'…';

  banner.innerHTML=verified
    ? '<strong>Integrity verified.</strong><span>The synthetic payload matches the pinned SHA-256 digest. Console may present it for review, but cannot approve or execute it.</span>'
    : '<strong>Fail closed.</strong><span>The synthetic payload no longer matches the pinned digest. Console refuses to present the altered package as verified evidence.</span>';
  banner.className=`verification-banner ${verified?'verified':'rejected'}`;

  byId('decision-copy').textContent=verified
    ? 'Evidence is verified and reviewable. The demo stops here: an authorized human decision remains outside Console.'
    : 'The altered package is not eligible for review as verified evidence. Restore the synthetic package and verify it again.';
}

async function verifyPackage(){
  setBusy(true);
  try{
    const actualDigest=await sha256Hex(JSON.stringify(activePackage));
    renderVerification({verified:actualDigest===EXPECTED_DIGEST,actualDigest});
  }catch(error){
    renderVerification({verified:false,actualDigest:'verification-unavailable'});
    byId('verification-banner').innerHTML=`<strong>Verification unavailable.</strong><span>${escapeHtml(error.message)}</span>`;
  }finally{
    setBusy(false);
  }
}

async function loadDemo(){
  activePackage=clonePackage();
  renderPackageFields();
  byId('demo-workbench').hidden=false;
  byId('empty-state').hidden=true;
  await verifyPackage();
}

async function tamperDemo(){
  if(!activePackage) await loadDemo();
  activePackage.evidence[2].artifact='dns-ownership.tampered.json';
  renderEvidence();
  await verifyPackage();
}

async function restoreDemo(){
  activePackage=clonePackage();
  renderPackageFields();
  await verifyPackage();
}

function exportDemo(){
  if(!activePackage||!lastVerification) return;
  const summary={
    demo:'IaaP Console synthetic review',
    packageId:activePackage.packageId,
    assessmentId:activePackage.assessmentId,
    verification:lastVerification.verified?'VERIFIED':'REJECTED',
    expectedDigest:EXPECTED_DIGEST,
    actualDigest:lastVerification.actualDigest,
    decisionState:lastVerification.verified?activePackage.decisionState:'UNAVAILABLE_FAIL_CLOSED',
    authority:activePackage.authority,
    notice:'Synthetic demonstration only. No approval, provisioning, deployment, or reconciliation authority.'
  };
  const blob=new Blob([JSON.stringify(summary,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;
  link.download='iaap-console-synthetic-review.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function activateTab(button){
  const name=button.dataset.tab;
  document.querySelectorAll('.demo-tab').forEach(tab=>{
    const active=tab===button;
    tab.classList.toggle('active',active);
    tab.setAttribute('aria-selected',String(active));
  });
  document.querySelectorAll('.demo-panel').forEach(panel=>{
    panel.hidden=panel.dataset.panel!==name;
  });
}

document.addEventListener('DOMContentLoaded',()=>{
  byId('load-demo').addEventListener('click',loadDemo);
  byId('tamper-demo').addEventListener('click',tamperDemo);
  byId('restore-demo').addEventListener('click',restoreDemo);
  byId('export-demo').addEventListener('click',exportDemo);
  document.querySelectorAll('.demo-tab').forEach(tab=>tab.addEventListener('click',()=>activateTab(tab)));
});

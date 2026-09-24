'use strict';

const PORTAL_MODEL={
  schemaVersion:'iaap-assurance-portal-fixture/v1',
  posture:{
    overall:'HEALTHY',
    sentry:'PROFILE PREVIEW',
    shield:'BOUNDED PROOF',
    custody:'BOUNDED PROOF',
    openReviewItems:0,
    evidenceContinuity:'VERIFIED'
  },
  services:[
    {
      id:'svc-runtime-reconciliation',
      name:'Runtime Reconciliation Proof',
      assuranceState:'HEALTHY',
      predeployment:'ALLOW',
      runtimeAuthority:'ACTIVE',
      runtimeState:'APPLIED',
      custody:'SEPARATE PROOF',
      evidence:'COMPLETE',
      serviceHealth:'NOMINAL',
      costVisibility:'NOT MODELED',
      authority:{
        packageRef:'auth:gate-5-runtime-reconciliation',
        purpose:'synthetic-runtime-reconciliation',
        scope:'1 synthetic resource',
        approvers:2,
        validUntil:'2026-08-31T12:15:00Z',
        delegation:'NOT MODELED'
      },
      timeline:[
        'Authority Package issued',
        'Runtime gate allowed',
        'Synthetic action applied',
        'Post-apply verification passed',
        'Evidence record produced'
      ]
    },
    {
      id:'svc-protected-storage',
      name:'Protected Storage Predeployment Proof',
      assuranceState:'HEALTHY',
      predeployment:'DENY → CORRECTED',
      runtimeAuthority:'NOT REQUESTED',
      runtimeState:'NO ACTION',
      custody:'SEPARATE PROOF',
      evidence:'COMPLETE',
      serviceHealth:'NOMINAL',
      costVisibility:'NOT MODELED',
      authority:{
        packageRef:'not-requested',
        purpose:'synthetic-assurance-evaluation',
        scope:'predeployment only',
        approvers:0,
        validUntil:'n/a',
        delegation:'NOT APPLICABLE'
      },
      timeline:[
        'Candidate evaluated',
        'Release denied',
        'One-field correction proposed',
        'Synthetic rescan resolved finding',
        'Reevaluation allowed',
        'Evidence linked'
      ]
    }
  ],
  reviews:[
    {id:'RVW-001',type:'Authority',status:'CLOSED',summary:'Gate 5 authority package remained inside one-resource scope.'},
    {id:'RVW-002',type:'Custody',status:'CLOSED',summary:'Gate 6 delegation attenuation and independent custody were verified.'}
  ],
  evidence:[
    {id:'EVD-G3',label:'Predeployment proof',status:'VERIFIED',detail:'Bounded synthetic denial, one-field correction, rescan and reevaluation.'},
    {id:'EVD-G5',label:'Runtime authority proof',status:'VERIFIED',detail:'Plan, apply, rollback, expiry and unmanaged-field denial evidence.'},
    {id:'EVD-G6',label:'Protected-data custody proof',status:'VERIFIED',detail:'Access, transfer, attenuation denial, audit-suppression denial and provenance.'}
  ]
};

let activeServiceId=PORTAL_MODEL.services[0].id;

const byId=id=>document.getElementById(id);

function escapeHtml(value){
  return String(value)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

function activeService(){
  return PORTAL_MODEL.services.find(item=>item.id===activeServiceId)||PORTAL_MODEL.services[0];
}

function renderServiceList(){
  byId('portal-service-list').innerHTML=PORTAL_MODEL.services.map(service=>`
    <button type="button" data-portal-service="${escapeHtml(service.id)}" aria-pressed="${service.id===activeServiceId}">
      <span><b>${escapeHtml(service.name)}</b><small>${escapeHtml(service.serviceHealth)}</small></span>
      <strong>${escapeHtml(service.assuranceState)}</strong>
    </button>`).join('');
}

function renderPosture(){
  const p=PORTAL_MODEL.posture;
  byId('portal-overall').textContent=p.overall;
  byId('portal-sentry').textContent=p.sentry;
  byId('portal-shield').textContent=p.shield;
  byId('portal-custody').textContent=p.custody;
  byId('portal-review-count').textContent=String(p.openReviewItems);
  byId('portal-evidence-continuity').textContent=p.evidenceContinuity;
}

function renderService(){
  const service=activeService();
  byId('portal-service-name').textContent=service.name;
  byId('portal-service-posture').textContent=service.assuranceState;
  byId('portal-predeployment').textContent=service.predeployment;
  byId('portal-runtime-authority').textContent=service.runtimeAuthority;
  byId('portal-runtime-state').textContent=service.runtimeState;
  byId('portal-custody-state').textContent=service.custody;
  byId('portal-evidence-state').textContent=service.evidence;
  byId('portal-service-health').textContent=service.serviceHealth;
  byId('portal-cost').textContent=service.costVisibility;

  const authority=service.authority;
  byId('portal-authority-package').textContent=authority.packageRef;
  byId('portal-authority-purpose').textContent=authority.purpose;
  byId('portal-authority-scope').textContent=authority.scope;
  byId('portal-authority-approvers').textContent=String(authority.approvers);
  byId('portal-authority-validity').textContent=authority.validUntil;
  byId('portal-authority-delegation').textContent=authority.delegation;

  byId('portal-timeline').innerHTML=service.timeline.map((item,index)=>`
    <li><span>${String(index+1).padStart(2,'0')}</span><b>${escapeHtml(item)}</b></li>`).join('');

  renderServiceList();
  bindServiceButtons();
}

function renderReviews(){
  byId('portal-review-list').innerHTML=PORTAL_MODEL.reviews.map(item=>`
    <div class="portal-review-row">
      <div><b>${escapeHtml(item.id)} · ${escapeHtml(item.type)}</b><small>${escapeHtml(item.summary)}</small></div>
      <strong>${escapeHtml(item.status)}</strong>
    </div>`).join('');
}

function renderEvidence(){
  byId('portal-evidence-list').innerHTML=PORTAL_MODEL.evidence.map(item=>`
    <article><small>${escapeHtml(item.id)}</small><h4>${escapeHtml(item.label)}</h4><p>${escapeHtml(item.detail)}</p><b>${escapeHtml(item.status)}</b></article>`).join('');
}

function bindServiceButtons(){
  document.querySelectorAll('[data-portal-service]').forEach(button=>{
    button.addEventListener('click',()=>{
      activeServiceId=button.dataset.portalService;
      renderService();
    },{once:true});
  });
}

document.addEventListener('DOMContentLoaded',()=>{
  renderPosture();
  renderService();
  renderReviews();
  renderEvidence();
});

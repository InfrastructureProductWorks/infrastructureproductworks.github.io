(() => {
  'use strict';

  const scenarioData = {
    decision: {
      label: 'Decision review',
      decision: 'APPROVE CONDITIONALLY',
      authorization: 'CURRENT',
      delivery: 'READY',
      benefitMeasurement: 'UNKNOWN',
      benefitOutcome: 'UNKNOWN',
      benefitSource: 'No authoritative benefit measurement',
      attention: [
        'Reuse candidate found, but equivalence is not yet proven.',
        'Internal capability evidence exists; availability remains unknown.',
        'Human review is required before downstream acceptance.'
      ]
    },
    delivered: {
      label: 'Delivery complete',
      decision: 'APPROVED',
      authorization: 'CURRENT',
      delivery: 'COMPLETE',
      benefitMeasurement: 'UNKNOWN',
      benefitOutcome: 'UNKNOWN',
      benefitSource: 'No authoritative benefit measurement',
      attention: [
        'Delivery evidence is complete.',
        'The reusable product is available to the synthetic consumer group.',
        'Downstream benefit remains unmeasured even though authorization and delivery are complete.'
      ]
    },
    measured: {
      label: 'Benefit measured',
      decision: 'APPROVED',
      authorization: 'CURRENT',
      delivery: 'COMPLETE',
      benefitMeasurement: 'AUTHORITATIVE',
      benefitOutcome: 'ON TRACK',
      benefitSource: 'Synthetic benefit measurement',
      attention: [
        'Delivery evidence is complete.',
        'Adoption and cycle-time evidence has been observed.',
        'Benefit feedback can now inform investment learning; it does not alter KR9.4 authorization evidence.'
      ]
    }
  };

  const model = {
    division: 'Platform & Cloud Services',
    period: 'FY27 · Q1',
    objectiveId: 'O9',
    objective: 'Align cloud-product investment and execution to evidence-backed cloud platform outcomes.',
    krId: 'KR9.4',
    keyResult: 'Every authorized reusable cloud-product outcome emits an exact Capability Authorization Record before delivery begins.',
    proposedOutcome: 'Create a reusable managed-network foundation product.',
    consumers: 'Application delivery teams',
    leader: 'Division Leader',
    manager: 'Portfolio Manager',
    productOwner: 'Product Leader',
    epic: 'EP-23',
    epicTitle: 'Northstar Signal — Cloud Product Strategy and Decision Intelligence',
    team: 'Platform Product Team',
    backlog: 'Configured delivery system',
    decisionId: 'CPD-0001',
    carId: 'CAR-0001',
    decisionReview: 'Dec 31, 2026',
    carReview: 'Dec 31, 2026',
    alternatives: [
      ['Reuse', 'Use an accepted product if equivalence can be demonstrated.', 'Fastest path when the capability already exists.'],
      ['Build', 'Create a bounded reusable product.', 'Requires productization evidence before consumer availability.'],
      ['Phase', 'Authorize a smaller bounded increment first.', 'Reduces initial scope while preserving the intended outcome and evidence requirements.'],
      ['Defer', 'Do not productize the capability now.', 'Leaves the capability gap unresolved until stronger evidence or priority emerges.'],
      ['Redirect', 'Send the need to a different existing product or operating path.', 'Avoids creating duplicate platform capability when another accountable path is a better fit.']
    ],
    decisionContext: {
      profile: 'ORG-PROFILE-PCS-v3 · synthetic approved scope',
      profileRule: 'Profile changes require renewed review; prior approval never silently carries forward.',
      capability: 'Managed-network candidate found · equivalence not yet proven',
      portfolio: 'Existing product catalog + dependency context checked before new productization',
      investment: 'Reuse is preferred when equivalent; net-new productization adds lifecycle/TCO and duplication risk.',
      benefit: 'Expected value is cycle-time reduction and governed reuse; delivery completion alone cannot prove the benefit.',
      evidence: 'Current synthetic decision evidence · attributable source · confidence and freshness remain visible'
    },
    evidence: [
      ['Authorization', 'Northstar decision/CAR binding', 'DEMONSTRATED', 'HIGH', 'CURRENT', 'CPD-0001 and CAR-0001 preserve the bounded authorization evidence required by KR9.4.'],
      ['Product', 'Reviewed repository evidence', 'DEMONSTRATED', 'HIGH', 'CURRENT', 'A reusable managed-network contract candidate exists.'],
      ['Person', 'Profile skills', 'SELF-DECLARED', 'MEDIUM', 'CURRENT', 'Platform networking and cloud architecture are self-declared capabilities. Availability is unknown.'],
      ['Person', 'Structured assessment', 'ASSESSED', 'HIGH', 'CURRENT', 'Platform networking capability was assessed. This does not assign staff.'],
      ['Delivery', 'Backlog state', 'OPERATIONAL CONTEXT', 'HIGH', 'CURRENT', 'Epic execution status is delivery context, not business-outcome evidence.']
    ],
    authorityDenied: [
      'Fund', 'Procure', 'Assign staff', 'Approve technical exception',
      'Write external system', 'Deploy', 'Provision', 'Mutate cloud', 'Accept risk'
    ]
  };

  const authorizationQueue = [
    {
      decisionId:'CPD-0001', carId:'CAR-0001', objectiveId:'O9', krId:'KR9.4',
      outcome:'Create a reusable managed-network foundation product.',
      owner:'Division Leader', productOwner:'Product Leader',
      scope:'Product contract definition · bounded validation',
      environments:'Development · Test',
      evidence:'Guard result · Console review · Forge product contract',
      initialDecision:'APPROVE CONDITIONALLY'
    },
    {
      decisionId:'CPD-0002', carId:'CAR-0002', objectiveId:'O10', krId:'KR10.1',
      outcome:'Standardize a reusable data-platform foundation product.',
      owner:'Division Leader', productOwner:'Data Platform Product Leader',
      scope:'Reusable data-platform product definition · bounded validation',
      environments:'Development · Test',
      evidence:'Reuse assessment · Guard result · accountable review',
      initialDecision:'APPROVED'
    },
    {
      decisionId:'CPD-0003', carId:null, objectiveId:'O10', krId:'KR10.1',
      outcome:'Create a second Kubernetes platform for an overlapping consumer need.',
      owner:'Division Leader', productOwner:'Application Platform Product Leader',
      scope:'Evaluate equivalence before new productization',
      environments:'No new environment authorized',
      evidence:'Accepted product catalog · equivalence evidence',
      initialDecision:'REUSE EXISTING'
    },
    {
      decisionId:'CPD-0004', carId:null, objectiveId:'O11', krId:'KR11.1',
      outcome:'Modernize a legacy capability without sufficient outcome evidence.',
      owner:'Division Leader', productOwner:'Portfolio Manager',
      scope:'Decision deferred pending stronger outcome and evidence definition',
      environments:'None',
      evidence:'Outcome definition · baseline · target · accountable evidence source',
      initialDecision:'DEFERRED'
    }
  ];

  const okrPortfolio = [
    {
      objectiveId: 'O9',
      approved: true,
      objective: 'Align cloud-product investment and execution to evidence-backed cloud platform outcomes.',
      krs: [
        {
          id: 'KR9.4',
          text: 'Every authorized reusable cloud-product outcome emits an exact Capability Authorization Record before delivery begins.',
          decision: 'CPD-0001',
          owner: 'Division Leader',
          source: 'Northstar decision and authorization evidence',
          interactive: true
        },
        {
          id: 'KR9.5',
          text: 'Reduce decision-to-authorized-backlog handoff time for standard reusable product decisions.',
          delivery: 'ACTIVE',
          outcome: 'ON TRACK',
          source: 'Synthetic cycle-time measurement',
          owner: 'Portfolio Manager'
        }
      ]
    },
    {
      objectiveId: 'O10',
      approved: true,
      objective: 'Increase reuse of governed infrastructure products before new productization begins.',
      krs: [
        {
          id: 'KR10.1',
          text: 'Reusable capability requests check accepted products before a new build path is authorized.',
          delivery: 'ACTIVE',
          outcome: 'ON TRACK',
          source: 'Synthetic reuse decision evidence',
          owner: 'Product Leader'
        },
        {
          id: 'KR10.2',
          text: 'Every approved exception records why existing governed products were not sufficient.',
          delivery: 'ACTIVE',
          outcome: 'AT RISK',
          source: 'Synthetic exception evidence',
          owner: 'Portfolio Manager'
        }
      ]
    },
    {
      objectiveId: 'O11',
      approved: true,
      objective: 'Improve evidence-backed platform decision quality and traceability.',
      krs: [
        {
          id: 'KR11.1',
          text: 'Product authorization decisions retain evidence, accountable owner, bounded scope and review date.',
          delivery: 'COMPLETE',
          outcome: 'ON TRACK',
          source: 'Synthetic decision-record measurement',
          owner: 'Division Leader'
        }
      ]
    }
  ];

  const state = {
    view:'okr',
    role:'leader',
    scenario:'decision',
    selectedKr:model.krId,
    selectedObjective:model.objectiveId,
    composerAccepted:false,
    selectedAuthorizationId:'CPD-0001',
    authorizationDecisions:Object.fromEntries(authorizationQueue.map(item=>[item.decisionId,null])),
    selectedAuthorizationIds:[],
    authorizationReceipts:initialAuthorizationReceipts(),
    handoffTarget:'jira',
    handoffConfirmed:false,
    handoffReceipt:null,
    managementProposalState:'idle',
    managementProposalDigest:null,
    managementIntent:'Decompose the selected authorized outcome into the smallest useful Epic set while preferring governed reuse and preserving measurable outcomes.',
    managementSelectedDecisionIds:[],
    acceptedEpic:null,
    authorizationReturnView:null,
    lineageScenario:'current',
    lineageFocus:'objective',
    lineageObjective:model.objectiveId,
    lineageKr:model.krId
  };
  let trailOpener = null;
  let composerOpener = null;
  let composerStep = 'intent';
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[ch]));

  function initialAuthorizationReceipts() {
    const item=authorizationQueue.find(candidate=>candidate.decisionId==='CPD-0002');
    const decision=item.initialDecision;
    const material=[
      item.decisionId,item.objectiveId,item.krId,item.outcome,item.scope,item.environments,
      item.productOwner,item.owner,item.evidence,decision
    ].join('|');
    return {
      [item.decisionId]:{
        packageId:'AUTH-PKG-'+item.decisionId.split('-')[1],
        evidenceDigest:stableDigest(material),
        approver:'Division Leader · synthetic accountable role',
        reviewDate:model.carReview,
        decision,
        carId:item.carId,
        confirmed:true
      }
    };
  }

  function badge(value, tone='neutral') {
    return '<span class="ns-badge '+tone+'">'+esc(value.replaceAll('_',' '))+'</span>';
  }
  function list(items) {
    return '<ul class="ns-list">'+items.map(item => '<li>'+esc(item)+'</li>').join('')+'</ul>';
  }
  function kv(items) {
    return '<div class="ns-kv">'+items.map(([k,v]) =>
      '<div><span>'+esc(k)+'</span><strong>'+v+'</strong></div>'
    ).join('')+'</div>';
  }
  function headline(title, copy, eyebrow='NORTHSTAR SIGNAL') {
    return '<div class="ns-view-head"><p class="eyebrow">'+esc(eyebrow)+'</p><h2>'+esc(title)+'</h2><p>'+esc(copy)+'</p></div>';
  }
  function current() { return scenarioData[state.scenario]; }
  function primaryAuthorization() { return authorizationRecord(authorizationQueue[0]); }

  function scopeBanner() {
    if (!state.selectedKr) return '';
    if (state.view === 'outcome') {
      return '<div class="ns-scope-bar downstream" aria-label="Downstream benefit feedback context">'+
        '<div><small>DOWNSTREAM BENEFIT FEEDBACK</small><strong>Separate from '+esc(state.selectedKr)+' authorization status</strong><span>Benefit evidence informs learning after authorization. It does not re-score the authorization Key Result.</span></div>'+
        '<button type="button" data-back-okr>Back to Cloud Platform OKRs</button>'+
      '</div>';
    }
    const ctx=state.view==='lineage'?lineageOkrContext():selectedOkrContext();
    return '<div class="ns-scope-bar" aria-label="Selected outcome context">'+
      '<div><small>'+(state.view==='lineage'?'BROWSING KEY RESULT':'SELECTED KEY RESULT')+'</small><strong>'+esc(ctx.objective.objectiveId)+' <span aria-hidden="true">→</span> '+esc(ctx.kr.id)+'</strong><span>'+esc(ctx.kr.text)+'</span></div>'+
      '<button type="button" data-back-okr>Back to Cloud Platform OKRs</button>'+
    '</div>';
  }

  function trailMarkup() {
    const s=current();
    const record=primaryAuthorization();
    return '<div class="ns-trail-lineage" aria-label="Northstar traceability chain">'+
      '<div class="ns-trail-step"><small>OBJECTIVE</small><strong>'+esc(model.objectiveId)+'</strong><span>'+esc(model.objective)+'</span></div>'+
      '<div class="ns-trail-arrow" aria-hidden="true">↓</div>'+
      '<div class="ns-trail-step emphasis"><small>KEY RESULT</small><strong>'+esc(model.krId)+'</strong><span>'+esc(model.keyResult)+'</span></div>'+
      '<div class="ns-trail-arrow" aria-hidden="true">↓</div>'+
      '<div class="ns-trail-step"><small>DECISION</small><strong>'+esc(model.decisionId)+'</strong><span>'+esc(record.decision.replaceAll('_',' '))+'</span></div>'+
      '<div class="ns-trail-arrow" aria-hidden="true">↓</div>'+
      '<div class="ns-trail-step"><small>CAPABILITY AUTHORIZATION</small><strong>'+(record.carId?esc(record.carId):'NO CAR')+'</strong><span>'+esc(record.authorized?'Current bounded product intent':'No authorized product-intent handoff')+'</span></div>'+
      '<div class="ns-trail-arrow" aria-hidden="true">↓</div>'+
      '<div class="ns-trail-step"><small>EPIC</small><strong>'+esc(model.epic)+'</strong><span>'+esc(record.authorized?model.epicTitle:'Candidate delivery context only · not authorized for handoff')+'</span></div>'+
    '</div>'+
    '<div class="ns-trail-evidence"><small>KR9.4 AUTHORIZATION EVIDENCE</small><h3>Northstar decision and authorization evidence</h3><p>Decision: <strong>'+esc(record.decision.replaceAll('_',' '))+'</strong> · Authorization: <strong>'+esc(record.authorization.replaceAll('_',' '))+'</strong></p><p>'+(record.authorized?'This evidence establishes the bounded decision-to-CAR requirement for KR9.4.':'No CAR is emitted while the selected decision does not authorize new product intent.')+'</p></div>'+
    '<div class="ns-trail-evidence secondary"><small>DOWNSTREAM BENEFIT FEEDBACK</small><h3>'+esc(s.benefitSource)+'</h3><p>Delivery: <strong>'+esc(s.delivery.replaceAll('_',' '))+'</strong> · Benefit signal: <strong>'+esc(s.benefitOutcome.replaceAll('_',' '))+'</strong></p><p>Benefit evidence informs investment learning. It does not substitute for the authorization evidence that proves KR9.4.</p></div>'+
    '<div class="ns-trail-actions"><button type="button" data-trail-decision>Open decision</button><button type="button" data-trail-evidence>Open evidence</button></div>';
  }

  function openTrail(opener) {
    trailOpener=opener||null;
    const dialog=$('ns-trail-dialog');
    $('ns-trail-content').innerHTML=trailMarkup();
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open','');
    const close=$('ns-trail-close');
    if(close) close.focus();
  }

  function closeTrail() {
    const dialog=$('ns-trail-dialog');
    if(dialog.open && typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
    if(trailOpener && typeof trailOpener.focus === 'function') trailOpener.focus();
    trailOpener=null;
  }

  const composerFixture = {
    intent: 'We need to make infrastructure delivery faster and get teams reusing standard products instead of building their own.',
    weakSignals: [
      '“Make delivery faster” has no baseline, target, or time boundary.',
      '“Drive reuse” has no measurable definition or evidence source.',
      'No accountable owner or organizational scope is explicit.'
    ],
    objective: 'Make governed infrastructure products the default path for division delivery.',
    keyResults: [
      {
        id: 'DRAFT-KR1',
        text: 'Reduce median decision-to-authorized-backlog handoff time from 12 business days to 5 business days by the end of FY27 Q3.',
        owner: 'Portfolio Manager',
        evidence: 'Northstar decision and backlog-handoff timestamps'
      },
      {
        id: 'DRAFT-KR2',
        text: 'Increase standard infrastructure requests fulfilled through governed reusable products from 42% to 75% by the end of FY27 Q4.',
        owner: 'Division Leader',
        evidence: 'Accepted Storefront/product-order and reuse-decision evidence'
      }
    ]
  };

  const composerChecks = [
    ['Objective quality', 'PASS', 'Directional and outcome-oriented; not a task list.'],
    ['KR measurability', 'PASS', 'Each Key Result has a measurable change.'],
    ['Baseline + target', 'PASS', 'Both candidate Key Results preserve explicit starting and target values.'],
    ['Time boundary', 'PASS', 'Each Key Result has a bounded FY27 quarter.'],
    ['Ownership + scope', 'PASS', 'Accountable roles and division context are explicit.'],
    ['Evidence source', 'PASS', 'Each Key Result names the evidence used to assess it.'],
    ['Activity ≠ outcome', 'PASS', 'Backlog completion cannot by itself declare either Key Result achieved.'],
    ['Authority boundary', 'PASS', 'The draft creates no funding, personnel, procurement, cloud, or risk authority.']
  ];

  function composerMarkup() {
    const proposed = composerStep !== 'intent';
    const accepted = composerStep === 'accepted';
    return '<div class="ns-composer-flow" aria-label="Composite AI OKR Composer">'+
      '<div class="ns-composer-step active"><small>1 · LEADER INTENT</small><label for="ns-composer-intent">Plain-language intent</label><textarea id="ns-composer-intent" rows="4">'+esc(composerFixture.intent)+'</textarea>'+
      '<div class="ns-composer-warnings">'+list(composerFixture.weakSignals)+'</div></div>'+
      (proposed ? '<div class="ns-composer-step"><small>2 · COMPOSITE AI PROPOSAL</small><div class="ns-ai-proposed">AI-PROPOSED · SYNTHETIC FIXTURE</div><h3>'+esc(composerFixture.objective)+'</h3>'+
        '<div class="ns-composer-krs">'+composerFixture.keyResults.map(kr=>'<article><small>'+esc(kr.id)+'</small><strong>'+esc(kr.text)+'</strong><span>Owner: '+esc(kr.owner)+'</span><span>Evidence: '+esc(kr.evidence)+'</span></article>').join('')+'</div></div>' : '')+
      (proposed ? '<div class="ns-composer-step validator"><small>3 · DETERMINISTIC STRUCTURAL VALIDATION</small><h3>'+ (accepted ? 'STRUCTURALLY SOUND · HUMAN ACCEPTED' : 'STRUCTURALLY SOUND') +'</h3><div class="ns-composer-checks">'+composerChecks.map(([name,status,note])=>'<article><div><strong>'+esc(name)+'</strong><span>'+esc(note)+'</span></div>'+badge(status,'green')+'</article>').join('')+'</div><p class="ns-composer-note">Northstar validates structure independently of the model. “Structurally sound” does not mean funded, approved, achievable, or strategically correct.</p></div>' : '')+
      '<div class="ns-composer-actions">'+
        (!proposed ? '<button type="button" class="primary" data-composer-draft>Draft with Composite AI</button>' : '')+
        (proposed && !accepted ? '<button type="button" class="primary" data-composer-accept>Accept synthetic draft</button><button type="button" data-composer-reset>Start over</button>' : '')+
        (accepted ? '<button type="button" class="primary" data-composer-done>Return to Cloud Platform OKRs</button>' : '')+
      '</div>'+
    '</div>';
  }

  function openComposer(opener) {
    composerOpener=opener||null;
    composerStep=state.composerAccepted?'accepted':'intent';
    $('ns-composer-content').innerHTML=composerMarkup();
    const dialog=$('ns-composer-dialog');
    if(typeof dialog.showModal==='function') dialog.showModal();
    else dialog.setAttribute('open','');
    const focus=dialog.querySelector('textarea,button');
    if(focus) focus.focus();
  }

  function closeComposer() {
    const dialog=$('ns-composer-dialog');
    if(dialog.open && typeof dialog.close==='function') dialog.close();
    else dialog.removeAttribute('open');
    if(composerOpener && typeof composerOpener.focus==='function') composerOpener.focus();
    composerOpener=null;
  }

  function renderComposer() {
    if(state.view==='composer'){
      render();
      const inlineFocus=$('northstar-view')?.querySelector('[data-composer-accept],[data-composer-done],[data-composer-draft]');
      if(inlineFocus) inlineFocus.focus();
      return;
    }
    $('ns-composer-content').innerHTML=composerMarkup();
    const dialog=$('ns-composer-dialog');
    const focus=dialog.querySelector('[data-composer-accept],[data-composer-done],[data-composer-draft]');
    if(focus) focus.focus();
  }

  function composerView() {
    return headline(
      'Turn leader intent into structurally sound OKRs.',
      'Start with plain-language intent. Composite AI proposes an Objective and measurable Key Results; deterministic Northstar checks validate structure before accountable human acceptance.',
      'COMPOSITE AI · OKR COMPOSER'
    )+
    '<div class="ns-boundary-box"><strong>Authority boundary:</strong> AI proposes. Northstar validates structure. A human decides whether the draft is useful. Acceptance here creates no funding, personnel, procurement, cloud, deployment, provisioning or risk authority.</div>'+
    composerMarkup();
  }

  function okrOverview() {
    const s=current();
    const benefitUnproven = s.benefitOutcome === 'UNKNOWN' ? 1 : 0;
    const primary=primaryAuthorization();
    const decisionPending = !['APPROVED','REUSE EXISTING','DEFERRED'].includes(primary.decision);
    const kr94Status = primary.authorized ? 'ON TRACK' : 'UNKNOWN';

    const objectiveCards = okrPortfolio.map((objective, objectiveIndex) => {
      const krRows = objective.krs.map(kr => {
        const isPrimary = kr.id === model.krId;
        const delivery = isPrimary ? s.delivery : kr.delivery;
        const outcome = isPrimary ? kr94Status : kr.outcome;
        const outcomeTone = outcome === 'UNKNOWN' || outcome === 'AT RISK' ? 'amber' : 'green';
        const source = kr.source;
        const action = '<div class="ns-kr-actions">'+
          (kr.interactive?'<button class="ns-okr-open" data-open-trail="'+esc(kr.id)+'" type="button">Open trail <span aria-hidden="true">→</span></button>':'<span class="ns-okr-source-note">Measured</span>')+
          '<button class="ns-okr-open" data-compose-kr="'+esc(kr.id)+'" data-compose-objective="'+esc(objective.objectiveId)+'" type="button">Compose Epics <span aria-hidden="true">→</span></button></div>';
        const statusLabel = isPrimary ? 'KR STATUS' : 'OUTCOME';
        return '<div class="ns-kr-row'+(isPrimary?' primary':'')+'">'+
          '<div class="ns-kr-copy"><small>'+esc(kr.id)+'</small><strong>'+esc(kr.text)+'</strong><span>'+esc(kr.owner)+'</span></div>'+
          '<div class="ns-kr-signals"><div><span>DELIVERY</span>'+badge(delivery,'blue')+'</div><div><span>'+statusLabel+'</span>'+badge(outcome,outcomeTone)+'</div></div>'+
          '<div class="ns-kr-source"><span>EVIDENCE SOURCE</span><strong>'+esc(source)+'</strong>'+action+'</div>'+
        '</div>';
      }).join('');
      const health = objectiveIndex === 1 ? 'WATCH' : 'ON TRACK';
      const tone = objectiveIndex === 1 ? 'amber' : 'green';
      return '<article class="ns-objective-card">'+
        '<div class="ns-objective-head"><div class="ns-objective-id">'+esc(objective.objectiveId)+'</div><div class="ns-objective-title"><small>DIVISION OBJECTIVE</small><h3>'+esc(objective.objective)+'</h3></div><div class="ns-objective-health">'+badge(health,tone)+'<span>'+objective.krs.length+' Key Result'+(objective.krs.length===1?'':'s')+'</span><button class="ns-okr-open" type="button" data-lineage-objective-open="'+esc(objective.objectiveId)+'">Explore lineage <span aria-hidden="true">→</span></button></div></div>'+
        '<div class="ns-objective-krs">'+krRows+'</div>'+
      '</article>';
    }).join('');

    return '<div class="ns-dashboard-head">'+
      '<div><p class="eyebrow">'+esc(model.division)+' · '+esc(model.period)+'</p><h2>Cloud Platform OKRs</h2><p>Leadership starts with outcomes, not tickets. Delivery status is visible, but it never substitutes for the named evidence source that proves a Key Result.</p><div class="ns-dashboard-actions"><button type="button" class="ns-okr-open primary" data-open-composer>Create OKR with Composite AI</button><span>AI proposes · Northstar validates · you decide</span></div></div>'+
      '<div class="ns-dashboard-status"><span class="pulse"></span><div><small>PORTFOLIO SIGNAL</small><strong>'+(state.composerAccepted?'Synthetic OKR draft accepted for review':benefitUnproven?'1 downstream benefit still unproven':'All highlighted benefit signals measured')+'</strong></div></div>'+
    '</div>'+
    (state.composerAccepted?'<div class="ns-composer-accepted"><strong>Accepted synthetic draft</strong><span>The structurally sound draft is ready for accountable review. The demo does not create an authoritative Strategic Outcome Record or write to an external system.</span><button type="button" data-open-composer>Review draft</button></div>':'')+
    '<div class="ns-exec-metrics">'+
      '<article><div class="metric-icon">◎</div><div><small>OBJECTIVES</small><strong>3</strong><span>Division priorities</span></div></article>'+
      '<article><div class="metric-icon">▥</div><div><small>KEY RESULTS</small><strong>5</strong><span>Owned, measurable outcomes</span></div></article>'+
      '<article class="'+(decisionPending?'attention':'good')+'"><div class="metric-icon">!</div><div><small>NEEDS DECISION</small><strong>'+(decisionPending?'1':'0')+'</strong><span>'+(decisionPending?esc(model.decisionId)+' requires review':'No decision pending')+'</span></div></article>'+
      '<article class="'+(benefitUnproven?'attention':'good')+'"><div class="metric-icon">◌</div><div><small>BENEFIT UNPROVEN</small><strong>'+benefitUnproven+'</strong><span>'+(benefitUnproven?'Benefit evidence pending':'Benefit evidence received')+'</span></div></article>'+
    '</div>'+
    '<div class="ns-leadership-grid">'+
      '<div class="ns-leadership-main">'+
        '<div class="ns-section-title"><div><small>OUTCOME PORTFOLIO</small><h3>Division objectives and Key Results</h3></div><span>Delivery ≠ outcome</span></div>'+
        '<div class="ns-okr-board">'+objectiveCards+'</div>'+
      '</div>'+
      '<aside class="ns-attention-rail">'+
        '<div class="ns-rail-head"><small>LEADERSHIP ATTENTION</small><h3>What needs you now</h3></div>'+
        '<article class="ns-attention-card '+(decisionPending?'':'resolved')+'"><div class="ns-attention-top"><span class="priority">'+(decisionPending?'DECISION':'DECISION RESOLVED')+'</span>'+badge(primary.decision,decisionPending?'blue':primary.authorized?'green':'amber')+'</div><h4>'+esc(model.proposedOutcome)+'</h4><p>'+(decisionPending?esc(s.attention[0]):primary.authorized?'The decision authorizes bounded product intent. Northstar keeps the exact CAR visible while attention shifts downstream.':primary.decision==='REUSE EXISTING'?'The decision resolved to reuse an existing governed product, so no new CAR or build handoff is emitted.':'The decision is deferred. No CAR or authorized downstream handoff exists until leadership revisits it.')+'</p><div class="ns-attention-meta"><span>'+esc(model.krId)+'</span><span>'+esc(model.decisionId)+'</span></div><button class="ns-okr-open primary" data-review-decision="'+esc(model.krId)+'" type="button">'+(decisionPending?'Review decision':'View decision record')+' <span aria-hidden="true">→</span></button></article>'+
        '<article class="ns-rail-insight"><small>WHY THIS MATTERS</small><strong>Closing '+esc(model.epic)+' will not close '+esc(model.krId)+'.</strong><p>KR9.4 is assessed from decision/CAR evidence; downstream benefit is measured separately.</p></article>'+
        '<article class="ns-rail-proof"><small>TRACEABILITY</small><div><b>Objective</b><span>→</span><b>KR</b><span>→</span><b>Decision</b><span>→</span><b>CAR</b><span>→</span><b>Epic</b></div></article>'+
      '</aside>'+
    '</div>'+
    '<div class="ns-boundary-box"><strong>Leadership rule:</strong> a completed Epic can change the delivery signal. It cannot change KR9.4 authorization status, which comes from decision/CAR evidence. Downstream benefit is measured separately.</div>';
  }

  function leadership() {
    const ctx=selectedOkrContext();
    const s=selectedFeedback();
    const record=selectedAuthorization();
    const decisionId=ctx.authorization?ctx.authorization.decisionId:'NO DECISION';
    const decision=record?record.decision:'NO DECISION';
    const authorization=record?record.authorization:'NOT DEFINED';
    const authSummary=record&&record.authorized
      ? record.carId+' · review '+model.carReview
      : record&&record.decision==='REUSE EXISTING'
        ? 'Reuse path · no new CAR'
        : record&&record.decision==='DEFERRED'
          ? 'Deferred · no CAR'
          : 'No current CAR';
    const deliveryDetail=managementAcceptanceCurrent()&&state.acceptedEpic
      ? state.acceptedEpic.epic+' · '+state.acceptedEpic.title
      : ctx.kr.id+' portfolio delivery context';
    const attention=s.attention&&s.attention.length?s.attention:[
      record&&record.authorized
        ? 'Keep delivery and benefit evidence bound to the selected authorization without widening its scope.'
        : record&&record.decision==='REUSE EXISTING'
          ? 'Verify the accepted product remains equivalent to the selected outcome before considering new productization.'
          : record&&record.decision==='DEFERRED'
            ? 'Strengthen the outcome, baseline, target and accountable evidence before reconsidering authorization.'
            : 'Establish a bounded authorization decision before downstream execution can advance.'
    ];
    const benefitTone=(s.benefitOutcome==='UNKNOWN'||s.benefitOutcome==='UNAVAILABLE'||s.benefitOutcome==='AT RISK')?'amber':'green';
    return headline(
      ctx.objective.objective,
      ctx.kr.text,
      ctx.objective.objectiveId+' · '+ctx.kr.id
    )+
    '<div class="ns-metrics">'+
      '<article><small>DECISION</small>'+badge(decision,record&&record.authorized?'green':'blue')+'<p>'+esc(decisionId)+' · review '+esc(model.decisionReview)+'</p></article>'+
      '<article><small>AUTHORIZATION</small>'+badge(authorization,record&&record.authorized?'green':'amber')+'<p>'+esc(authSummary)+'</p></article>'+
      '<article><small>DELIVERY</small>'+badge(s.delivery,'blue')+'<p>'+esc(deliveryDetail)+'</p></article>'+
      '<article><small>BENEFIT FEEDBACK</small>'+badge(s.benefitOutcome,benefitTone)+'<p>'+esc(s.benefitSource)+'</p></article>'+
    '</div>'+
    '<div class="ns-truth">'+
      '<article><small>'+esc(ctx.kr.id)+' AUTHORIZATION STATUS</small><h3>'+esc(authorization.replaceAll('_',' '))+'</h3><p>'+(record&&record.authorized?'Decision/CAR evidence establishes the selected authorization independently of backlog completion.':record&&record.decision==='REUSE EXISTING'?'The selected decision uses an accepted-product path and emits no new CAR.':record&&record.decision==='DEFERRED'?'The selected decision remains deferred; insufficient evidence creates no downstream authority.':'No current CAR establishes product-intent authorization for this selected Key Result.')+'</p></article>'+
      '<article><small>DOWNSTREAM BENEFIT FEEDBACK</small><h3>'+esc(s.benefitOutcome.replaceAll('_',' '))+'</h3><p>'+esc((s.benefitMeasurement==='UNKNOWN'||s.benefitMeasurement==='UNAVAILABLE')?'No authoritative benefit measurement yet.':'Observed benefit evidence can inform investment learning without re-scoring the selected authorization.')+'</p></article>'+
    '</div>'+
    '<div class="ns-attention"><h3>What needs leadership attention</h3>'+list(attention)+'</div>';
  }

  function selectOkrContext(objectiveId, krId) {
    const changed=state.selectedObjective!==objectiveId||state.selectedKr!==krId;
    state.selectedObjective=objectiveId;
    state.selectedKr=krId;
    if(changed){
      state.managementProposalState='idle';
      state.managementProposalDigest=null;
      state.managementSelectedDecisionIds=[];
      state.acceptedEpic=null;
      invalidateHandoff();
    }
  }

  function selectedOkrContext() {
    const objective=okrPortfolio.find(o=>o.objectiveId===state.selectedObjective)||okrPortfolio[0];
    const kr=objective.krs.find(k=>k.id===state.selectedKr)||objective.krs[0];
    const authorization=authorizationQueue.find(item=>item.objectiveId===objective.objectiveId&&item.krId===kr.id)||null;
    return {objective,kr,authorization};
  }

  function lineageOkrContext() {
    const objective=okrPortfolio.find(o=>o.approved&&o.objectiveId===state.lineageObjective)||okrPortfolio.find(o=>o.approved&&o.objectiveId===state.selectedObjective)||okrPortfolio.find(o=>o.approved)||okrPortfolio[0];
    const kr=objective.krs.find(k=>k.id===state.lineageKr)||objective.krs[0];
    const authorization=authorizationQueue.find(item=>item.objectiveId===objective.objectiveId&&item.krId===kr.id)||null;
    return {objective,kr,authorization};
  }

  function setLineageContext(objectiveId, krId) {
    const objective=okrPortfolio.find(o=>o.approved&&o.objectiveId===objectiveId);
    if(!objective)return false;
    const kr=objective.krs.find(k=>k.id===krId)||objective.krs[0];
    state.lineageObjective=objective.objectiveId;
    state.lineageKr=kr.id;
    state.lineageScenario='current';
    return true;
  }

  function lineageOkrContext() {
    const objective=okrPortfolio.find(o=>o.approved&&o.objectiveId===state.lineageObjective)||okrPortfolio.find(o=>o.approved&&o.objectiveId===state.selectedObjective)||okrPortfolio.find(o=>o.approved)||okrPortfolio[0];
    const kr=objective.krs.find(k=>k.id===state.lineageKr)||objective.krs[0];
    const authorization=authorizationQueue.find(item=>item.objectiveId===objective.objectiveId&&item.krId===kr.id)||null;
    return {objective,kr,authorization};
  }

  function setLineageContext(objectiveId, krId) {
    const objective=okrPortfolio.find(o=>o.approved&&o.objectiveId===objectiveId);
    if(!objective)return false;
    const kr=objective.krs.find(k=>k.id===krId)||objective.krs[0];
    state.lineageObjective=objective.objectiveId;
    state.lineageKr=kr.id;
    state.lineageFocus=krId? 'kr':'objective';
    state.lineageScenario='current';
    return true;
  }

  function selectedFeedback() {
    const ctx=selectedOkrContext();
    if(ctx.objective.objectiveId===model.objectiveId&&ctx.kr.id===model.krId)return current();
    return {
      delivery:ctx.kr.delivery||'UNAVAILABLE',
      benefitMeasurement:ctx.kr.outcome?'PORTFOLIO SIGNAL':'UNAVAILABLE',
      benefitOutcome:ctx.kr.outcome||'UNAVAILABLE',
      benefitSource:ctx.kr.source||'No context-specific feedback fixture',
      attention:[]
    };
  }

  function selectedAuthorization() {
    const ctx=selectedOkrContext();
    return ctx.authorization?authorizationRecord(ctx.authorization):null;
  }

  function selectedAuthorizationBinding() {
    const ctx=selectedOkrContext(), record=selectedAuthorization();
    if(!ctx.authorization||!record||!record.authorized)return null;
    const receipt=state.authorizationReceipts[ctx.authorization.decisionId];
    return receipt?{decisionId:ctx.authorization.decisionId,carId:record.carId,packageId:receipt.packageId,evidenceDigest:receipt.evidenceDigest,objectiveId:ctx.objective.objectiveId,krId:ctx.kr.id}:null;
  }

  function authorizationBindingFor(item) {
    const record=authorizationRecord(item);
    const receipt=state.authorizationReceipts[item.decisionId];
    if(!record.authorized||!receipt)return null;
    return {decisionId:item.decisionId,carId:record.carId,packageId:receipt.packageId,evidenceDigest:receipt.evidenceDigest,objectiveId:item.objectiveId,krId:item.krId,authorizedOutcome:item.outcome,authorizedScope:item.scope};
  }

  function authorizedManagementContexts() {
    return authorizationQueue.map(item=>({item,binding:authorizationBindingFor(item)})).filter(entry=>entry.binding);
  }

  function ensureManagementSelection() {
    const ctx=selectedOkrContext();
    const valid=new Set(authorizedManagementContexts().map(entry=>entry.item.decisionId));
    state.managementSelectedDecisionIds=state.managementSelectedDecisionIds.filter(id=>valid.has(id));
    if(ctx.authorization&&valid.has(ctx.authorization.decisionId)&&!state.managementSelectedDecisionIds.length)state.managementSelectedDecisionIds=[ctx.authorization.decisionId];
  }

  function managementSourceBindings() {
    ensureManagementSelection();
    return state.managementSelectedDecisionIds.map(id=>{
      const item=authorizationQueue.find(candidate=>candidate.decisionId===id);
      return item?authorizationBindingFor(item):null;
    }).filter(Boolean);
  }

  function managementSelectionDigest(bindings) {
    return stableDigest(bindings.map(b=>[b.objectiveId,b.krId,b.decisionId,b.carId,b.packageId,b.evidenceDigest,b.authorizedOutcome,b.authorizedScope].join('|')).sort().join('||'));
  }

  function currentManagementDraftDigest() {
    const bindings=managementSourceBindings();
    return bindings.length?stableDigest(state.managementIntent+'|'+managementSelectionDigest(bindings)):null;
  }

  const managementEpicProposals=[
    {
      id:'MEP-0001',epic:'EP-23',title:'Managed Network Foundation',
      outcome:'Deliver a reusable managed-network product contract that preserves the authorized KR9.4 outcome.',
      acceptance:['Reusable product contract published','Bounded validation passes','Consumer path demonstrated','Delivery evidence remains separate from benefit evidence'],
      evidence:'Guard result · Console review · Forge product contract',
      reuse:'NO EQUIVALENT ACCEPTED PRODUCT FOUND',
      reuseTone:'green'
    },
    {
      id:'MEP-0002',epic:'EP-CANDIDATE-02',title:'Network Consumer Onboarding',
      outcome:'Standardize consumer onboarding into the managed-network product without widening CAR-0001.',
      acceptance:['Consumer eligibility is explicit','Existing product path reused','No new infrastructure authority introduced'],
      evidence:'Storefront selection · accepted product binding',
      reuse:'PARTIAL OVERLAP · REVIEW WITH EXISTING STOREFRONT FLOW',
      reuseTone:'amber'
    }
  ];

  function withProposalContext(proposals,ctx) {
    if(!ctx.authorization)return [];
    return proposals.map(p=>({...p,
      outcome:p.outcome+' Management intent: '+state.managementIntent,
      proposalContext:{
        objectiveId:ctx.objective.objectiveId,
        krId:ctx.kr.id,
        decisionId:ctx.authorization.decisionId,
        authorizedOutcome:ctx.authorization.outcome,
        authorizedScope:ctx.authorization.scope,
        managementIntent:state.managementIntent
      }
    }));
  }

  function managementContextForBinding(binding) {
    const objective=okrPortfolio.find(o=>o.objectiveId===binding.objectiveId);
    const kr=objective?.krs.find(k=>k.id===binding.krId);
    const authorization=authorizationQueue.find(item=>item.decisionId===binding.decisionId);
    return objective&&kr&&authorization?{objective,kr,authorization}:null;
  }

  function managementProposalsForSelectedContext() {
    ensureManagementSelection();
    const ctx=selectedOkrContext();
    const bindings=managementSourceBindings();
    if(bindings.length>1){
      const outcomes=bindings.map(b=>b.authorizedOutcome);
      const scopes=bindings.map(b=>b.authorizedScope);
      return [{
        id:'MEP-MULTI-001',epic:'EP-CANDIDATE-MULTI-01',title:'Cross-KR Authorized Outcome Epic',
        outcome:'Compose one bounded management Epic from the selected authorized outcomes: '+outcomes.join(' + ')+'. Management intent: '+state.managementIntent,
        acceptance:['Each source KR/CAR remains independently traceable','The Epic stays within the union of the explicitly selected authorized scopes without creating new authority','Evidence requirements remain attributable to each source KR','Delivery completion cannot independently declare any source KR achieved'],
        evidence:'Independent CAR bindings · selected-KR evidence requirements · management intent',
        reuse:'MULTI-KR COMPOSITION · AUTHORITY REMAINS SEPARATE PER SOURCE CAR',
        reuseTone:'green',
        proposalContext:{bindings:bindings.map(b=>({...b})),selectionDigest:managementSelectionDigest(bindings),managementIntent:state.managementIntent,authorizedOutcomes:outcomes,authorizedScopes:scopes}
      }];
    }
    const singleCtx=bindings.length===1?managementContextForBinding(bindings[0]):ctx;
    if(singleCtx?.objective.objectiveId==='O9'&&singleCtx.kr.id==='KR9.4')return withProposalContext(managementEpicProposals,singleCtx);
    if(singleCtx?.objective.objectiveId==='O10'&&singleCtx.kr.id==='KR10.1')return withProposalContext([
      {
        id:'MEP-O10-001',epic:'EP-CANDIDATE-O10-01',title:'Reusable Data Platform Foundation',
        outcome:'Define and validate the reusable data-platform foundation product authorized by CPD-0002 without widening its bounded product-definition scope.',
        acceptance:['Reusable data-platform product contract is defined','Bounded validation passes against the authorized scope','Accepted-product equivalence is checked before implementation','Delivery evidence remains separate from benefit evidence'],
        evidence:'Reuse assessment · Guard result · accountable review · product contract',
        reuse:'REUSE-FIRST CONSTRAINT · EXISTING GOVERNED PRODUCTS MUST BE EVALUATED BEFORE NET-NEW IMPLEMENTATION',
        reuseTone:'green'
      },
      {
        id:'MEP-O10-002',epic:'EP-CANDIDATE-O10-02',title:'Data Platform Consumer Contract',
        outcome:'Define the bounded consumer contract and onboarding path for the authorized reusable data-platform foundation without adding new execution authority.',
        acceptance:['Consumer contract is explicit','Existing governed product paths are reused where equivalent','No funding, deployment, provisioning or risk authority is inferred'],
        evidence:'Product contract · consumer eligibility · reuse/equivalence evidence',
        reuse:'CONSUMER REUSE PATH · NO DUPLICATE PRODUCT ASSUMPTION',
        reuseTone:'amber'
      }
    ],singleCtx);
    return [];
  }

  function proposalMatchesSelectedAuthorization(proposal) {
    const pc=proposal&&proposal.proposalContext;
    const bindings=managementSourceBindings();
    if(!pc||!bindings.length)return false;
    if(Array.isArray(pc.bindings)){
      return pc.managementIntent===state.managementIntent&&pc.selectionDigest===managementSelectionDigest(bindings)&&pc.bindings.length===bindings.length&&
        bindings.every(binding=>pc.bindings.some(saved=>saved.decisionId===binding.decisionId&&saved.carId===binding.carId&&saved.packageId===binding.packageId&&saved.evidenceDigest===binding.evidenceDigest&&saved.authorizedOutcome===binding.authorizedOutcome&&saved.authorizedScope===binding.authorizedScope));
    }
    const binding=bindings[0];
    return Boolean(bindings.length===1&&
      pc.objectiveId===binding.objectiveId&&pc.krId===binding.krId&&pc.decisionId===binding.decisionId&&
      pc.authorizedOutcome===binding.authorizedOutcome&&pc.authorizedScope===binding.authorizedScope&&
      pc.managementIntent===state.managementIntent);
  }

  const managementChecks=[
    ['CAR scope binding','PASS','Every proposed Epic remains within the exact current CAR scope.'],
    ['KR traceability','PASS','Each proposal states how it contributes to the selected Key Result rather than merely listing tasks.'],
    ['Outcome-oriented Epic','PASS','Acceptance is expressed as observable capability outcomes.'],
    ['Evidence requirements','PASS','Each proposal names evidence required to demonstrate delivery.'],
    ['Authority expansion','PASS','No proposal adds funding, deployment, provisioning, cloud or risk authority.'],
    ['Reuse / equivalence','REVIEW','Northstar checks existing portfolio context before accepting new work.'],
    ['Activity ≠ benefit','PASS','Epic completion cannot by itself declare the Key Result or business benefit achieved.']
  ];

  function currentPrimaryAuthorizationBinding() {
    const item=authorizationQueue[0];
    const decision=authorizationDecision(item);
    const pkg=authorizationPackage(item,decision);
    const record=authorizationRecord(item);
    if(!record.authorized)return null;
    return {carId:record.carId,packageId:pkg.packageId,evidenceDigest:pkg.evidenceDigest,decision};
  }

  function managementAcceptanceCurrent() {
    const accepted=state.acceptedEpic;
    const bindings=managementSourceBindings();
    if(!accepted||!Array.isArray(accepted.authorizationBindings)||!bindings.length)return false;
    return accepted.managementIntent===state.managementIntent&&
      accepted.selectionDigest===managementSelectionDigest(bindings)&&
      accepted.authorizationBindings.length===bindings.length&&
      bindings.every(binding=>accepted.authorizationBindings.some(saved=>
        saved.carId===binding.carId&&saved.packageId===binding.packageId&&saved.evidenceDigest===binding.evidenceDigest&&
        saved.decisionId===binding.decisionId&&saved.objectiveId===binding.objectiveId&&saved.krId===binding.krId));
  }

  function invalidateManagementAcceptance() {
    state.managementProposalState='idle';
    state.managementProposalDigest=null;
    state.acceptedEpic=null;
    invalidateHandoff();
  }

  function invalidateManagementForAuthorization(decisionId) {
    const draftDecisionIds=state.managementProposalState!=='idle'?[...state.managementSelectedDecisionIds]:[];
    const acceptedDecisionIds=(state.acceptedEpic?.authorizationBindings||[]).map(binding=>binding.decisionId);
    if(draftDecisionIds.includes(decisionId)||acceptedDecisionIds.includes(decisionId)){
      invalidateManagementAcceptance();
    }
  }

  function managementComposer() {
    const ctx=selectedOkrContext();
    const primary=selectedAuthorization();
    ensureManagementSelection();
    const authorizedContexts=authorizedManagementContexts();
    const sourceBindings=managementSourceBindings();
    const hasAuthorizedContexts=authorizedContexts.length>0;
    if(!ctx.authorization&&!hasAuthorizedContexts)return '<section class="ns-management-composer" aria-label="Composite AI Management Composer"><div class="ns-mc-head"><div><small>COMPOSITE AI · MANAGEMENT COMPOSER</small><h2>'+esc(ctx.objective.objectiveId)+' → '+esc(ctx.kr.id)+'</h2><p>'+esc(ctx.kr.text)+'</p></div>'+badge('AUTHORIZATION NOT DEFINED','amber')+'</div><div class="ns-boundary-box"><strong>No authorization decision is bound to this Key Result.</strong> Management can select it for planning context, but Northstar cannot generate an authorized Epic package or BHP until leadership establishes the required decision/CAR contract.</div></section>';
    if(!hasAuthorizedContexts&&(!primary||!primary.authorized)){
      const eligibility=ctx.authorization?authorizationEligibility(ctx.authorization):{eligible:false,reason:'No authorization decision is bound to this Key Result.'};
      if(!eligibility.eligible)return '<section class="ns-management-composer" aria-label="Composite AI Management Composer">'+
        '<div class="ns-mc-head"><div><small>COMPOSITE AI · MANAGEMENT COMPOSER</small><h2>'+esc(ctx.objective.objectiveId)+' → '+esc(ctx.kr.id)+' · '+esc((primary?.decision||'NO DECISION').replaceAll('_',' '))+'</h2><p>'+esc(ctx.kr.text)+'</p></div>'+badge(primary?.authorization||'NOT AUTHORIZED','amber')+'</div>'+
        '<div class="ns-mc-context"><small>NON-AUTHORIZABLE DECISION CONTEXT</small><span>'+esc(ctx.authorization?ctx.authorization.decisionId:'NO DECISION')+'</span><span>'+esc((primary?.decision||'NO DECISION').replaceAll('_',' '))+'</span><span>No current CAR</span><span>No Epic proposal</span><span>No BHP</span></div>'+
        '<div class="ns-boundary-box"><strong>Fail closed.</strong> '+esc(eligibility.reason)+' Management cannot generate executable Epic proposals until leadership establishes a separate eligible authorization decision.</div>'+
      '</section>';
      return '<section class="ns-management-composer" aria-label="Composite AI Management Composer">'+
        '<div class="ns-mc-head"><div><small>COMPOSITE AI · MANAGEMENT COMPOSER</small><h2>'+esc(ctx.objective.objectiveId)+' → '+esc(ctx.kr.id)+' · Compose candidate Epics.</h2><p>This workspace stays visible to management before authorization so the required sequence is explicit. Composite AI cannot propose executable work until the exact product-intent authorization is current.</p></div>'+badge('AUTHORIZATION REQUIRED','amber')+'</div>'+
        '<div class="ns-mc-context"><small>REQUIRED BOUNDED CONTEXT</small><span>'+esc(ctx.objective.objectiveId)+'</span><span>'+esc(ctx.kr.id)+'</span><span>'+esc(ctx.authorization?ctx.authorization.decisionId:'NO AUTHORIZATION DECISION')+'</span><span>Current CAR required</span><span>Exact package digest required</span></div>'+
        '<div class="ns-boundary-box"><strong>Fail closed · no CAR, no Epic proposal, no BHP.</strong> Complete the exact authorization package first. A CAR establishes bounded product intent; it does not create a BHP and it does not substitute for management acceptance.</div>'+
        '<div class="ns-composer-actions"><button type="button" class="primary" data-management-authorize>Authorize outcome to continue</button></div>'+
      '</section>';
    }
    const proposals=managementProposalsForSelectedContext();
    const proposed=state.managementProposalState!=='idle'&&state.managementProposalDigest===currentManagementDraftDigest();
    const proposalsBound=proposed&&proposals.length>0&&proposals.every(proposalMatchesSelectedAuthorization);
    const accepted=state.managementProposalState==='accepted'&&managementAcceptanceCurrent()&&proposalsBound;
    const selector=authorizedContexts.map(({item,binding})=>'<label class="ns-mc-kr-choice"><input type="checkbox" data-management-kr-check="'+esc(item.decisionId)+'" '+(state.managementSelectedDecisionIds.includes(item.decisionId)?'checked':'')+'><span><strong>'+esc(item.objectiveId+' → '+item.krId)+'</strong><small>'+esc(item.decisionId+' · '+binding.carId+' · '+item.outcome)+'</small></span></label>').join('');
    return '<section class="ns-management-composer" aria-label="Composite AI Management Composer">'+
      '<div class="ns-mc-head"><div><small>COMPOSITE AI · MANAGEMENT COMPOSER</small><h2>Compose candidate Epics from authorized outcomes.</h2><p>Management can provide intent and select one or more currently authorized KRs. Every selected KR keeps its own CAR and evidence binding.</p></div>'+badge(authorizedContexts.length+' AUTHORIZED KR'+(authorizedContexts.length===1?'':'S')+' AVAILABLE','green')+'</div>'+
      '<div class="ns-mc-context"><small>BOUNDED CONTEXT</small>'+sourceBindings.map(binding=>'<span>'+esc(binding.objectiveId+' → '+binding.krId+' · '+binding.decisionId+' · '+binding.carId)+'</span>').join('')+'<span>Existing product catalog</span><span>Existing Epic relationships</span></div>'+
      '<div class="ns-mc-input"><label for="ns-management-intent">Management intent</label><textarea id="ns-management-intent" data-management-intent rows="4" placeholder="Describe the Epic outcome, sequencing, dependencies, or management intent...">'+esc(state.managementIntent)+'</textarea><div class="ns-mc-kr-selector"><small>AUTHORIZED KRS TO USE</small>'+selector+'</div><p>Select one or more authorized KRs. Northstar keeps each source CAR independent; selection does not merge or widen authority.</p></div>'+
      (!proposed?'<div class="ns-mc-empty"><h3>'+(sourceBindings.length?'Ready to compose':'Select one or more authorized KRs')+'</h3><p>'+(sourceBindings.length?'Composite AI will use the management intent plus the exact selected KR/CAR set, then deterministic checks validate scope and lineage before acceptance.':'Every current CAR-backed KR in management scope is listed above. Select the outcomes Composite AI should use; Northstar preserves each authorization independently.')+'</p><button type="button" class="primary" data-management-draft '+(!sourceBindings.length?'disabled':'')+'>Propose Epics with Composite AI</button></div>':'')+
      (proposed?'<div class="ns-mc-proposals"><small>AI-PROPOSED · SYNTHETIC FIXTURE</small>'+proposals.map((p,i)=>'<article data-management-proposal="'+esc(p.id)+'"><div class="ns-mc-proposal-head"><div><small>'+esc(p.id)+' · '+esc(p.epic)+'</small><h3>'+esc(p.title)+'</h3></div>'+badge(i===0?'PRIMARY':'CANDIDATE',i===0?'blue':'neutral')+'</div><p>'+esc(p.outcome)+'</p><div class="ns-mc-reuse '+p.reuseTone+'"><strong>REUSE / EQUIVALENCE</strong><span>'+esc(p.reuse)+'</span></div><div class="ns-mc-acceptance"><strong>Acceptance outcomes</strong>'+list(p.acceptance)+'</div><div class="ns-mc-evidence"><strong>Evidence</strong><span>'+esc(p.evidence)+'</span></div></article>').join('')+'</div>':'')+
      (proposed?'<div class="ns-composer-step validator"><small>DETERMINISTIC VALIDATION</small><h3>'+(accepted?'PRIMARY EPIC ACCEPTED BY MANAGEMENT':proposalsBound?'BOUNDED PROPOSAL READY FOR MANAGEMENT REVIEW':'PROPOSAL CONTEXT MISMATCH · FAIL CLOSED')+'</h3><div class="ns-composer-checks">'+managementChecks.map(([name,status,note],i)=>{const actual=i===0?(proposalsBound?'PASS':'FAIL'):status;return '<article><div><strong>'+esc(name)+'</strong><span>'+esc(i===0?(proposalsBound?'Every proposed Epic remains bound to the exact current CAR outcome and scope.':'Proposal context does not match the selected authorization outcome/scope.'):note)+'</span></div>'+badge(actual,actual==='PASS'?'green':'amber')+'</article>';}).join('')+'</div><p class="ns-composer-note">Composite AI proposes decomposition. Deterministic checks validate lineage, scope and structure. Management remains accountable for accepting work.</p></div>':'')+
      '<div class="ns-composer-actions">'+
        (proposed&&!accepted&&proposalsBound?'<button type="button" class="primary" data-management-accept>Accept primary Epic</button><button type="button" data-management-regenerate>Regenerate</button><button type="button" data-management-reject>Reject proposals</button>':proposed&&!accepted?'<button type="button" data-management-regenerate>Regenerate</button><button type="button" data-management-reject>Reject proposals</button>':'')+
        (accepted?'<button type="button" class="primary" data-view="handoff">Continue to Execution Handoff</button><button type="button" data-management-regenerate>Regenerate</button>':'')+
      '</div>'+
      (accepted&&state.acceptedEpic?'<div class="ns-mc-accepted"><strong>MANAGEMENT ACCEPTED</strong><span>'+esc(state.acceptedEpic.epic)+' · '+esc(state.acceptedEpic.title)+'</span><small>Acceptance creates a bounded candidate for BHP generation. It does not write to an external backlog.</small></div>':'')+
    '</section>';
  }

  function management() {
    const s=selectedFeedback();
    const ctx=selectedOkrContext();
    const primary=selectedAuthorization()||{authorized:false,decision:'NO DECISION',carId:null};
    return headline(primary.authorized?'Translate authorized intent into bounded delivery.':'No authorized product-intent handoff exists.',
      'Management carries the outcome, constraints and evidence requirements into execution. Composite AI may propose Epics, but it cannot accept work or widen the CAR.',
      'MANAGEMENT LENS')+
      kv([
        ['Decision state', badge(primary.decision,primary.authorized?'green':'blue')],
        ['Capability Authorization Record', primary.carId?'<code>'+esc(primary.carId)+'</code>':'No CAR emitted'],
        ['Selected outcome', esc(ctx.objective.objectiveId+' → '+ctx.kr.id+' · '+ctx.kr.text)],
        ['Management owner', esc(model.manager)],
        ['Assigned team', esc(model.team)],
        ['Delivery system', esc(model.backlog)],
        ['Delivery state', badge(s.delivery,'blue')],
        ['Accepted Epic', managementAcceptanceCurrent()?'<code>'+esc(state.acceptedEpic.epic)+'</code> · '+esc(state.acceptedEpic.title):'None · management review required']
      ])+
      '<div class="ns-grid-3"><article><small>DEPENDENCY</small><h3>'+(primary.authorized?'Accepted CAR binding':'Authorization required')+'</h3><p>'+(primary.authorized?'AI and management cannot silently widen or replace the authorized outcome.':'Management cannot promote candidate work without a current CAR.')+'</p></article><article><small>TRANSLATION</small><h3>Composite AI assisted</h3><p>Objective → KR → CAR becomes candidate outcome-oriented Epics with reuse checks.</p></article><article><small>CONSTRAINT</small><h3>No live writeback</h3><p>Accepting an Epic creates no Jira, GitHub or Azure DevOps work item.</p></article></div>'+
      managementComposer();
  }

  function decisionContextFor(ctx, record) {
    const item=ctx.authorization;
    const deferred=record.decision==='DEFERRED';
    const reuse=record.decision==='REUSE EXISTING';
    const authorized=record.authorized;
    return {
      evidenceLabel: deferred?'MEDIUM EVIDENCE':authorized||reuse?'HIGH EVIDENCE':'HIGH EVIDENCE',
      evidenceTone: deferred?'amber':'green',
      profile: item.owner+' · '+item.productOwner+' · synthetic scoped decision profile',
      profileRule: 'Scope is limited to '+item.objectiveId+' → '+item.krId+'; profile or decision-context changes require renewed accountable review.',
      capability: deferred
        ? 'Capability need identified · decision evidence insufficient'
        : reuse
          ? 'Accepted-product reuse path selected · no new product CAR'
          : item.outcome,
      portfolio: 'Scope: '+item.scope+' · Environments: '+item.environments+'. Existing-product and dependency context must be checked before new productization.',
      investment: deferred
        ? 'No new product investment should advance while outcome, baseline, target or evidence are insufficient.'
        : reuse
          ? 'Reuse avoids duplicate product lifecycle/TCO unless new evidence proves the accepted product is insufficient.'
          : 'Compare reuse versus lifecycle/TCO, duplication risk and expected benefit before expanding net-new productization.',
      benefit: 'Expected benefit must be measured against '+ctx.kr.id+' — '+ctx.kr.text+' Delivery completion alone cannot prove that outcome.',
      evidence: item.evidence+' · '+(deferred?'insufficient for authorization':reuse?'supports reuse/equivalence decision':authorized?'current authorized decision evidence':'assembled for accountable confirmation'),
      changeEvidence: deferred
        ? 'A clearer outcome, baseline, target and accountable evidence source would be required before authorization can be reconsidered.'
        : reuse
          ? 'Evidence that the accepted product is not equivalent or cannot satisfy the outcome would justify reopening the productization decision.'
          : 'If an existing governed product already satisfies the requested outcome, new productization should be reconsidered.'
    };
  }

  function decision() {
    const ctx=selectedOkrContext();
    if(!ctx.authorization)return headline(ctx.kr.text,
      'This selected Key Result has no bound authorization decision in the synthetic fixture. Leadership can inspect the outcome, but Northstar will not invent a decision record or downstream authority.',
      ctx.objective.objectiveId+' → '+ctx.kr.id+' · NO AUTHORIZATION DECISION')+
      '<div class="ns-boundary-box"><strong>Fail closed:</strong> establish an explicit decision/CAR contract before representing product-intent authorization.</div>';
    const record=selectedAuthorization();
    const dc=decisionContextFor(ctx,record);
    return headline(ctx.authorization.outcome,
      'Leadership sees the mission consequence, organizational scope, reuse context, investment assumptions, evidence quality and credible choices without having to translate infrastructure implementation jargon.',
      ctx.authorization.decisionId+' · DECISION BRIEF')+
      '<div class="ns-state-row">'+badge(record.decision,record.authorized?'green':'blue')+badge(record.authorization,record.authorized?'green':'amber')+badge(dc.evidenceLabel,dc.evidenceTone)+badge('REVIEW '+model.decisionReview,'neutral')+'</div>'+
      '<div class="ns-section-title"><div><small>CONTEXT BEFORE DECISION</small><h3>Synthetic decision context</h3></div><span>Context informs · humans authorize</span></div>'+
      '<div class="ns-grid-3">'+
        '<article><small>ORGANIZATIONAL PROFILE</small><h3>'+esc(dc.profile)+'</h3><p>'+esc(dc.profileRule)+'</p></article>'+
        '<article><small>CAPABILITY + REUSE</small><h3>'+esc(dc.capability)+'</h3><p>'+esc(dc.portfolio)+'</p></article>'+
        '<article><small>INVESTMENT + TCO</small><h3>Illustrative decision assumption</h3><p>'+esc(dc.investment)+'</p></article>'+
      '</div>'+
      '<div class="ns-grid-2">'+
        '<article><small>EVIDENCE + CONFIDENCE</small><h3>'+esc(dc.evidence)+'</h3><p>Evidence can inform the recommendation, but it cannot create funding, staffing, risk, deployment or provisioning authority.</p></article>'+
        '<article><small>EXPECTED BENEFIT</small><h3>'+esc(dc.benefit)+'</h3><p>Observed outcome evidence returns later; backlog completion is only an execution signal.</p></article>'+
      '</div>'+
      '<div class="ns-boundary-box"><strong>Synthetic demo boundary:</strong> these profile, capability, investment/TCO and portfolio inputs are fixtures. The public demo does not claim live organizational profiles, live cost feeds, enterprise adapters, funding authority, procurement authority, risk acceptance or cloud execution.</div>'+
      '<div class="ns-section-title"><div><small>ACCOUNTABLE CHOICES</small><h3>Reuse, build, phase, defer or redirect</h3></div><span>Decision ≠ execution authority</span></div>'+
      '<div class="ns-options">'+model.alternatives.map(([name,meaning,consequence]) =>
        '<article><small>'+esc(name.toUpperCase())+'</small><h3>'+esc(meaning)+'</h3><p>'+esc(consequence)+'</p></article>'
      ).join('')+'</div>'+
      '<div class="ns-grid-2">'+
        '<article class="ns-callout amber"><small>NO ACTION</small><h3>What happens?</h3><p>The selected outcome remains unresolved and no new product-intent authority is created.</p></article>'+
        '<article class="ns-callout"><small>EVIDENCE THAT WOULD CHANGE THE ASSESSMENT</small><h3>Decision-changing evidence</h3><p>'+esc(dc.changeEvidence)+'</p></article>'+
      '</div>'+
      '<div class="ns-rail-proof"><small>PRESERVED LINEAGE</small><div><b>Org profile</b><span>→</span><b>'+esc(ctx.objective.objectiveId)+'</b><span>→</span><b>'+esc(ctx.kr.id)+'</b><span>→</span><b>'+esc(ctx.authorization.decisionId)+'</b><span>→</span><b>'+(record.carId?esc(record.carId):'No CAR')+'</b></div></div>';
  }

  function authorizationDecision(item) {
    const override=state.authorizationDecisions[item.decisionId];
    if(override)return override;
    if(item.decisionId===model.decisionId)return current().decision;
    return item.initialDecision;
  }

  function authorizationRecord(item) {
    const decision=authorizationDecision(item);
    const receipt=state.authorizationReceipts[item.decisionId];
    const pkg=authorizationPackage(item,decision);
    const decisionEligible=decision==='APPROVED'||decision==='APPROVE CONDITIONALLY';
    const receiptCurrent=Boolean(
      receipt&&receipt.confirmed&&
      receipt.decision===decision&&
      receipt.evidenceDigest===pkg.evidenceDigest&&
      receipt.packageId===pkg.packageId
    );
    const authorized=decisionEligible&&receiptCurrent;
    return {
      decision,
      authorized,
      carId:authorized ? receipt.carId : null,
      authorization:authorized?'CURRENT':decision==='REUSE EXISTING'?'NO NEW CAR':decisionEligible?'PENDING CONFIRMATION':'NOT AUTHORIZED'
    };
  }

  function stableDigest(value) {
    let h=2166136261;
    for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}
    return 'sha256:demo-'+(h>>>0).toString(16).padStart(8,'0')+'-'+value.length.toString(16).padStart(4,'0');
  }

  function authorizationPackage(item,decision) {
    const material=[
      item.decisionId,item.objectiveId,item.krId,item.outcome,item.scope,item.environments,
      item.productOwner,item.owner,item.evidence,decision
    ].join('|');
    return {
      packageId:'AUTH-PKG-'+item.decisionId.split('-')[1],
      evidenceDigest:stableDigest(material),
      approver:'Division Leader · synthetic accountable role',
      reviewDate:model.carReview,
      decision
    };
  }

  function authorizationEligibility(item) {
    const decision=authorizationDecision(item);
    if(decision==='REUSE EXISTING')return {eligible:false,reason:'Reuse decision does not authorize a new product-intent CAR.'};
    if(decision==='DEFERRED')return {eligible:false,reason:'Deferred item requires stronger outcome/evidence definition before authorization.'};
    return {eligible:true,reason:'Eligible for accountable product-intent confirmation.'};
  }

  function openAuthorizationCeremony(ids,opener) {
    const unique=[...new Set(ids)].filter(id=>authorizationQueue.some(item=>item.decisionId===id));
    if(!unique.length)return;
    state.authorizationCeremonyIds=unique;
    state.authorizationCeremonyOpener=opener||null;
    const rows=unique.map(id=>{
      const item=authorizationQueue.find(candidate=>candidate.decisionId===id);
      const eligibility=authorizationEligibility(item);
      const decision=authorizationDecision(item);
      const pkg=authorizationPackage(item,decision);
      return '<article class="ns-ceremony-item '+(eligibility.eligible?'eligible':'blocked')+'" data-ceremony-item="'+esc(id)+'">'+
        '<div><small>'+esc(item.objectiveId)+' → '+esc(item.krId)+' · '+esc(item.decisionId)+'</small><h3>'+esc(item.outcome)+'</h3><p>'+esc(item.scope)+'</p></div>'+
        '<div class="ns-ceremony-proof"><strong class="ns-ceremony-status '+(eligibility.eligible?'green':'amber')+'">'+esc(decision.replaceAll('_',' '))+'</strong>'+
          '<span><b>Evidence digest</b><code>'+esc(pkg.evidenceDigest)+'</code></span>'+
          '<span><b>Approver</b>'+esc(pkg.approver)+'</span>'+
          '<span><b>Review</b>'+esc(pkg.reviewDate)+'</span>'+
          '<span><b>Result</b>'+(eligibility.eligible?'Separate CAR after confirmation':esc(eligibility.reason))+'</span>'+
        '</div></article>';
    }).join('');
    const eligible=unique.filter(id=>authorizationEligibility(authorizationQueue.find(item=>item.decisionId===id)).eligible);
    $('ns-authorization-ceremony-content').innerHTML=
      '<div class="ns-ceremony-summary"><strong>'+eligible.length+' of '+unique.length+' selected item'+(unique.length===1?'':'s')+' eligible</strong><span>Each eligible item is confirmed and recorded independently. Selection never creates one blanket CAR.</span></div>'+
      rows+
      '<div class="ns-denied"><h3>Still not granted</h3>'+model.authorityDenied.map(x=>'<span>× '+esc(x)+'</span>').join('')+'</div>'+
      '<div class="ns-ceremony-actions"><button type="button" data-close-authorization-ceremony>Cancel</button><button type="button" class="primary" data-confirm-authorization '+(eligible.length?'':'disabled')+'>Confirm '+eligible.length+' eligible item'+(eligible.length===1?'':'s')+'</button></div>';
    const dialog=$('ns-authorization-ceremony-dialog');
    if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
    const focus=dialog.querySelector('[data-confirm-authorization]:not([disabled]),[data-close-authorization-ceremony]');
    if(focus)focus.focus();
  }

  function closeAuthorizationCeremony() {
    const dialog=$('ns-authorization-ceremony-dialog');
    if(dialog.open&&typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');
    const opener=state.authorizationCeremonyOpener;
    state.authorizationCeremonyOpener=null;
    state.authorizationCeremonyIds=[];
    if(opener&&typeof opener.focus==='function')opener.focus();
  }

  function confirmAuthorizationCeremony() {
    const ids=state.authorizationCeremonyIds||[];
    ids.forEach(id=>{
      const item=authorizationQueue.find(candidate=>candidate.decisionId===id);
      if(!item||!authorizationEligibility(item).eligible)return;
      const decision=authorizationDecision(item);
      const pkg=authorizationPackage(item,decision);
      state.authorizationDecisions[id]=decision==='APPROVE CONDITIONALLY'?'APPROVE CONDITIONALLY':'APPROVED';
      state.authorizationReceipts[id]={
        packageId:pkg.packageId,
        evidenceDigest:pkg.evidenceDigest,
        approver:pkg.approver,
        reviewDate:pkg.reviewDate,
        decision:state.authorizationDecisions[id],
        carId:item.carId||('CAR-'+item.decisionId.split('-')[1]),
        confirmed:true
      };
    });
    ids.forEach(invalidateManagementForAuthorization);
    closeAuthorizationCeremony();
    state.selectedAuthorizationIds=[];
    const selectedCtx=selectedOkrContext();
    const selectedRecord=selectedAuthorization();
    const returnToManagement=Boolean(selectedCtx.authorization&&ids.includes(selectedCtx.authorization.decisionId)&&state.authorizationReturnView==='management'&&selectedRecord&&selectedRecord.authorized);
    state.authorizationReturnView=null;
    state.role=returnToManagement?'manager':state.role;
    state.view=returnToManagement?'management':'authorization';
    render();
  }

  function authorization() {
    const selected=authorizationQueue.find(item=>item.decisionId===state.selectedAuthorizationId)||authorizationQueue[0];
    const selectedRecord=authorizationRecord(selected);
    const selectedSet=new Set(state.selectedAuthorizationIds);
    const cards=authorizationQueue.map(item=>{
      const record=authorizationRecord(item);
      const eligibility=authorizationEligibility(item);
      const selectedClass=item.decisionId===selected.decisionId?' selected':'';
      const tone=record.authorized?'green':record.decision==='DEFERRED'?'amber':'blue';
      const receipt=state.authorizationReceipts[item.decisionId];
      const receiptCurrent=Boolean(receipt&&record.authorized);
      return '<article class="ns-auth-card'+selectedClass+'" data-auth-item="'+esc(item.decisionId)+'">'+
        '<div class="ns-auth-select-row"><label><input type="checkbox" data-auth-check="'+esc(item.decisionId)+'" '+(selectedSet.has(item.decisionId)?'checked':'')+'> Select for review</label><span>'+esc(eligibility.eligible?'ELIGIBLE':'INDIVIDUAL REVIEW')+'</span></div>'+
        '<div class="ns-auth-card-head"><div><small>'+esc(item.objectiveId)+' → '+esc(item.krId)+'</small><h3>'+esc(item.outcome)+'</h3></div>'+badge(record.decision,tone)+'</div>'+
        '<div class="ns-auth-meta"><span>'+esc(item.decisionId)+'</span><span>'+(record.carId?esc(record.carId):(eligibility.eligible?'CAR NOT CONFIRMED':record.decision==='REUSE EXISTING'?'REUSE · NO NEW CAR':'DEFERRED · NO CAR'))+'</span><span>'+esc(item.owner)+'</span></div>'+
        '<p>'+esc(item.scope)+'</p>'+
        (receiptCurrent?'<div class="ns-auth-receipt"><strong>CONFIRMED</strong><span>'+esc(receipt.packageId)+' · '+esc(receipt.evidenceDigest)+'</span></div>':'')+
        '<button type="button" data-auth-select="'+esc(item.decisionId)+'">Review item</button>'+
      '</article>';
    }).join('');
    const pendingCar=authorizationQueue.filter(item=>{const r=authorizationRecord(item);return authorizationEligibility(item).eligible&&!r.authorized;}).length;
    const authorizedCount=authorizationQueue.filter(item=>authorizationRecord(item).authorized).length;
    const selectedItems=authorizationQueue.filter(item=>selectedSet.has(item.decisionId));
    const selectedEligible=selectedItems.filter(item=>authorizationEligibility(item).eligible);

    return headline(
      'Leadership Decision Workspace',
      'Work the decision portfolio without turning multi-select into blanket authority. Northstar evaluates each selected item independently and emits a separate bounded record only after accountable confirmation.',
      'LEADERSHIP DECISION WORKSPACE'
    )+
    '<div class="ns-auth-summary"><article><small>QUEUE ITEMS</small><strong>'+authorizationQueue.length+'</strong><span>Independent decisions</span></article><article><small>AUTHORIZED</small><strong>'+authorizedCount+'</strong><span>Current bounded product-intent records</span></article><article><small>NEEDS CAR CONFIRMATION</small><strong>'+pendingCar+'</strong><span>Approved or conditional decisions awaiting exact package confirmation</span></article></div>'+
    '<div class="ns-batch-bar"><div><small>SELECTED FOR REVIEW</small><strong>'+selectedItems.length+' item'+(selectedItems.length===1?'':'s')+'</strong><span>'+selectedEligible.length+' eligible for authorization · '+(selectedItems.length-selectedEligible.length)+' require individual handling</span></div><button type="button" data-review-selected '+(selectedItems.length?'':'disabled')+'>Review selected</button></div>'+
    '<div class="ns-auth-layout"><div class="ns-auth-list">'+cards+'</div>'+
    '<section class="ns-auth-detail" aria-label="Selected authorization item">'+
      '<div class="ns-auth-detail-head"><div><small>SELECTED ITEM · '+esc(selected.decisionId)+'</small><h3>'+esc(selected.outcome)+'</h3></div>'+badge(selectedRecord.authorization,selectedRecord.authorized?'green':'amber')+'</div>'+
      kv([
        ['Decision', badge(selectedRecord.decision,selectedRecord.authorized?'green':'blue')],
        ['Capability Authorization Record', selectedRecord.carId?'<code>'+esc(selectedRecord.carId)+'</code>':authorizationEligibility(selected).eligible?'Not confirmed · review exact authorization package':selectedRecord.decision==='REUSE EXISTING'?'No new CAR · reuse path':'No CAR · deferred'],
        ['Strategic lineage', esc(selected.objectiveId+' → '+selected.krId)],
        ['Approved / evaluated scope', esc(selected.scope)],
        ['Allowed environments', esc(selected.environments)],
        ['Product owner', esc(selected.productOwner)],
        ['Benefit / decision owner', esc(selected.owner)],
        ['Required evidence', esc(selected.evidence)]
      ])+
      '<div class="ns-auth-actions" aria-label="Synthetic decision actions">'+
        ((selected.decisionId==='CPD-0003'||selected.decisionId==='CPD-0004')
          ? '<div class="ns-boundary-box"><strong>Seeded decision fixture.</strong> This example is intentionally locked to '+esc(selectedRecord.decision)+' so reuse and insufficient-evidence paths cannot masquerade as authorized CARs.</div>'
          : '<button type="button" data-auth-action="conditional" data-auth-id="'+esc(selected.decisionId)+'">Approve conditionally</button>'+
            '<button type="button" data-auth-action="approve" data-auth-id="'+esc(selected.decisionId)+'">Approve</button>'+
            '<button type="button" data-auth-action="reuse" data-auth-id="'+esc(selected.decisionId)+'">Reuse existing</button>'+
            '<button type="button" data-auth-action="defer" data-auth-id="'+esc(selected.decisionId)+'">Defer</button>'+
            '<button type="button" class="primary" data-authorize-item="'+esc(selected.decisionId)+'" '+(authorizationEligibility(selected).eligible?'':'disabled')+'>Review authorization package</button>')+
      '</div>'+
      '<div class="ns-boundary-box"><strong>Decision is not execution authority.</strong> The authorization ceremony binds the exact product intent, evidence digest, accountable role and review date. It still does not grant spending, risk, deployment, provisioning or cloud mutation authority.</div>'+
      '<div class="ns-denied"><h3>Not granted by a Northstar CAR</h3>'+model.authorityDenied.map(x=>'<span>× '+esc(x)+'</span>').join('')+'</div>'+
    '</section></div>'+
    '<div class="ns-auth-mechanics"><small>HOW AUTHORIZATION ACTUALLY WORKS</small><div><article><b>1</b><strong>Evidence ready</strong><span>Northstar assembles the exact outcome, alternatives, scope and evidence.</span></article><article><b>2</b><strong>Human decision</strong><span>An accountable organizational approver chooses approve, conditional approval, reuse or defer.</span></article><article><b>3</b><strong>Exact package confirmed</strong><span>The human sees scope, evidence digest, accountable role, review date and exclusions before confirmation.</span></article><article><b>4</b><strong>Separate CAR per item</strong><span>Each eligible decision receives its own bounded CAR; multi-select never merges authority.</span></article><article><b>5</b><strong>Separate execution authority</strong><span>Deployment, provisioning, risk acceptance and other privileged actions still require their own authorized controls.</span></article></div></div>';
  }

  function selectedEvidenceRecords() {
    const ctx=selectedOkrContext();
    if(ctx.objective.objectiveId===model.objectiveId&&ctx.kr.id===model.krId)return model.evidence;
    const rows=[
      ['Key Result',ctx.kr.source||'No evidence source defined','OPERATIONAL CONTEXT','HIGH','CURRENT',ctx.objective.objectiveId+' → '+ctx.kr.id+' · '+ctx.kr.text]
    ];
    if(ctx.authorization){
      const record=selectedAuthorization();
      rows.unshift([
        'Authorization',
        ctx.authorization.decisionId+' decision/CAR binding',
        record&&record.authorized?'DEMONSTRATED':'DECISION CONTEXT',
        'HIGH',
        record&&record.authorized?'CURRENT':(record?record.authorization:'NOT AUTHORIZED'),
        record&&record.authorized
          ? ctx.authorization.decisionId+' and '+record.carId+' preserve the bounded authorization evidence for '+ctx.kr.id+'.'
          : ctx.authorization.decisionId+' has no current CAR for '+ctx.kr.id+'; no downstream authority is inferred.'
      ]);
      if(record&&record.authorized){
        rows.push(['Product',ctx.authorization.evidence,'DEMONSTRATED','HIGH','CURRENT',ctx.authorization.outcome+' · '+ctx.authorization.scope]);
      }else if(record&&record.decision==='REUSE EXISTING'){
        rows.push(['Product',ctx.authorization.evidence,'EVALUATED','HIGH','CURRENT','Reuse evidence supports the decision to use an existing governed product; no new product CAR or build authority is inferred.']);
      }else if(record&&record.decision==='DEFERRED'){
        rows.push(['Product',ctx.authorization.evidence,'NOT DEMONSTRATED','MEDIUM','INSUFFICIENT','Evidence is explicitly insufficient to authorize '+ctx.authorization.outcome+'; the decision remains deferred and no product proof is claimed.']);
      }else{
        rows.push(['Product',ctx.authorization.evidence,'DECISION CONTEXT','HIGH','PENDING','Evidence is assembled for accountable review but is not demonstrated as authorized product proof until the exact package is confirmed.']);
      }
    }else{
      rows.unshift(['Authorization','No authorization decision bound','NOT DEMONSTRATED','HIGH','UNAVAILABLE','No decision/CAR evidence is defined for '+ctx.objective.objectiveId+' → '+ctx.kr.id+'.']);
    }
    const feedback=selectedFeedback();
    rows.push(['Outcome',feedback.benefitSource,'OPERATIONAL CONTEXT','HIGH',feedback.benefitOutcome==='UNAVAILABLE'?'UNAVAILABLE':'CURRENT',ctx.kr.id+' delivery '+feedback.delivery.replaceAll('_',' ')+' · outcome '+feedback.benefitOutcome.replaceAll('_',' ')]);
    if(managementAcceptanceCurrent()&&state.acceptedEpic){
      rows.push(['Delivery','Management acceptance binding','DEMONSTRATED','HIGH','CURRENT',state.acceptedEpic.epic+' · '+state.acceptedEpic.title+' remains bound to the selected authorization context.']);
    }
    return rows;
  }

  function evidence() {
    const ctx=selectedOkrContext(), records=selectedEvidenceRecords();
    return headline('Show the evidence. Keep the distinctions.',
      'Northstar correlates evidence for '+ctx.objective.objectiveId+' → '+ctx.kr.id+' without turning profile keywords, commit counts or assessments into a hidden employee score.',
      'EVIDENCE EXPLORER')+
      '<div class="ns-evidence-note">SELF-DECLARED ≠ ASSESSED ≠ DEMONSTRATED · CAPABILITY ≠ AVAILABILITY</div>'+
      '<div class="ns-evidence">'+records.map(([subject,source,cls,confidence,freshness,statement]) =>
        '<article><div class="ns-evidence-top"><small>'+esc(subject.toUpperCase())+'</small><span>'+esc(source)+'</span></div>'+
        '<h3>'+esc(statement)+'</h3><div class="ns-state-row">'+badge(cls,'blue')+badge(confidence+' CONFIDENCE',confidence==='HIGH'?'green':'amber')+badge(freshness,'neutral')+'</div></article>'
      ).join('')+'</div>';
  }

  const backlogAdapters={
    jira:{label:'Jira',project:'CLOUD',type:'Epic'},
    ado:{label:'Azure DevOps',project:'Cloud Platform',type:'Epic'},
    github:{label:'GitHub Issues',project:'Infrastructure Product Works',type:'Issue'}
  };

  function handoffPackage() {
    if(!managementAcceptanceCurrent())return null;
    const bindings=state.acceptedEpic.authorizationBindings||[];
    if(!bindings.length)return null;
    const adapter=backlogAdapters[state.handoffTarget];
    const lineage=bindings.map(b=>b.objectiveId+' → '+b.krId+' → '+b.decisionId+' → '+b.carId);
    const material=[...lineage,state.acceptedEpic.epic,state.acceptedEpic.title,state.acceptedEpic.managementIntent,adapter.label,adapter.project,'Retain independent source CAR bindings','Evidence required before outcome claim'].join('|');
    return {id:'BHP-0001',carIds:bindings.map(b=>b.carId),lineage,sourceBindings:bindings.map(b=>({...b})),epic:state.acceptedEpic.epic,epicTitle:state.acceptedEpic.title,managementIntent:state.acceptedEpic.managementIntent,target:adapter.label,project:adapter.project,workItemType:adapter.type,digest:stableDigest(material+'|'+state.acceptedEpic.id),status:state.handoffConfirmed?'HANDOFF CONFIRMED':'AWAITING HUMAN HANDOFF'};
  }

  function invalidateHandoff(){state.handoffConfirmed=false;state.handoffReceipt=null;}

  function handoff() {
    const s=selectedFeedback(), ctx=selectedOkrContext(), primary=selectedAuthorization()||{authorized:false,authorization:'NOT AUTHORIZED'}, sourceBindings=managementSourceBindings(), pkg=handoffPackage();
    if(!pkg&&sourceBindings.length)return headline('Management acceptance required.','Current source CAR bindings exist, but Northstar will not create BHP-0001 until management accepts a deterministically validated Epic proposal for that exact source set.','EXECUTION HANDOFF')+'<div class="ns-boundary-box"><strong>Fail closed:</strong> Return to Management, review the Composite AI proposal and explicitly accept an Epic before handoff.</div>';
    if(!pkg)return headline('No authorized backlog handoff exists.','A candidate Epic may remain visible as planning context, but Northstar cannot create a handoff package until at least one exact source Capability Authorization Record is current and selected.','EXECUTION HANDOFF')+
      '<div class="ns-airlock"><article><small>STRATEGY</small><h3>'+esc(ctx.objective.objectiveId)+' → '+esc(ctx.kr.id)+'</h3><p>Page context remains visible, but it does not substitute for an accepted source binding.</p></article><b>→</b><article><small>AUTHORIZATION</small><h3>NO CURRENT SOURCE CAR</h3><p>'+esc(primary.authorization.replaceAll('_',' '))+'</p></article><b>→</b><article><small>DELIVERY</small><h3>BLOCKED</h3><p>No authorized handoff package.</p></article></div>'+
      '<div class="ns-boundary-box"><strong>Fail closed:</strong> Northstar will not represent backlog write authority without current source CAR bindings and a separately confirmed management handoff package.</div>';
    const targets=Object.entries(backlogAdapters).map(([id,a])=>'<button type="button" data-handoff-target="'+id+'" class="'+(state.handoffTarget===id?'active':'')+'" aria-pressed="'+(state.handoffTarget===id?'true':'false')+'"><strong>'+esc(a.label)+'</strong><span>'+esc(a.project)+'</span></button>').join('');
    return headline('Turn authorized intent into an executable handoff.','Northstar proposes a bounded backlog package while keeping strategy authority separate from permission to write into an execution system.','EXECUTION HANDOFF · '+pkg.id)+
      '<div class="ns-airlock"><article><small>STRATEGY</small><h3>'+esc(pkg.sourceBindings.map(b=>b.objectiveId+' → '+b.krId).join(' + '))+'</h3><p>'+esc(pkg.managementIntent)+'</p></article><b>→</b><article><small>AUTHORIZATION</small><h3>'+esc(pkg.carIds.join(' + '))+'</h3><p>Independent current product-intent authorizations.</p></article><b>→</b><article><small>HANDOFF PACKAGE</small><h3>'+esc(pkg.id)+'</h3><p>'+esc(pkg.status.replaceAll('_',' '))+'</p></article></div>'+
      '<section class="ns-handoff-workspace"><div class="ns-handoff-targets"><small>1 · CHOOSE EXECUTION TARGET</small><h3>Adapter boundary</h3><p>These are bounded demo contracts, not live connections.</p><div>'+targets+'</div></div>'+
      '<div class="ns-handoff-package"><small>2 · REVIEW PROPOSED PACKAGE</small><h3>'+esc(pkg.epic)+' · '+esc(pkg.epicTitle)+'</h3>'+kv([['Target system',esc(pkg.target)],['Target project',esc(pkg.project)],['Work item type',esc(pkg.workItemType)],['Source authorizations',pkg.carIds.map(id=>'<code>'+esc(id)+'</code>').join(' + ')],['Strategic lineage',esc(pkg.lineage.join(' · '))],['Management intent',esc(pkg.managementIntent)],['Package digest','<code>'+esc(pkg.digest)+'</code>'],['Acceptance outcome','The Epic retains every selected KR/CAR binding without merging authority.'],['Evidence requirement','Delivery evidence may update progress; benefit evidence is measured separately per source KR.']])+
      '<div class="ns-handoff-actions"><button type="button" data-confirm-handoff '+(state.handoffConfirmed?'disabled':'')+'>'+(state.handoffConfirmed?'Handoff confirmed':'Confirm human handoff')+'</button></div></div></section>'+
      (state.handoffReceipt?'<div class="ns-handoff-receipt"><small>3 · IMMUTABLE HANDOFF RECEIPT</small><h3>'+esc(state.handoffReceipt.id)+' · '+esc(state.handoffReceipt.status.replaceAll('_',' '))+'</h3><p>'+esc(state.handoffReceipt.target)+' / '+esc(state.handoffReceipt.project)+' · '+esc(state.handoffReceipt.digest)+'</p><strong>No external write occurred.</strong> This synthetic receipt demonstrates the authority boundary that a live adapter would have to satisfy.</div>':'')+
      '<div class="ns-boundary-box"><strong>Demo boundary:</strong> Confirming '+esc(pkg.id)+' authorizes only this synthetic handoff record. External backlog writeback is not enabled. Jira, Azure DevOps or GitHub credentials and write permission would require a separately authorized live adapter contract.</div>'+
      '<div class="ns-handoff-feedback"><small>FEEDBACK LOOP</small><div><article><strong>Delivery progress</strong><span>'+esc(s.delivery.replaceAll('_',' '))+'</span></article><b>≠</b><article><strong>Benefit achieved</strong><span>'+esc(s.benefitOutcome.replaceAll('_',' '))+'</span></article></div><p>Backlog completion can inform delivery progress. It cannot prove the business outcome by itself.</p></div>';
  }

  function outcome() {
    const s=selectedFeedback(), ctx=selectedOkrContext();
    const isPrimary=ctx.objective.objectiveId===model.objectiveId&&ctx.kr.id===model.krId;
    const deliveryLabel=managementAcceptanceCurrent()&&state.acceptedEpic?state.acceptedEpic.epic:'Selected KR';
    return headline('Did the product deliver the expected benefit?',
      'This view is downstream feedback for '+ctx.objective.objectiveId+' → '+ctx.kr.id+'. It keeps delivery activity separate from observed benefit and does not re-score authorization status.',
      'DOWNSTREAM BENEFIT FEEDBACK')+
      '<div class="ns-truth large">'+
        '<article><small>DELIVERY SIGNAL</small><h3>'+esc(s.delivery.replaceAll('_',' '))+'</h3><p>'+esc(deliveryLabel)+' delivery evidence.</p></article>'+
        '<article><small>BENEFIT MEASUREMENT</small><h3>'+esc(s.benefitMeasurement.replaceAll('_',' '))+'</h3><p>'+esc(s.benefitSource)+'</p></article>'+
      '</div>'+
      kv([
        ['Benefit baseline', isPrimary?'No authoritative post-delivery benefit observation yet':'Selected KR portfolio baseline'],
        ['Benefit target', isPrimary?'Observe adoption and cycle-time feedback after product availability':'Track the selected KR against its named evidence source'],
        ['Current benefit', badge(s.benefitOutcome,(s.benefitOutcome==='UNKNOWN'||s.benefitOutcome==='UNAVAILABLE'||s.benefitOutcome==='AT RISK')?'amber':'green')],
        ['Accountable benefit role', esc(ctx.kr.owner||model.leader)]
      ])+
      '<div class="ns-boundary-box">'+
        ((s.benefitMeasurement==='UNKNOWN'||s.benefitMeasurement==='UNAVAILABLE')
          ? '<strong>No benefit claim yet.</strong> Delivery may be complete, but downstream benefit remains unknown until the designated measurement arrives.'
          : '<strong>Feedback evidence available.</strong> The selected KR signal can inform investment learning without changing its authorization evidence.')+
      '</div>';
  }


  const recursiveLineageScenarios={
    current:{label:'Current lineage'},
    wrongKr:{label:'Wrong KR replay'},
    stale:{label:'Stale revision'},
    expanded:{label:'Authority expansion'}
  };

  function recursiveLineageBoundTuple(){
    const ctx=lineageOkrContext();
    const item=ctx.authorization;
    const record=item?authorizationRecord(item):null;
    const receipt=item?state.authorizationReceipts[item.decisionId]:null;
    const authorized=Boolean(item&&record&&record.authorized&&receipt);
    const exactAcceptedBinding=authorized&&state.acceptedEpic&&Array.isArray(state.acceptedEpic.authorizationBindings)
      ? state.acceptedEpic.authorizationBindings.find(binding=>
          binding.objectiveId===ctx.objective.objectiveId&&binding.krId===ctx.kr.id&&binding.decisionId===item.decisionId&&
          binding.carId===record.carId&&binding.packageId===receipt.packageId&&binding.evidenceDigest===receipt.evidenceDigest)
      : null;
    const acceptedForSelected=Boolean(exactAcceptedBinding&&managementAcceptanceCurrent());
    const epic=acceptedForSelected?state.acceptedEpic.epic:'NO AUTHORIZED EPIC';
    const edge=acceptedForSelected?'CE-'+epic+'-'+ctx.kr.id:'NO CURRENT CONTRIBUTION EDGE';
    const car=authorized?record.carId:'NO CURRENT CAR';
    const product='NOT BOUND';
    const assurance='NOT EVALUATED';
    const scope=item?.scope||'NO AUTHORIZED SCOPE';
    const revision=receipt?.evidenceDigest||'NO CURRENT REVISION';
    const tuple={objectiveId:ctx.objective.objectiveId,krId:ctx.kr.id,decisionId:item?.decisionId||'NO DECISION',carId:car,carRevision:revision,epic,edge,scope,product,assurance,authorized:acceptedForSelected,assuranceBound:false};
    tuple.digest=stableDigest([tuple.objectiveId,tuple.krId,tuple.decisionId,tuple.carId,tuple.carRevision,tuple.epic,tuple.edge,tuple.scope,tuple.product,tuple.assurance].join('|'));
    return tuple;
  }

  function recursiveLineageCandidate(bound,scenario){
    const candidate={...bound};
    if(scenario==='wrongKr')candidate.krId=bound.krId==='KR10.1'?'KR9.4':'KR10.1';
    if(scenario==='stale')candidate.carRevision=bound.carRevision==='NO CURRENT REVISION'?'STALE-REVISION':bound.carRevision+'-stale';
    if(scenario==='expanded')candidate.scope=bound.scope+' + IAM administrator';
    candidate.edge=candidate.epic!=='NO AUTHORIZED EPIC'?'CE-'+candidate.epic+'-'+candidate.krId:bound.edge;
    candidate.digest=stableDigest([candidate.objectiveId,candidate.krId,candidate.decisionId,candidate.carId,candidate.carRevision,candidate.epic,candidate.edge,candidate.scope,candidate.product,candidate.assurance].join('|'));
    return candidate;
  }

  function recursiveLineageEvaluation(bound,candidate,scenario){
    if(scenario==='wrongKr'&&(candidate.krId!==bound.krId||candidate.edge!==bound.edge))return {result:'REJECTED',tone:'red',reason:'The candidate changes the target Key Result/contribution edge. Cross-KR replay cannot inherit the bound authorization.'};
    if(scenario==='stale'&&candidate.carRevision!==bound.carRevision)return {result:'REJECTED',tone:'red',reason:'The candidate carries a stale CAR revision/digest. Prior validity cannot silently carry forward.'};
    if(scenario==='expanded'&&candidate.scope!==bound.scope)return {result:'REJECTED',tone:'red',reason:'The candidate expands downstream scope beyond the parent CAR. Child authority may stay equal or narrow; never broaden.'};
    if(!bound.authorized)return {result:'PENDING AUTHORIZATION',tone:'amber',reason:'The selected OKR does not currently have the complete CAR → accepted Epic lineage required for downstream Assurance evaluation. Northstar fails closed.'};
    if(!bound.assuranceBound)return {result:'READY FOR ASSURANCE',tone:'amber',reason:'Strategy, CAR and accepted Epic lineage are exact, but no Assurance evidence record is bound. Northstar will not manufacture evidence from management acceptance.'};
    return {result:'VERIFIED',tone:'green',reason:'The displayed path is derived from the selected OKR, current exact authorization, accepted Epic and bound Assurance evidence.'};
  }

  function recursiveLineageNodes(candidate,ctx){
    return [
      {id:'objective',type:'OBJECTIVE',label:candidate.objectiveId,note:ctx.objective.objective},
      {id:'kr',type:'KEY RESULT',label:candidate.krId,note:state.lineageScenario==='wrongKr'?'Candidate replay target · selected KR definition is not inherited across coordinates':ctx.kr.text},
      {id:'decision',type:'DECISION',label:candidate.decisionId,note:'Selected decision context'},
      {id:'car',type:'CAPABILITY AUTHORIZATION',label:candidate.carId,note:candidate.carRevision},
      {id:'edge',type:'CONTRIBUTION EDGE',label:candidate.edge,note:candidate.epic+' → '+candidate.krId},
      {id:'epic',type:'EPIC',label:candidate.epic,note:'Accepted management decomposition required'},
      {id:'product',type:'INFRASTRUCTURE PRODUCT',label:candidate.product,note:candidate.scope},
      {id:'assurance',type:'ASSURANCE EVIDENCE',label:candidate.assurance,note:'Recursive evidence observation'}
    ];
  }

  function recursiveLineage(){
    const scenario=recursiveLineageScenarios[state.lineageScenario]?state.lineageScenario:'current';
    const ctx=lineageOkrContext();
    const bound=recursiveLineageBoundTuple();
    const candidate=recursiveLineageCandidate(bound,scenario);
    const evaluation=recursiveLineageEvaluation(bound,candidate,scenario);
    const nodes=recursiveLineageNodes(candidate,ctx);
    let focusIndex=nodes.findIndex(node=>node.id===state.lineageFocus);
    if(focusIndex<0){state.lineageFocus='objective';focusIndex=0;}
    const visible=nodes;
    const rejectedId=scenario==='wrongKr'?'kr':scenario==='stale'?'car':scenario==='expanded'?'product':null;
    const nodesHtml=visible.map((node,index)=>'<button type="button" class="ns-lineage-node '+(node.id===state.lineageFocus?'selected ':'')+(evaluation.result==='REJECTED'&&rejectedId===node.id?'rejected':'')+'" data-lineage-node="'+esc(node.id)+'" aria-pressed="'+(node.id===state.lineageFocus?'true':'false')+'"><small>'+esc(node.type)+'</small><strong>'+esc(node.label)+'</strong><span>'+esc(node.note)+'</span><em>'+esc(index<=4?'AUTHORITY / CONSTRAINTS ↓':'EVIDENCE / OBSERVATIONS ↑')+'</em></button>'+(index<visible.length-1?'<b class="ns-lineage-arrow" aria-hidden="true">'+(index<4?'↓':'↑')+'</b>':'')).join('');
    const controls=Object.entries(recursiveLineageScenarios).map(([id,item])=>'<button type="button" data-lineage-scenario="'+esc(id)+'" class="'+(scenario===id?'active':'')+'" aria-pressed="'+(scenario===id?'true':'false')+'">'+esc(item.label)+'</button>').join('');
    const approvedObjectives=okrPortfolio.filter(objective=>objective.approved);
    const objectiveRoots=approvedObjectives.map(objective=>'<button type="button" data-lineage-objective-root="'+esc(objective.objectiveId)+'" class="'+(objective.objectiveId===ctx.objective.objectiveId?'active':'')+'" aria-pressed="'+(objective.objectiveId===ctx.objective.objectiveId?'true':'false')+'"><strong>'+esc(objective.objectiveId)+'</strong><span>'+esc(objective.objective)+'</span></button>').join('');
    const krRoots=ctx.objective.krs.map(kr=>'<button type="button" data-lineage-kr="'+esc(kr.id)+'" data-lineage-objective="'+esc(ctx.objective.objectiveId)+'" class="'+(kr.id===ctx.kr.id?'active':'')+'" aria-pressed="'+(kr.id===ctx.kr.id?'true':'false')+'"><strong>'+esc(kr.id)+'</strong><span>'+esc(kr.text)+'</span></button>').join('');
    const breadcrumb=nodes.slice(0,focusIndex+1).map(node=>'<button type="button" data-lineage-node="'+esc(node.id)+'">'+esc(node.label)+'</button>').join('<span aria-hidden="true">›</span>');
    return headline('See why the work exists — and why the evidence is trusted.','Choose an approved Objective root, select one of its Key Results, then drill down or back up the exact bounded lineage. Assurance owns recursive evaluation semantics.','RECURSIVE LINEAGE · ASSURANCE')+
      '<section class="ns-lineage-root-picker" aria-label="Approved Objective nodes"><div class="ns-lineage-picker-head"><small>APPROVED OBJECTIVE NODES</small><strong>Select where to enter the lineage</strong></div><div class="ns-lineage-root-grid">'+objectiveRoots+'</div></section>'+
      '<section class="ns-lineage-kr-picker" aria-label="Key Results for selected Objective"><div class="ns-lineage-picker-head"><small>KEY RESULTS UNDER '+esc(ctx.objective.objectiveId)+'</small><strong>Choose the measurable contribution path</strong></div><div class="ns-lineage-kr-grid">'+krRoots+'</div></section>'+
      '<div class="ns-lineage-status '+esc(evaluation.tone)+'"><div><small>LINEAGE INTEGRITY</small><strong>'+esc(evaluation.result)+'</strong></div><p>'+esc(evaluation.reason)+'</p></div>'+
      '<div class="ns-lineage-controls" aria-label="Synthetic lineage scenarios">'+controls+'</div>'+
      '<div class="ns-lineage-toolbar"><div class="ns-lineage-breadcrumb" aria-label="Lineage breadcrumb">'+breadcrumb+'</div><div class="ns-lineage-actions"><button type="button" data-lineage-step="up" '+(focusIndex===0?'disabled':'')+'>Drill up</button><button type="button" data-lineage-step="down" '+(focusIndex===nodes.length-1?'disabled':'')+'>Drill down</button><button type="button" data-lineage-full>Show full path</button></div></div>'+
      '<div class="ns-lineage-layout"><section><div class="ns-lineage-flow" aria-label="Selectable recursive strategy to assurance lineage">'+nodesHtml+'</div></section>'+
      '<aside class="ns-lineage-proof"><small>SELECTED NODE</small><h3>'+esc(nodes[focusIndex].type)+' · '+esc(nodes[focusIndex].label)+'</h3><p>'+esc(nodes[focusIndex].note)+'</p><small>CANDIDATE PATH TUPLE</small><h3>'+esc(candidate.objectiveId)+' → '+esc(candidate.krId)+' → '+esc(candidate.decisionId)+' → '+esc(candidate.carId)+' → '+esc(candidate.edge)+'</h3>'+kv([
        ['Candidate digest','<code>'+esc(candidate.digest)+'</code>'],
        ['Bound digest','<code>'+esc(bound.digest)+'</code>'],
        ['Outcome measurement','Northstar · separate measurement contract'],
        ['Evidence integrity','Assurance · recursive geometry'],
        ['Authority rule','Child scope may remain equal or narrow; never broaden']
      ])+'<div class="ns-boundary-box"><strong>Current release:</strong> Northstar begins with approved Objectives and their Key Results. Strategic Outcome Management is not part of this release.</div></aside></div>'+
      (evaluation.result==='REJECTED'?'<div class="ns-lineage-rejection" role="status"><strong>Fail closed.</strong> '+esc(evaluation.reason)+'</div>':evaluation.result==='VERIFIED'?'<div class="ns-lineage-success" role="status"><strong>Verified path.</strong> The selected strategy, authorization, contribution, accepted Epic and evidence remain attributable to one bounded lineage.</div>':evaluation.result==='READY FOR ASSURANCE'?'<div class="ns-lineage-pending" role="status"><strong>Ready for Assurance evaluation.</strong> The upstream lineage is exact, but no Assurance evidence record is bound yet.</div>':'<div class="ns-lineage-pending" role="status"><strong>Awaiting exact authorization and accepted work.</strong> No downstream Assurance evidence is claimed for this selected path.</div>');
  }

  const renderers={okr:okrOverview,composer:composerView,leadership,management,decision,authorization,evidence,lineage:recursiveLineage,handoff,outcome};

  function setPressed(selector, selected) {
    document.querySelectorAll(selector).forEach(button => {
      const active = selected(button);
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function render() {
    setPressed('[data-view]', b=>b.dataset.view===state.view);
    setPressed('[data-role]', b=>b.dataset.role===state.role);
    setPressed('[data-scenario]', b=>b.dataset.scenario===state.scenario);
    const scoped = ['okr','composer','authorization'].includes(state.view) ? '' : scopeBanner();
    $('northstar-view').innerHTML=scoped+renderers[state.view]();
    $('scenario-state').textContent=current().label.toUpperCase();
    $('role-state').textContent=state.role==='leader'?'LEADERSHIP':state.role==='manager'?'MANAGEMENT':'DELIVERY';
  }

  function invalidateVisibleManagementDraft(intent) {
    const composer=intent.closest('.ns-management-composer');
    if(!composer)return;
    composer.querySelectorAll('.ns-mc-proposals,.ns-composer-step.validator,.ns-mc-accepted').forEach(node=>node.remove());
    const actions=composer.querySelector('.ns-composer-actions');
    if(actions)actions.innerHTML='';
    if(!composer.querySelector('.ns-mc-empty')){
      const input=composer.querySelector('.ns-mc-input');
      if(input){
        const fresh=document.createElement('div');
        fresh.className='ns-mc-empty';
        fresh.innerHTML='<h3>Ready to compose</h3><p>Composite AI will use the management intent plus the exact selected KR/CAR set, then deterministic checks validate scope and lineage before acceptance.</p><button type="button" class="primary" data-management-draft>Propose Epics with Composite AI</button>';
        input.insertAdjacentElement('afterend',fresh);
      }
    }
  }

  document.addEventListener('input', e => {
    const intent=e.target.closest('[data-management-intent]');
    if(!intent)return;
    if(intent.value!==state.managementIntent){
      state.managementIntent=intent.value;
      state.managementProposalState='idle';
      state.managementProposalDigest=null;
      state.acceptedEpic=null;
      invalidateHandoff();
      invalidateVisibleManagementDraft(intent);
    }
  });

  document.addEventListener('click', e => {
    const composer=e.target.closest('[data-open-composer]');
    if(composer){ openComposer(composer); return; }
    if(e.target.closest('[data-close-composer]')){ closeComposer(); return; }
    if(e.target.closest('[data-composer-draft]')){ composerStep='proposal'; renderComposer(); return; }
    if(e.target.closest('[data-composer-reset]')){ composerStep='intent'; state.composerAccepted=false; renderComposer(); return; }
    if(e.target.closest('[data-composer-accept]')){ composerStep='accepted'; state.composerAccepted=true; renderComposer(); return; }
    if(e.target.closest('[data-composer-done]')){ closeComposer(); state.view='okr'; render(); return; }
    const composeKr=e.target.closest('[data-compose-kr]');
    if(composeKr){selectOkrContext(composeKr.dataset.composeObjective,composeKr.dataset.composeKr);state.role='manager';state.view='management';render();return;}
    const managementIntent=e.target.closest('[data-management-intent]');
    if(managementIntent)return;
    const managementKr=e.target.closest('[data-management-kr-check]');
    if(managementKr){
      const id=managementKr.dataset.managementKrCheck;
      state.managementSelectedDecisionIds=managementKr.checked?[...new Set([...state.managementSelectedDecisionIds,id])]:state.managementSelectedDecisionIds.filter(value=>value!==id);
      state.managementProposalState='idle';state.managementProposalDigest=null;state.acceptedEpic=null;invalidateHandoff();render();return;
    }
    if(e.target.closest('[data-management-draft]')){const digest=currentManagementDraftDigest();if(!digest)return;state.managementProposalState='proposed';state.managementProposalDigest=digest;state.acceptedEpic=null;invalidateHandoff();render();return;}
    if(e.target.closest('[data-management-regenerate]')){const digest=currentManagementDraftDigest();if(!digest)return;state.managementProposalState='proposed';state.managementProposalDigest=digest;state.acceptedEpic=null;invalidateHandoff();render();return;}
    if(e.target.closest('[data-management-reject]')){state.managementProposalState='idle';state.managementProposalDigest=null;state.acceptedEpic=null;invalidateHandoff();render();return;}
    if(e.target.closest('[data-management-accept]')){const bindings=managementSourceBindings();const proposals=managementProposalsForSelectedContext();if(state.managementProposalState==='proposed'&&state.managementProposalDigest===currentManagementDraftDigest()&&bindings.length&&proposals[0]&&proposalMatchesSelectedAuthorization(proposals[0])){state.managementProposalState='accepted';state.acceptedEpic={...proposals[0],managementIntent:state.managementIntent,selectionDigest:managementSelectionDigest(bindings),authorizationBindings:bindings.map(binding=>({...binding}))};}invalidateHandoff();render();return;}
    if(e.target.closest('[data-management-authorize]')){const ctx=selectedOkrContext();if(!ctx.authorization)return;state.authorizationReturnView='management';state.selectedAuthorizationId=ctx.authorization.decisionId;state.role='leader';state.view='authorization';render();return;}
    const authCheck=e.target.closest('[data-auth-check]');
    if(authCheck){
      const id=authCheck.dataset.authCheck;
      state.selectedAuthorizationIds=authCheck.checked
        ? [...new Set([...state.selectedAuthorizationIds,id])]
        : state.selectedAuthorizationIds.filter(value=>value!==id);
      render();
      return;
    }
    const reviewSelected=e.target.closest('[data-review-selected]');
    if(reviewSelected){openAuthorizationCeremony(state.selectedAuthorizationIds,reviewSelected);return;}
    const authorizeItem=e.target.closest('[data-authorize-item]');
    if(authorizeItem){openAuthorizationCeremony([authorizeItem.dataset.authorizeItem],authorizeItem);return;}
    if(e.target.closest('[data-close-authorization-ceremony]')){closeAuthorizationCeremony();return;}
    if(e.target.closest('[data-confirm-authorization]')){confirmAuthorizationCeremony();return;}
    const authSelect=e.target.closest('[data-auth-select]');
    if(authSelect){
      state.selectedAuthorizationId=authSelect.dataset.authSelect;
      state.view='authorization';
      render();
      return;
    }
    const authAction=e.target.closest('[data-auth-action]');
    if(authAction){
      const id=authAction.dataset.authId;
      const action=authAction.dataset.authAction;
      state.selectedAuthorizationId=id;
      if(id==='CPD-0003'||id==='CPD-0004'){state.view='authorization';render();return;}
      const nextDecision=action==='approve'?'APPROVED':action==='conditional'?'APPROVE CONDITIONALLY':action==='reuse'?'REUSE EXISTING':'DEFERRED';
      const priorDecision=authorizationDecision(authorizationQueue.find(item=>item.decisionId===id));
      state.authorizationDecisions[id]=nextDecision;
      if(nextDecision!==priorDecision){delete state.authorizationReceipts[id];invalidateManagementForAuthorization(id);}
      state.view='authorization';
      render();
      return;
    }
    const handoffTarget=e.target.closest('[data-handoff-target]');
    if(handoffTarget){const next=handoffTarget.dataset.handoffTarget;if(backlogAdapters[next]&&next!==state.handoffTarget){state.handoffTarget=next;invalidateHandoff();}state.view='handoff';render();return;}
    if(e.target.closest('[data-confirm-handoff]')){const pkg=handoffPackage();if(pkg){state.handoffConfirmed=true;state.handoffReceipt={...pkg,status:'CONFIRMED · NO EXTERNAL WRITE'};}state.view='handoff';render();return;}
    const trail=e.target.closest('[data-open-trail]');
    if(trail){
      selectOkrContext(model.objectiveId,trail.dataset.openTrail);
      openTrail(trail);
      return;
    }
    const review=e.target.closest('[data-review-decision]');
    if(review){
      selectOkrContext(model.objectiveId,review.dataset.reviewDecision);
      state.role='leader';
      state.view='decision';
      render();
      return;
    }
    if(e.target.closest('[data-back-okr]')){
      state.role='leader';
      state.view='okr';
      render();
      return;
    }
    if(e.target.closest('[data-close-trail]')){ closeTrail(); return; }
    if(e.target.closest('[data-trail-decision]')){
      closeTrail();
      state.role='leader';
      state.view='decision';
      render();
      return;
    }
    if(e.target.closest('[data-trail-evidence]')){
      closeTrail();
      state.role='leader';
      state.view='evidence';
      render();
      return;
    }
    const objectiveOpen=e.target.closest('[data-lineage-objective-open]');
    if(objectiveOpen){
      const objective=okrPortfolio.find(item=>item.approved&&item.objectiveId===objectiveOpen.dataset.lineageObjectiveOpen);
      if(objective){setLineageContext(objective.objectiveId,objective.krs[0].id);state.lineageFocus='objective';state.view='lineage';render();}
      return;
    }
    const lineageObjective=e.target.closest('[data-lineage-objective-root]');
    if(lineageObjective&&!e.target.closest('[data-lineage-kr]')){
      const objective=okrPortfolio.find(item=>item.approved&&item.objectiveId===lineageObjective.dataset.lineageObjectiveRoot);
      if(objective){setLineageContext(objective.objectiveId,objective.krs[0].id);state.lineageFocus='objective';state.view='lineage';render();const replacement=document.querySelector('[data-lineage-objective-root="'+objective.objectiveId+'"]');if(replacement)replacement.focus();}
      return;
    }
    const lineageKr=e.target.closest('[data-lineage-kr]');
    if(lineageKr){
      setLineageContext(lineageKr.dataset.lineageObjective,lineageKr.dataset.lineageKr);state.lineageFocus='kr';state.view='lineage';render();const replacement=document.querySelector('[data-lineage-kr="'+lineageKr.dataset.lineageKr+'"]');if(replacement)replacement.focus();return;
    }
    const lineageNode=e.target.closest('[data-lineage-node]');
    if(lineageNode){state.lineageFocus=lineageNode.dataset.lineageNode;state.view='lineage';render();const replacement=document.querySelector('.ns-lineage-node[data-lineage-node="'+state.lineageFocus+'"]')||document.querySelector('.ns-lineage-breadcrumb [data-lineage-node="'+state.lineageFocus+'"]');if(replacement)replacement.focus();return;}
    const lineageStep=e.target.closest('[data-lineage-step]');
    if(lineageStep){
      const ids=['objective','kr','decision','car','edge','epic','product','assurance'];
      let index=Math.max(0,ids.indexOf(state.lineageFocus));
      index=Math.max(0,Math.min(ids.length-1,index+(lineageStep.dataset.lineageStep==='down'?1:-1)));
      state.lineageFocus=ids[index];state.view='lineage';render();const replacement=document.querySelector('[data-lineage-step="'+lineageStep.dataset.lineageStep+'"]:not(:disabled)')||document.querySelector('.ns-lineage-node[data-lineage-node="'+state.lineageFocus+'"]');if(replacement)replacement.focus();return;
    }
    if(e.target.closest('[data-lineage-full]')){state.lineageFocus='assurance';state.view='lineage';render();const replacement=document.querySelector('[data-lineage-full]');if(replacement)replacement.focus();return;}
    const lineageScenario=e.target.closest('[data-lineage-scenario]');
    if(lineageScenario){const next=lineageScenario.dataset.lineageScenario;if(recursiveLineageScenarios[next]){state.lineageScenario=next;state.view='lineage';render();}return;}
    const view=e.target.closest('[data-view]');
    if(view){
      if(view.dataset.view==='lineage'){state.lineageObjective=state.selectedObjective;state.lineageKr=state.selectedKr;state.lineageFocus='objective';state.lineageScenario='current';}
      state.view=view.dataset.view; render(); return;
    }
    const role=e.target.closest('[data-role]');
    if(role){
      state.role=role.dataset.role;
      state.view=state.role==='leader'?'okr':state.role==='manager'?'management':'handoff';
      render(); return;
    }
    const scenario=e.target.closest('[data-scenario]');
    if(scenario){ state.scenario=scenario.dataset.scenario; render(); }
  });

  const composerDialog=$('ns-composer-dialog');
  if(composerDialog){
    composerDialog.addEventListener('click', e=>{ if(e.target===composerDialog) closeComposer(); });
    composerDialog.addEventListener('close', ()=>{ if(composerOpener && typeof composerOpener.focus==='function') composerOpener.focus(); composerOpener=null; });
  }

  const trailDialog=$('ns-trail-dialog');
  if(trailDialog){
    trailDialog.addEventListener('click', e=>{ if(e.target===trailDialog) closeTrail(); });
    trailDialog.addEventListener('close', ()=>{ if(trailOpener && typeof trailOpener.focus==='function') trailOpener.focus(); trailOpener=null; });
  }

  render();
})();
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
    objective: 'Align cloud-product investment and execution to evidence-backed division outcomes.',
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
      ['Defer', 'Do not productize the capability now.', 'Leaves the capability gap unresolved.']
    ],
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
      objective: 'Align cloud-product investment and execution to evidence-backed division outcomes.',
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
    authorizationDecisions:Object.fromEntries(authorizationQueue.map(item=>[item.decisionId,null]))
  };
  let trailOpener = null;
  let composerOpener = null;
  let composerStep = 'intent';
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[ch]));

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
        '<button type="button" data-back-okr>Back to My Division OKRs</button>'+
      '</div>';
    }
    return '<div class="ns-scope-bar" aria-label="Selected outcome context">'+
      '<div><small>SELECTED KEY RESULT</small><strong>'+esc(state.selectedObjective)+' <span aria-hidden="true">→</span> '+esc(state.selectedKr)+'</strong><span>'+esc(model.keyResult)+'</span></div>'+
      '<button type="button" data-back-okr>Back to My Division OKRs</button>'+
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
    state.selectedKr=model.krId;
    state.selectedObjective=model.objectiveId;
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
        (accepted ? '<button type="button" class="primary" data-composer-done>Return to My Division OKRs</button>' : '')+
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
        const action = kr.interactive
          ? '<button class="ns-okr-open" data-open-trail="'+esc(kr.id)+'" type="button">Open trail <span aria-hidden="true">→</span></button>'
          : '<span class="ns-okr-source-note">Measured</span>';
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
        '<div class="ns-objective-head"><div class="ns-objective-id">'+esc(objective.objectiveId)+'</div><div class="ns-objective-title"><small>DIVISION OBJECTIVE</small><h3>'+esc(objective.objective)+'</h3></div><div class="ns-objective-health">'+badge(health,tone)+'<span>'+objective.krs.length+' Key Result'+(objective.krs.length===1?'':'s')+'</span></div></div>'+
        '<div class="ns-objective-krs">'+krRows+'</div>'+
      '</article>';
    }).join('');

    return '<div class="ns-dashboard-head">'+
      '<div><p class="eyebrow">'+esc(model.division)+' · '+esc(model.period)+'</p><h2>My Division OKRs</h2><p>Leadership starts with outcomes, not tickets. Delivery status is visible, but it never substitutes for the named evidence source that proves a Key Result.</p><div class="ns-dashboard-actions"><button type="button" class="ns-okr-open primary" data-open-composer>Create OKR with Composite AI</button><span>AI proposes · Northstar validates · you decide</span></div></div>'+
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
    const s=current();
    const primary=primaryAuthorization();
    const kr94Status = primary.authorized ? 'ON TRACK' : 'UNKNOWN';
    return headline(
      model.objective,
      model.keyResult,
      model.objectiveId+' · '+model.krId
    )+
    '<div class="ns-metrics">'+
      '<article><small>DECISION</small>'+badge(primary.decision,primary.authorized?'green':'blue')+'<p>'+esc(model.decisionId)+' · review '+esc(model.decisionReview)+'</p></article>'+
      '<article><small>AUTHORIZATION</small>'+badge(primary.authorization,primary.authorized?'green':'amber')+'<p>'+(primary.carId?esc(primary.carId)+' · review '+esc(model.carReview):'No CAR emitted')+'</p></article>'+
      '<article><small>DELIVERY</small>'+badge(s.delivery,'blue')+'<p>'+esc(model.epic)+' · '+esc(primary.authorized?model.team:'candidate context only')+'</p></article>'+
      '<article><small>BENEFIT FEEDBACK</small>'+badge(s.benefitOutcome,s.benefitOutcome==='UNKNOWN'?'amber':'green')+'<p>'+esc(s.benefitSource)+'</p></article>'+
    '</div>'+
    '<div class="ns-truth">'+
      '<article><small>KR9.4 AUTHORIZATION STATUS</small><h3>'+esc(kr94Status.replaceAll('_',' '))+'</h3><p>'+(primary.authorized?'Decision/CAR evidence establishes the authorization requirement independently of backlog completion.':'The current decision emits no CAR, so KR9.4 authorization evidence is not established.')+'</p></article>'+
      '<article><small>DOWNSTREAM BENEFIT FEEDBACK</small><h3>'+esc(s.benefitOutcome.replaceAll('_',' '))+'</h3><p>'+esc(s.benefitMeasurement==='UNKNOWN'?'No authoritative benefit measurement yet.':'Observed benefit evidence can inform investment learning without re-scoring KR9.4.')+'</p></article>'+
    '</div>'+
    '<div class="ns-attention"><h3>What needs leadership attention</h3>'+list(s.attention)+'</div>';
  }

  function management() {
    const s=current();
    const primary=primaryAuthorization();
    return headline(primary.authorized?'Translate authorized intent into bounded delivery.':'No authorized product-intent handoff exists.',
      'Management carries the outcome, constraints, evidence requirements and team mapping into execution without turning Northstar into another sprint tool.',
      'MANAGEMENT LENS')+
      kv([
        ['Decision state', badge(primary.decision,primary.authorized?'green':'blue')],
        ['Capability Authorization Record', primary.carId?'<code>'+esc(primary.carId)+'</code>':'No CAR emitted'],
        ['Outcome', esc(model.proposedOutcome)],
        ['Management owner', esc(model.manager)],
        ['Assigned team', esc(model.team)],
        ['Delivery system', esc(model.backlog)],
        ['Delivery state', badge(s.delivery,'blue')],
        ['Epic', '<code>'+esc(model.epic)+'</code> · '+esc(model.epicTitle)]
      ])+
      '<div class="ns-grid-3">'+
        '<article><small>DEPENDENCY</small><h3>'+(primary.authorized?'Accepted CAR binding':'Authorization required')+'</h3><p>'+(primary.authorized?'Delivery cannot silently widen or replace the authorized outcome.':'Management cannot treat candidate backlog context as an authorized handoff without a current CAR.')+'</p></article>'+
        '<article><small>TARGET MEASURE</small><h3>Exact lineage retained</h3><p>Division → Objective → KR → CAR → Epic remains intact.</p></article>'+
        '<article><small>CONSTRAINT</small><h3>No live writeback</h3><p>The public demo does not write to Jira, GitHub, Azure DevOps or cloud systems.</p></article>'+
      '</div>';
  }

  function decision() {
    const primary=primaryAuthorization();
    return headline(model.proposedOutcome,
      'Leadership sees the mission consequence, evidence quality and credible choices without having to translate infrastructure implementation jargon.',
      model.decisionId+' · DECISION BRIEF')+
      '<div class="ns-state-row">'+badge(primary.decision,primary.authorized?'green':'blue')+badge(primary.authorization,primary.authorized?'green':'amber')+badge('HIGH EVIDENCE','green')+badge('REVIEW '+model.decisionReview,'neutral')+'</div>'+
      '<div class="ns-options">'+model.alternatives.map(([name,meaning,consequence]) =>
        '<article><small>'+esc(name.toUpperCase())+'</small><h3>'+esc(meaning)+'</h3><p>'+esc(consequence)+'</p></article>'
      ).join('')+'</div>'+
      '<div class="ns-grid-2">'+
        '<article class="ns-callout amber"><small>NO ACTION</small><h3>What happens?</h3><p>Teams continue using nonstandard request paths and the reusable capability gap stays open.</p></article>'+
        '<article class="ns-callout"><small>EVIDENCE THAT WOULD CHANGE THE ASSESSMENT</small><h3>Proof of accepted reuse</h3><p>If an existing IPW product already satisfies the requested outcome, new productization should be reconsidered.</p></article>'+
      '</div>';
  }

  function authorizationDecision(item) {
    const override=state.authorizationDecisions[item.decisionId];
    if(override)return override;
    if(item.decisionId===model.decisionId)return current().decision;
    return item.initialDecision;
  }

  function authorizationRecord(item) {
    const decision=authorizationDecision(item);
    const authorized=decision==='APPROVED'||decision==='APPROVE CONDITIONALLY';
    return {
      decision,
      authorized,
      carId:authorized ? (item.carId||('CAR-'+item.decisionId.split('-')[1])) : null,
      authorization:authorized?'CURRENT':decision==='REUSE EXISTING'?'NO NEW CAR':'NOT AUTHORIZED'
    };
  }

  function authorization() {
    const selected=authorizationQueue.find(item=>item.decisionId===state.selectedAuthorizationId)||authorizationQueue[0];
    const selectedRecord=authorizationRecord(selected);
    const cards=authorizationQueue.map(item=>{
      const record=authorizationRecord(item);
      const selectedClass=item.decisionId===selected.decisionId?' selected':'';
      const tone=record.authorized?'green':record.decision==='DEFERRED'?'amber':'blue';
      return '<article class="ns-auth-card'+selectedClass+'" data-auth-item="'+esc(item.decisionId)+'">'+
        '<div class="ns-auth-card-head"><div><small>'+esc(item.objectiveId)+' → '+esc(item.krId)+'</small><h3>'+esc(item.outcome)+'</h3></div>'+badge(record.decision,tone)+'</div>'+
        '<div class="ns-auth-meta"><span>'+esc(item.decisionId)+'</span><span>'+(record.carId?esc(record.carId):'NO NEW CAR')+'</span><span>'+esc(item.owner)+'</span></div>'+
        '<p>'+esc(item.scope)+'</p>'+
        '<button type="button" data-auth-select="'+esc(item.decisionId)+'">Review item</button>'+
      '</article>';
    }).join('');
    const pending=authorizationQueue.filter(item=>!['APPROVED','REUSE EXISTING','DEFERRED'].includes(authorizationDecision(item))).length;
    const authorizedCount=authorizationQueue.filter(item=>authorizationRecord(item).authorized).length;

    return headline(
      'Decision & Authorization Queue',
      'Review several proposed outcomes without collapsing them into one blanket approval. Every item keeps its own decision, evidence, scope, accountable owner and Capability Authorization Record behavior.',
      'DECISION & AUTHORIZATION QUEUE'
    )+
    '<div class="ns-auth-summary"><article><small>QUEUE ITEMS</small><strong>'+authorizationQueue.length+'</strong><span>Independent decisions</span></article><article><small>AUTHORIZED</small><strong>'+authorizedCount+'</strong><span>Current bounded product-intent records</span></article><article><small>NEEDS DECISION</small><strong>'+pending+'</strong><span>Human decision still required</span></article></div>'+
    '<div class="ns-auth-layout"><div class="ns-auth-list">'+cards+'</div>'+
    '<section class="ns-auth-detail" aria-label="Selected authorization item">'+
      '<div class="ns-auth-detail-head"><div><small>SELECTED ITEM · '+esc(selected.decisionId)+'</small><h3>'+esc(selected.outcome)+'</h3></div>'+badge(selectedRecord.authorization,selectedRecord.authorized?'green':'amber')+'</div>'+
      kv([
        ['Decision', badge(selectedRecord.decision,selectedRecord.authorized?'green':'blue')],
        ['Capability Authorization Record', selectedRecord.carId?'<code>'+esc(selectedRecord.carId)+'</code>':'No CAR emitted'],
        ['Strategic lineage', esc(selected.objectiveId+' → '+selected.krId)],
        ['Approved / evaluated scope', esc(selected.scope)],
        ['Allowed environments', esc(selected.environments)],
        ['Product owner', esc(selected.productOwner)],
        ['Benefit / decision owner', esc(selected.owner)],
        ['Required evidence', esc(selected.evidence)]
      ])+
      '<div class="ns-auth-actions" aria-label="Synthetic decision actions">'+
        '<button type="button" data-auth-action="conditional" data-auth-id="'+esc(selected.decisionId)+'">Approve conditionally</button>'+
        '<button type="button" data-auth-action="approve" data-auth-id="'+esc(selected.decisionId)+'">Approve</button>'+
        '<button type="button" data-auth-action="reuse" data-auth-id="'+esc(selected.decisionId)+'">Reuse existing</button>'+
        '<button type="button" data-auth-action="defer" data-auth-id="'+esc(selected.decisionId)+'">Defer</button>'+
      '</div>'+
      '<div class="ns-boundary-box"><strong>Synthetic decision only.</strong> These controls demonstrate record-state changes. They do not authenticate an approver, write an enterprise system, create spending authority, accept risk, deploy, provision or mutate cloud resources.</div>'+
      '<div class="ns-denied"><h3>Not granted by a Northstar CAR</h3>'+model.authorityDenied.map(x=>'<span>× '+esc(x)+'</span>').join('')+'</div>'+
    '</section></div>'+
    '<div class="ns-auth-mechanics"><small>HOW AUTHORIZATION ACTUALLY WORKS</small><div><article><b>1</b><strong>Evidence ready</strong><span>Northstar assembles the exact outcome, alternatives, scope and evidence.</span></article><article><b>2</b><strong>Human decision</strong><span>An accountable organizational approver chooses approve, conditional approval, reuse or defer.</span></article><article><b>3</b><strong>Exact CAR emitted</strong><span>Approved product intent gets a bounded CAR tied to that decision and scope.</span></article><article><b>4</b><strong>CAR carried downstream</strong><span>Backlog and productization handoffs retain the exact CAR; they cannot widen it.</span></article><article><b>5</b><strong>Separate execution authority</strong><span>Deployment, provisioning, risk acceptance and other privileged actions still require their own authorized controls.</span></article></div></div>';
  }

  function evidence() {
    return headline('Show the evidence. Keep the distinctions.',
      'Northstar can correlate evidence without turning profile keywords, commit counts or assessments into a hidden employee score.',
      'EVIDENCE EXPLORER')+
      '<div class="ns-evidence-note">SELF-DECLARED ≠ ASSESSED ≠ DEMONSTRATED · CAPABILITY ≠ AVAILABILITY</div>'+
      '<div class="ns-evidence">'+model.evidence.map(([subject,source,cls,confidence,freshness,statement]) =>
        '<article><div class="ns-evidence-top"><small>'+esc(subject.toUpperCase())+'</small><span>'+esc(source)+'</span></div>'+
        '<h3>'+esc(statement)+'</h3><div class="ns-state-row">'+badge(cls,'blue')+badge(confidence+' CONFIDENCE',confidence==='HIGH'?'green':'amber')+badge(freshness,'neutral')+'</div></article>'
      ).join('')+'</div>';
  }

  function handoff() {
    const s=current();
    const primary=primaryAuthorization();
    return headline(primary.authorized?'Carry authority into delivery without handing authority to the backlog.':'No authorized backlog handoff exists.',
      primary.authorized?'The handoff preserves the exact outcome and CAR while letting the delivery team keep using its own execution system.':'The candidate Epic can remain visible as planning context, but Northstar does not present it as an authorized handoff when the decision emits no CAR.',
      'BACKLOG HANDOFF')+
      '<div class="ns-airlock">'+
        '<article><small>STRATEGY</small><h3>'+esc(model.objectiveId)+' → '+esc(model.krId)+'</h3><p>Division outcome and accountable benefit owner.</p></article><b>→</b>'+
        '<article><small>AUTHORIZATION</small><h3>'+(primary.carId?esc(primary.carId):'NO CAR')+'</h3><p>'+esc(primary.authorized?'Exact scope, constraints and evidence requirements.':'Decision state: '+primary.decision.replaceAll('_',' ')+' · no authorized product-intent handoff.')+'</p></article><b>→</b>'+
        '<article><small>DELIVERY</small><h3>'+esc(model.epic)+'</h3><p>'+esc(primary.authorized?model.team+' · '+s.delivery.replaceAll('_',' '):'Candidate context only · not authorized')+'</p></article>'+
      '</div>'+
      '<div class="ns-boundary-box"><strong>Demo boundary:</strong> External backlog writeback is not enabled. A live adapter would require a separately authorized contract.</div>';
  }

  function outcome() {
    const s=current();
    return headline('Did the product deliver the expected benefit?',
      'This view is downstream feedback. It keeps delivery activity separate from observed benefit and does not re-score KR9.4 authorization status.',
      'DOWNSTREAM BENEFIT FEEDBACK')+
      '<div class="ns-truth large">'+
        '<article><small>DELIVERY SIGNAL</small><h3>'+esc(s.delivery.replaceAll('_',' '))+'</h3><p>'+esc(model.epic)+' delivery evidence.</p></article>'+
        '<article><small>BENEFIT MEASUREMENT</small><h3>'+esc(s.benefitMeasurement.replaceAll('_',' '))+'</h3><p>'+esc(s.benefitSource)+'</p></article>'+
      '</div>'+
      kv([
        ['Benefit baseline', 'No authoritative post-delivery benefit observation yet'],
        ['Benefit target', 'Observe adoption and cycle-time feedback after product availability'],
        ['Current benefit', badge(s.benefitOutcome,s.benefitOutcome==='UNKNOWN'?'amber':'green')],
        ['Accountable benefit role', esc(model.leader)]
      ])+
      '<div class="ns-boundary-box">'+
        (s.benefitMeasurement==='UNKNOWN'
          ? '<strong>No benefit claim yet.</strong> Delivery may be complete, but downstream benefit remains unknown until the designated measurement arrives.'
          : '<strong>Benefit evidence received.</strong> The synthetic observation can inform investment learning without changing KR9.4 authorization evidence.')+
      '</div>';
  }

  const renderers={okr:okrOverview,composer:composerView,leadership,management,decision,authorization,evidence,handoff,outcome};

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

  document.addEventListener('click', e => {
    const composer=e.target.closest('[data-open-composer]');
    if(composer){ openComposer(composer); return; }
    if(e.target.closest('[data-close-composer]')){ closeComposer(); return; }
    if(e.target.closest('[data-composer-draft]')){ composerStep='proposal'; renderComposer(); return; }
    if(e.target.closest('[data-composer-reset]')){ composerStep='intent'; state.composerAccepted=false; renderComposer(); return; }
    if(e.target.closest('[data-composer-accept]')){ composerStep='accepted'; state.composerAccepted=true; renderComposer(); return; }
    if(e.target.closest('[data-composer-done]')){ closeComposer(); state.view='okr'; render(); return; }
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
      state.authorizationDecisions[id]=action==='approve'?'APPROVED':action==='conditional'?'APPROVE CONDITIONALLY':action==='reuse'?'REUSE EXISTING':'DEFERRED';
      state.view='authorization';
      render();
      return;
    }
    const trail=e.target.closest('[data-open-trail]');
    if(trail){
      state.selectedKr=trail.dataset.openTrail;
      state.selectedObjective=model.objectiveId;
      openTrail(trail);
      return;
    }
    const review=e.target.closest('[data-review-decision]');
    if(review){
      state.selectedKr=review.dataset.reviewDecision;
      state.selectedObjective=model.objectiveId;
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
    const view=e.target.closest('[data-view]');
    if(view){ state.view=view.dataset.view; render(); return; }
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
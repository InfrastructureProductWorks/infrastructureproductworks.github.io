(() => {
  'use strict';

  const scenarioData = {
    decision: {
      label: 'Decision review',
      decision: 'APPROVE CONDITIONALLY',
      authorization: 'CURRENT',
      delivery: 'READY',
      measurement: 'UNKNOWN',
      outcome: 'UNKNOWN',
      outcomeSource: 'No authoritative measurement',
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
      measurement: 'UNKNOWN',
      outcome: 'UNKNOWN',
      outcomeSource: 'No authoritative measurement',
      attention: [
        'Delivery evidence is complete.',
        'The reusable product is available to the synthetic consumer group.',
        'KR outcome remains unknown because no benefit measurement has arrived.'
      ]
    },
    measured: {
      label: 'Outcome measured',
      decision: 'APPROVED',
      authorization: 'CURRENT',
      delivery: 'COMPLETE',
      measurement: 'AUTHORITATIVE',
      outcome: 'ON TRACK',
      outcomeSource: 'Synthetic benefit measurement',
      attention: [
        'Delivery evidence is complete.',
        'Adoption and cycle-time evidence has been observed.',
        'The Key Result can now be assessed from outcome evidence rather than ticket closure.'
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

  const state = { view: 'okr', role: 'leader', scenario: 'decision', selectedKr: model.krId, selectedObjective: model.objectiveId };
  let trailOpener = null;
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

  function scopeBanner() {
    if (!state.selectedKr) return '';
    return '<div class="ns-scope-bar" aria-label="Selected outcome context">'+
      '<div><small>SELECTED OUTCOME</small><strong>'+esc(state.selectedObjective)+' <span aria-hidden="true">→</span> '+esc(state.selectedKr)+'</strong><span>'+esc(model.keyResult)+'</span></div>'+
      '<button type="button" data-back-okr>Back to My Division OKRs</button>'+
    '</div>';
  }

  function trailMarkup() {
    const s=current();
    return '<div class="ns-trail-lineage" aria-label="Northstar traceability chain">'+
      '<div class="ns-trail-step"><small>OBJECTIVE</small><strong>'+esc(model.objectiveId)+'</strong><span>'+esc(model.objective)+'</span></div>'+
      '<div class="ns-trail-arrow" aria-hidden="true">↓</div>'+
      '<div class="ns-trail-step emphasis"><small>KEY RESULT</small><strong>'+esc(model.krId)+'</strong><span>'+esc(model.keyResult)+'</span></div>'+
      '<div class="ns-trail-arrow" aria-hidden="true">↓</div>'+
      '<div class="ns-trail-step"><small>DECISION</small><strong>'+esc(model.decisionId)+'</strong><span>'+esc(s.decision.replaceAll('_',' '))+'</span></div>'+
      '<div class="ns-trail-arrow" aria-hidden="true">↓</div>'+
      '<div class="ns-trail-step"><small>CAPABILITY AUTHORIZATION</small><strong>'+esc(model.carId)+'</strong><span>Current bounded product intent</span></div>'+
      '<div class="ns-trail-arrow" aria-hidden="true">↓</div>'+
      '<div class="ns-trail-step"><small>EPIC</small><strong>'+esc(model.epic)+'</strong><span>'+esc(model.epicTitle)+'</span></div>'+
    '</div>'+
    '<div class="ns-trail-evidence"><small>KR9.4 AUTHORIZATION EVIDENCE</small><h3>Northstar decision and authorization evidence</h3><p>Decision: <strong>'+esc(s.decision.replaceAll('_',' '))+'</strong> · Authorization: <strong>'+esc(s.authorization.replaceAll('_',' '))+'</strong></p><p>This evidence establishes the bounded decision-to-CAR requirement for KR9.4.</p></div>'+
    '<div class="ns-trail-evidence secondary"><small>DOWNSTREAM OUTCOME FEEDBACK</small><h3>'+esc(s.outcomeSource)+'</h3><p>Delivery: <strong>'+esc(s.delivery.replaceAll('_',' '))+'</strong> · Benefit outcome: <strong>'+esc(s.outcome.replaceAll('_',' '))+'</strong></p><p>Benefit evidence informs outcome learning. It does not substitute for the authorization evidence that proves KR9.4.</p></div>'+
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

  function okrOverview() {
    const s=current();
    const unproven = s.outcome === 'UNKNOWN' ? 1 : 0;
    const decisionPending = s.decision !== 'APPROVED';
    const kr94Outcome = s.authorization === 'CURRENT' ? 'ON TRACK' : 'UNKNOWN';

    const objectiveCards = okrPortfolio.map((objective, objectiveIndex) => {
      const krRows = objective.krs.map(kr => {
        const isPrimary = kr.id === model.krId;
        const delivery = isPrimary ? s.delivery : kr.delivery;
        const outcome = isPrimary ? kr94Outcome : kr.outcome;
        const outcomeTone = outcome === 'UNKNOWN' || outcome === 'AT RISK' ? 'amber' : 'green';
        const source = kr.source;
        const action = kr.interactive
          ? '<button class="ns-okr-open" data-open-trail="'+esc(kr.id)+'" type="button">Open trail <span aria-hidden="true">→</span></button>'
          : '<span class="ns-okr-source-note">Measured</span>';
        return '<div class="ns-kr-row'+(isPrimary?' primary':'')+'">'+
          '<div class="ns-kr-copy"><small>'+esc(kr.id)+'</small><strong>'+esc(kr.text)+'</strong><span>'+esc(kr.owner)+'</span></div>'+
          '<div class="ns-kr-signals"><div><span>DELIVERY</span>'+badge(delivery,'blue')+'</div><div><span>OUTCOME</span>'+badge(outcome,outcomeTone)+'</div></div>'+
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
      '<div><p class="eyebrow">'+esc(model.division)+' · '+esc(model.period)+'</p><h2>My Division OKRs</h2><p>Leadership starts with outcomes, not tickets. Delivery status is visible, but it never substitutes for the named evidence source that proves a Key Result.</p></div>'+
      '<div class="ns-dashboard-status"><span class="pulse"></span><div><small>PORTFOLIO SIGNAL</small><strong>'+(unproven?'1 outcome still unproven':'All highlighted outcomes measured')+'</strong></div></div>'+
    '</div>'+
    '<div class="ns-exec-metrics">'+
      '<article><div class="metric-icon">◎</div><div><small>OBJECTIVES</small><strong>3</strong><span>Division priorities</span></div></article>'+
      '<article><div class="metric-icon">▥</div><div><small>KEY RESULTS</small><strong>5</strong><span>Owned, measurable outcomes</span></div></article>'+
      '<article class="'+(decisionPending?'attention':'good')+'"><div class="metric-icon">!</div><div><small>NEEDS DECISION</small><strong>'+(decisionPending?'1':'0')+'</strong><span>'+(decisionPending?esc(model.decisionId)+' requires review':'No decision pending')+'</span></div></article>'+
      '<article class="'+(unproven?'attention':'good')+'"><div class="metric-icon">◌</div><div><small>OUTCOME UNPROVEN</small><strong>'+unproven+'</strong><span>'+(unproven?'Benefit evidence pending':'Outcome evidence received')+'</span></div></article>'+
    '</div>'+
    '<div class="ns-leadership-grid">'+
      '<div class="ns-leadership-main">'+
        '<div class="ns-section-title"><div><small>OUTCOME PORTFOLIO</small><h3>Division objectives and Key Results</h3></div><span>Delivery ≠ outcome</span></div>'+
        '<div class="ns-okr-board">'+objectiveCards+'</div>'+
      '</div>'+
      '<aside class="ns-attention-rail">'+
        '<div class="ns-rail-head"><small>LEADERSHIP ATTENTION</small><h3>What needs you now</h3></div>'+
        '<article class="ns-attention-card '+(decisionPending?'':'resolved')+'"><div class="ns-attention-top"><span class="priority">'+(decisionPending?'DECISION':'DECISION RESOLVED')+'</span>'+badge(s.decision,decisionPending?'blue':'green')+'</div><h4>'+esc(model.proposedOutcome)+'</h4><p>'+(decisionPending?esc(s.attention[0]):'The decision is approved. Northstar keeps it visible for traceability while attention shifts to delivery and measured benefit.')+'</p><div class="ns-attention-meta"><span>'+esc(model.krId)+'</span><span>'+esc(model.decisionId)+'</span></div><button class="ns-okr-open primary" data-review-decision="'+esc(model.krId)+'" type="button">'+(decisionPending?'Review decision':'View decision record')+' <span aria-hidden="true">→</span></button></article>'+
        '<article class="ns-rail-insight"><small>WHY THIS MATTERS</small><strong>Closing '+esc(model.epic)+' will not close '+esc(model.krId)+'.</strong><p>Northstar waits for the designated outcome evidence before changing the KR assessment.</p></article>'+
        '<article class="ns-rail-proof"><small>TRACEABILITY</small><div><b>Objective</b><span>→</span><b>KR</b><span>→</span><b>Decision</b><span>→</span><b>CAR</b><span>→</span><b>Epic</b></div></article>'+
      '</aside>'+
    '</div>'+
    '<div class="ns-boundary-box"><strong>Leadership rule:</strong> a completed Epic can change the delivery signal. It cannot change a Key Result outcome unless the designated outcome evidence source supports that claim.</div>';
  }

  function leadership() {
    const s=current();
    return headline(
      model.objective,
      model.keyResult,
      model.objectiveId+' · '+model.krId
    )+
    '<div class="ns-metrics">'+
      '<article><small>DECISION</small>'+badge(s.decision,'blue')+'<p>'+esc(model.decisionId)+' · review '+esc(model.decisionReview)+'</p></article>'+
      '<article><small>AUTHORIZATION</small>'+badge(s.authorization,'green')+'<p>'+esc(model.carId)+' · review '+esc(model.carReview)+'</p></article>'+
      '<article><small>DELIVERY</small>'+badge(s.delivery,'blue')+'<p>'+esc(model.epic)+' · '+esc(model.team)+'</p></article>'+
      '<article><small>OUTCOME</small>'+badge(s.outcome,s.outcome==='UNKNOWN'?'amber':'green')+'<p>'+esc(s.outcomeSource)+'</p></article>'+
    '</div>'+
    '<div class="ns-truth">'+
      '<article><small>DELIVERY PROGRESS</small><h3>'+esc(s.delivery.replaceAll('_',' '))+'</h3><p>Backlog and product-realization evidence describe what was delivered.</p></article>'+
      '<article><small>OUTCOME PROGRESS</small><h3>'+esc(s.outcome.replaceAll('_',' '))+'</h3><p>'+esc(s.measurement==='UNKNOWN'?'Northstar will not infer KR attainment from delivery activity.':'Outcome evidence now supports a real KR assessment.')+'</p></article>'+
    '</div>'+
    '<div class="ns-attention"><h3>What needs leadership attention</h3>'+list(s.attention)+'</div>';
  }

  function management() {
    const s=current();
    return headline('Translate authorized intent into bounded delivery.',
      'Management carries the outcome, constraints, evidence requirements and team mapping into execution without turning Northstar into another sprint tool.',
      'MANAGEMENT LENS')+
      kv([
        ['Authorized outcome', esc(model.proposedOutcome)],
        ['Management owner', esc(model.manager)],
        ['Assigned team', esc(model.team)],
        ['Delivery system', esc(model.backlog)],
        ['Delivery state', badge(s.delivery,'blue')],
        ['Epic', '<code>'+esc(model.epic)+'</code> · '+esc(model.epicTitle)]
      ])+
      '<div class="ns-grid-3">'+
        '<article><small>DEPENDENCY</small><h3>Accepted CAR binding</h3><p>Delivery cannot silently widen or replace the authorized outcome.</p></article>'+
        '<article><small>TARGET MEASURE</small><h3>Exact lineage retained</h3><p>Division → Objective → KR → CAR → Epic remains intact.</p></article>'+
        '<article><small>CONSTRAINT</small><h3>No live writeback</h3><p>The public demo does not write to Jira, GitHub, Azure DevOps or cloud systems.</p></article>'+
      '</div>';
  }

  function decision() {
    const s=current();
    return headline(model.proposedOutcome,
      'Leadership sees the mission consequence, evidence quality and credible choices without having to translate infrastructure implementation jargon.',
      model.decisionId+' · DECISION BRIEF')+
      '<div class="ns-state-row">'+badge(s.decision,'blue')+badge('HIGH EVIDENCE','green')+badge('REVIEW '+model.decisionReview,'neutral')+'</div>'+
      '<div class="ns-options">'+model.alternatives.map(([name,meaning,consequence]) =>
        '<article><small>'+esc(name.toUpperCase())+'</small><h3>'+esc(meaning)+'</h3><p>'+esc(consequence)+'</p></article>'
      ).join('')+'</div>'+
      '<div class="ns-grid-2">'+
        '<article class="ns-callout amber"><small>NO ACTION</small><h3>What happens?</h3><p>Teams continue using nonstandard request paths and the reusable capability gap stays open.</p></article>'+
        '<article class="ns-callout"><small>EVIDENCE THAT WOULD CHANGE THE ASSESSMENT</small><h3>Proof of accepted reuse</h3><p>If an existing IPW product already satisfies the requested outcome, new productization should be reconsidered.</p></article>'+
      '</div>';
  }

  function authorization() {
    const s=current();
    return headline(model.proposedOutcome,
      'The Capability Authorization Record turns the leadership decision into a bounded product-intent contract. It is not cloud or spending authority.',
      model.carId+' · CAPABILITY AUTHORIZATION')+
      '<div class="ns-state-row">'+badge(s.authorization,'green')+badge(model.objectiveId+' → '+model.krId,'blue')+'</div>'+
      kv([
        ['Consumers', esc(model.consumers)],
        ['Approved scope', 'Product contract definition · bounded validation'],
        ['Allowed environments', 'Development · Test'],
        ['Product owner', esc(model.productOwner)],
        ['Benefit owner', esc(model.leader)],
        ['Required evidence', 'Guard result · Console review · Forge product contract']
      ])+
      '<div class="ns-denied"><h3>Not granted by this authorization</h3>'+
        model.authorityDenied.map(x=>'<span>× '+esc(x)+'</span>').join('')+
      '</div>';
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
    return headline('Carry authority into delivery without handing authority to the backlog.',
      'The handoff preserves the exact outcome and CAR while letting the delivery team keep using its own execution system.',
      'BACKLOG HANDOFF')+
      '<div class="ns-airlock">'+
        '<article><small>STRATEGY</small><h3>'+esc(model.objectiveId)+' → '+esc(model.krId)+'</h3><p>Division outcome and accountable benefit owner.</p></article><b>→</b>'+
        '<article><small>AUTHORIZATION</small><h3>'+esc(model.carId)+'</h3><p>Exact scope, constraints and evidence requirements.</p></article><b>→</b>'+
        '<article><small>DELIVERY</small><h3>'+esc(model.epic)+'</h3><p>'+esc(model.team)+' · '+esc(s.delivery.replaceAll('_',' '))+'</p></article>'+
      '</div>'+
      '<div class="ns-boundary-box"><strong>Demo boundary:</strong> External backlog writeback is not enabled. A live adapter would require a separately authorized contract.</div>';
  }

  function outcome() {
    const s=current();
    return headline('Did the product actually move the Key Result?',
      'Northstar keeps the evidence of delivery separate from evidence of benefit so ticket closure cannot masquerade as an outcome.',
      'OUTCOME')+
      '<div class="ns-truth large">'+
        '<article><small>DELIVERY SIGNAL</small><h3>'+esc(s.delivery.replaceAll('_',' '))+'</h3><p>'+esc(model.epic)+' delivery evidence.</p></article>'+
        '<article><small>KR MEASUREMENT</small><h3>'+esc(s.measurement.replaceAll('_',' '))+'</h3><p>'+esc(s.outcomeSource)+'</p></article>'+
      '</div>'+
      kv([
        ['Baseline', 'Manual, nonstandard product decision and handoff path'],
        ['Target', 'Exact authorized outcome lineage before product realization'],
        ['Current outcome', badge(s.outcome,s.outcome==='UNKNOWN'?'amber':'green')],
        ['Accountable outcome role', esc(model.leader)]
      ])+
      '<div class="ns-boundary-box">'+
        (s.measurement==='UNKNOWN'
          ? '<strong>No outcome claim yet.</strong> Delivery may be complete, but the KR remains unknown until the designated measurement arrives.'
          : '<strong>Outcome evidence received.</strong> The demo can now assess the KR from an observed synthetic measure instead of delivery activity.')+
      '</div>';
  }

  const renderers={okr:okrOverview,leadership,management,decision,authorization,evidence,handoff,outcome};

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
    const scoped = state.view === 'okr' ? '' : scopeBanner();
    $('northstar-view').innerHTML=scoped+renderers[state.view]();
    $('scenario-state').textContent=current().label.toUpperCase();
    $('role-state').textContent=state.role==='leader'?'LEADERSHIP':state.role==='manager'?'MANAGEMENT':'DELIVERY';
  }

  document.addEventListener('click', e => {
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

  const trailDialog=$('ns-trail-dialog');
  if(trailDialog){
    trailDialog.addEventListener('click', e=>{ if(e.target===trailDialog) closeTrail(); });
    trailDialog.addEventListener('close', ()=>{ if(trailOpener && typeof trailOpener.focus==='function') trailOpener.focus(); trailOpener=null; });
  }

  render();
})();
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

  const state = { view: 'leadership', role: 'leader', scenario: 'decision' };
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

  const renderers={leadership,management,decision,authorization,evidence,handoff,outcome};

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
    $('northstar-view').innerHTML=renderers[state.view]();
    $('scenario-state').textContent=current().label.toUpperCase();
    $('role-state').textContent=state.role==='leader'?'LEADERSHIP':state.role==='manager'?'MANAGEMENT':'DELIVERY';
  }

  document.addEventListener('click', e => {
    const view=e.target.closest('[data-view]');
    if(view){ state.view=view.dataset.view; render(); return; }
    const role=e.target.closest('[data-role]');
    if(role){
      state.role=role.dataset.role;
      state.view=state.role==='leader'?'leadership':state.role==='manager'?'management':'handoff';
      render(); return;
    }
    const scenario=e.target.closest('[data-scenario]');
    if(scenario){ state.scenario=scenario.dataset.scenario; render(); }
  });

  render();
})();
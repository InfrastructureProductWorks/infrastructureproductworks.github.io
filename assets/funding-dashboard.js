/* northstar-funding-planning/v1: shared synthetic reference, no write authority. */
(function (global) {
  'use strict';
  const CONTRACT = 'northstar-funding-planning/v1';
  const moneyFields = ['allocation', 'actual', 'commitments', 'remaining'];
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function requireValue(ok, message) { if (!ok) throw new Error(message); }
  function amount(value, nullable = false) {
    return (nullable && value === null) || (Number.isSafeInteger(value) && value >= 0);
  }
  function ids(values) {
    return Array.isArray(values) && values.length > 0 && values.every(v => typeof v === 'string' && v.trim()) && new Set(values).size === values.length;
  }
  function validate(data) {
    requireValue(data && data.contract === CONTRACT && data.synthetic === true, 'Only the versioned synthetic planning model is supported.');
    requireValue(data.currency === 'USD' && amount(data.envelope), 'Currency or envelope is invalid.');
    for (const key of ['organization', 'division', 'period', 'revision', 'source', 'observedOn']) requireValue(typeof data[key] === 'string' && data[key].trim(), 'Missing scope/source: ' + key);
    requireValue(/^\d{4}-\d{2}-\d{2}$/.test(data.observedOn) && new Date(data.observedOn).toISOString().slice(0,10) === data.observedOn, 'Invalid observation date.');
    requireValue(Array.isArray(data.investments) && data.investments.length > 0 && ids(data.investments.map(i => i.objective)), 'Objective investments must be unique.');
    const epics = new Set();
    data.investments.forEach(item => {
      requireValue(item.organization === data.organization && item.division === data.division && item.period === data.period && item.currency === data.currency, 'Investment scope differs from portfolio.');
      requireValue(/^O\d+$/.test(item.objective) && ids(item.krs) && item.krs.every(kr => kr.startsWith('KR' + item.objective.slice(1) + '.')) && ids(item.epics), 'Invalid Objective/KR/Epic binding.');
      item.epics.forEach(epic => { requireValue(!epics.has(epic), 'Duplicate Epic cost ownership.'); epics.add(epic); });
      moneyFields.forEach(key => requireValue(amount(item[key], key === 'actual' || key === 'remaining'), 'Invalid monetary value: ' + key));
      for (const key of ['availableCapacity','requiredCapacity']) requireValue(Number.isFinite(item[key]) && item[key] >= 0, 'Invalid aggregate capacity.');
      for (const key of ['title','source','basis','outcome']) requireValue(typeof item[key] === 'string' && item[key].trim(), 'Missing investment evidence: ' + key);
      if (item.capacityOption) { const o = item.capacityOption; requireValue(amount(o.cost) && Number.isFinite(o.capacity) && o.capacity > 0 && typeof o.source === 'string' && o.source.trim() && typeof o.assumption === 'string' && o.assumption.trim(), 'Invalid additional-capacity evidence.'); }
      if (item.deferral) requireValue(item.epics.includes(item.deferral.epic) && item.krs.includes(item.deferral.kr) && amount(item.deferral.cost) && item.remaining !== null && item.deferral.cost <= item.remaining && Number.isFinite(item.deferral.capacity) && item.deferral.capacity >= 0 && item.deferral.capacity <= item.requiredCapacity && typeof item.deferral.consequence === 'string' && item.deferral.consequence.trim(), 'Invalid deferral assumptions.');
    });
    return data;
  }
  function sum(values) {
    if (values.some(v => v === null)) return null;
    const result = values.reduce((a, b) => a + b, 0);
    requireValue(Number.isSafeInteger(result), 'Financial rollup exceeds safe integer range.');
    return result;
  }
  function project(input, scenario = 'baseline') {
    validate(input);
    requireValue(['baseline','reduction','defer','capacity'].includes(scenario), 'Unknown planning scenario.');
    const data = JSON.parse(JSON.stringify(input));
    if (scenario === 'reduction') data.envelope = Math.floor(data.envelope * 0.9);
    if (scenario === 'defer') data.investments.forEach(i => {
      if (!i.deferral) return;
      i.remaining -= i.deferral.cost;
      i.requiredCapacity -= i.deferral.capacity;
    });
    if (scenario === 'capacity') {
      requireValue(data.investments.some(i => i.capacityOption), 'No additional-capacity proposal available.');
      data.investments.forEach(i => { if (i.capacityOption) { requireValue(i.remaining !== null, 'Additional-capacity cost forecast unavailable.'); i.remaining = sum([i.remaining, i.capacityOption.cost]); i.availableCapacity += i.capacityOption.capacity; requireValue(Number.isFinite(i.availableCapacity), 'Capacity overflow.'); } });
    }
    const rows = data.investments.map(i => {
      const forecast = sum([i.actual, i.commitments, i.remaining]);
      return {...i, forecast, headroom: forecast === null ? null : i.allocation - forecast, capacityGap: Math.max(0, i.requiredCapacity - i.availableCapacity)};
    });
    const allocated = sum(rows.map(i => i.allocation));
    const forecast = sum(rows.map(i => i.forecast));
    return {...data, rows, allocated, unallocated: data.envelope - allocated, forecast, coverage: rows.filter(i => i.forecast !== null).length, fundingGap: forecast === null ? null : Math.max(0, forecast - data.envelope)};
  }
  function money(value) { return value === null ? 'Unavailable' : new Intl.NumberFormat('en-US', {style:'currency', currency:'USD', minimumFractionDigits:0, maximumFractionDigits:2}).format(value / 100); }
  function markup(input, scenario = 'baseline', selected = null, view = 'leadership') {
    requireValue(['leadership','management'].includes(view), 'Unknown planning view.');
    const management = view === 'management';
    const p = project(input, scenario);
    const deferrals = input.investments.filter(i => i.deferral);
    const scenarios = {baseline:'Approved plan', reduction:'10% less funding', defer: deferrals.length === 1 ? 'Defer '+deferrals[0].deferral.epic : deferrals.length ? 'Defer '+deferrals.length+' Epics' : 'No deferrable Epics'};
    const deferralExplanation = deferrals.length ? 'Assumption: defer '+deferrals.map(i => {
      const d = i.deferral;
      return d.epic+' for '+d.kr+'; remove '+money(d.cost)+' uncommitted forecast'+(management ? ' and '+d.capacity+' FTE quarters' : '')+'. '+d.consequence;
    }).join(' ')+' Actual spending and commitments stay unchanged.' : 'No deferral records are available; no estimates or capacity change.';
    const options = input.investments.filter(i => i.capacityOption);
    if (management && options.length) scenarios.capacity = 'Additional capacity proposal';
    const capacityExplanation = options.map(i => i.objective + ': add ' + money(i.capacityOption.cost) + ' to uncommitted forecast. ' + (management ? 'Add '+i.capacityOption.capacity+' FTE quarters. ' : '') + i.capacityOption.assumption + ' Source: ' + i.capacityOption.source).join(' ');
    const constraint = i => i.capacityGap > 0 ? 'Delivery constrained: management must revise the plan or propose an investment option.' : 'Aggregate capacity fits this scenario; skills, timing and delivery confidence are not established.';
    const detail = p.rows.find(i => i.objective === selected);
    const tile = (label, value, note) => '<article><small>'+label+'</small><strong>'+money(value)+'</strong><p>'+note+'</p></article>';
    const queue = p.rows.filter(i => i.headroom === null || i.headroom < 0 || i.capacityGap > 0);
    return '<section class="nfp" aria-labelledby="nfp-title"><div class="nfp-heading"><small>SYNTHETIC PLANNING REFERENCE</small><h2 id="nfp-title">Funding &amp; Capacity</h2><p>Connect cloud-product priorities to funding and delivery capacity.</p><p>'+esc(p.organization)+' · '+esc(p.division)+' · '+esc(p.period)+' · USD</p><p>Source: '+esc(p.source)+' · Observed '+esc(p.observedOn)+' · Revision '+esc(p.revision)+'</p></div>'+
      '<div class="nfp-boundary">Illustrative financial data. Planning allocations and scenario controls do not authorize spending, staffing, procurement, CAR changes, or execution. Live financial integration is planned.</div>'+
      '<div class="nfp-scenarios" aria-label="Planning views">'+['leadership','management'].map(v => '<button type="button" data-funding-control="view-'+v+'" data-funding-view="'+v+'" aria-pressed="'+(v===view)+'">'+(v==='leadership'?'Leadership investment view':'Management capacity view')+'</button>').join('')+'</div><p>'+ (management ? 'Management owns staffing, skills, availability and delivery feasibility. The capacity proposal is a fixed illustrative option, not a hiring action.' : 'Leadership owns priorities, investment boundaries and outcome tradeoffs. Management supplies the delivery plan.') +' View selection changes presentation only; it grants no permissions.</p>'+
      '<div class="nfp-scenarios" aria-label="Funding scenarios">'+Object.entries(scenarios).map(([key,label]) => '<button type="button" data-funding-control="scenario-'+key+'" data-funding-scenario="'+key+'" '+(key==='defer'&&!deferrals.length?'disabled ':'')+'aria-pressed="'+(key===scenario)+'">'+label+'</button>').join('')+'</div>'+
      '<p>Active scenario: '+esc(scenario === 'capacity' ? 'Management additional-capacity proposal' : scenarios[scenario])+'</p>'+
      '<p class="nfp-assumption">'+(scenario === 'reduction' ? 'Assumption: the envelope falls 10%; allocations, commitments, actual spending and delivery costs stay unchanged.' : scenario === 'defer' ? esc(deferralExplanation) : scenario === 'capacity' ? esc(capacityExplanation) : 'Baseline: synthetic approved planning allocations; all spending and capacity figures are illustrative.')+'</p>'+
      '<div class="nfp-metrics">'+tile('Funding envelope', p.envelope, 'Period funding limit')+tile('Allocated',p.allocated,'Objective planning allocations')+tile('Unallocated',p.unallocated,p.unallocated < 0 ? 'Overallocated: review required' : 'Envelope less allocations')+tile('Forecast funding gap',p.fundingGap,p.coverage+' of '+p.rows.length+' forecasts available; no incomplete total inferred')+'</div>'+
      '<div class="nfp-table" role="region" aria-label="Investment by Objective" tabindex="0"><table><caption>Investment by Objective · select a row for evidence and tradeoffs</caption><thead><tr><th scope="col">Objective</th><th scope="col">Allocation</th><th scope="col">Actual spending</th><th scope="col">Outstanding commitments</th><th scope="col">Remaining forecast</th><th scope="col">Forecast at completion</th><th scope="col">Headroom</th></tr></thead><tbody>'+p.rows.map(i => '<tr><th scope="row"><button type="button" data-funding-control="table-'+esc(i.objective)+'" data-funding-objective="'+esc(i.objective)+'" aria-pressed="'+(i.objective===selected)+'">'+esc(i.objective)+' · '+esc(i.title)+'</button></th>'+['allocation','actual','commitments','remaining','forecast','headroom'].map(key => '<td>'+money(i[key])+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'+
      '<div class="nfp-lower"><article><h3>'+ (management ? 'Management planning queue' : 'Leadership decision queue') +'</h3>'+queue.map(i => '<div class="nfp-queue-item"><button type="button" data-funding-control="queue-'+esc(i.objective)+'" data-funding-objective="'+esc(i.objective)+'">Review '+esc(i.objective)+'</button><p>'+(i.headroom===null ? 'Actual spending or remaining forecast unavailable. Obtain source evidence before inferring affordability.' : i.headroom < 0 ? 'Forecast exceeds allocation by '+money(-i.headroom)+'. Review scope, funding, or deferral.' : 'Funding fits the allocation.')+' '+(management ? 'Capacity gap: '+i.capacityGap.toFixed(1)+' FTE quarters. ' : '')+constraint(i)+'</p></div>').join('')+'</article><article><h3>Investment detail</h3>'+(detail ? '<h4>'+esc(detail.objective)+' · '+esc(detail.title)+'</h4><p>Key Results: '+esc(detail.krs.join(', '))+'</p><p>Epics: '+esc(detail.epics.join(', '))+'</p><p>Estimate basis: '+esc(detail.basis)+'</p><p>Source: '+esc(detail.source)+' · '+esc(p.observedOn)+' · '+esc(p.revision)+'</p><p>'+ (management ? 'Capacity: '+detail.requiredCapacity.toFixed(1)+' required / '+detail.availableCapacity.toFixed(1)+' available FTE quarters. ' : '') +constraint(detail)+'</p><p>KR measurement: '+esc(detail.outcome)+'. Spending does not establish benefit.</p>'+(scenario === 'defer' && detail.deferral ? '<p>Delivery consequence: '+esc(detail.deferral.consequence)+'</p>' : '') : '<p>Select an Objective or a queue entry to review its own source, KR/Epic mapping, estimate basis and capacity.</p>')+'</article></div><details><summary>Financial definitions and production boundary</summary><p>Forecast at completion = actual spending + outstanding commitments + uncommitted remaining forecast. Commitments exclude amounts already spent. Unavailable actuals or forecasts propagate to unavailable totals. Capacity uses aggregate FTE quarters for this reporting period. These synthetic figures are independent of delivery and benefit scenario controls.</p><p>Funding decisions require separate authenticated financial authority and exact-version review. Those services, financial feeds and durable approval records remain planned.</p></details></section>';
  }
  function mount(container, data) {
    let scenario = 'baseline', selected = null, view = 'leadership', launcherSelector = '[data-funding-workspace-open]';
    function draw() {
      container.innerHTML = markup(data, scenario, selected, view);
      if (global.NorthstarFundingWorkflow) {
        container.querySelector('.nfp-boundary').insertAdjacentHTML('afterend','<button type="button" data-funding-workspace-open>Open simulated funding workspace</button><button type="button" data-funding-proposal-open>Draft investment proposal</button>');
        const workspace = document.createElement('div'); workspace.hidden = true; workspace.setAttribute('data-funding-workspace',''); container.appendChild(workspace);
        global.NorthstarFundingWorkflow.mount(workspace, {onBack:()=>{workspace.hidden=true;container.querySelector('.nfp').hidden=false;container.querySelector(launcherSelector).focus();}});
      }
    }
    draw();
    container.onclick = event => {
      const open = event.target.closest('[data-funding-workspace-open], [data-funding-proposal-open]');
      if (open && container.contains(open)) { launcherSelector=open.hasAttribute('data-funding-proposal-open')?'[data-funding-proposal-open]':'[data-funding-workspace-open]'; container.querySelector('.nfp').hidden=true; const workspace=container.querySelector('[data-funding-workspace]'); workspace.hidden=false; if(open.hasAttribute('data-funding-proposal-open'))workspace.querySelector('[data-fw-step="proposal"]').click(); workspace.querySelector('#funding-workspace-title').focus(); return; }
      const button = event.target.closest('[data-funding-scenario], [data-funding-objective], [data-funding-view]');
      if (!button || !container.contains(button)) return;
      const attribute = button.hasAttribute('data-funding-view') ? 'data-funding-view' : button.hasAttribute('data-funding-scenario') ? 'data-funding-scenario' : 'data-funding-objective';
      const value = button.getAttribute(attribute);
      const control = button.getAttribute('data-funding-control');
      if (attribute === 'data-funding-view') view = value; else if (attribute === 'data-funding-scenario') scenario = value; else selected = value;
      draw();
      const replacement = [...container.querySelectorAll('[data-funding-control]')].find(b => b.getAttribute('data-funding-control') === control);
      if (replacement) replacement.focus();
    };
  }
  const api = Object.freeze({CONTRACT,validate,project,markup,mount});
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.NorthstarFunding = api;
})(typeof globalThis === 'undefined' ? this : globalThis);

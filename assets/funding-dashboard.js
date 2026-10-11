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
    requireValue(['baseline','reduction','defer'].includes(scenario), 'Unknown planning scenario.');
    const data = JSON.parse(JSON.stringify(input));
    if (scenario === 'reduction') data.envelope = Math.floor(data.envelope * 0.9);
    if (scenario === 'defer') data.investments.forEach(i => {
      if (!i.deferral) return;
      i.remaining -= i.deferral.cost;
      i.requiredCapacity -= i.deferral.capacity;
    });
    const rows = data.investments.map(i => {
      const forecast = sum([i.actual, i.commitments, i.remaining]);
      return {...i, forecast, headroom: forecast === null ? null : i.allocation - forecast, capacityGap: Math.max(0, i.requiredCapacity - i.availableCapacity)};
    });
    const allocated = sum(rows.map(i => i.allocation));
    const forecast = sum(rows.map(i => i.forecast));
    return {...data, rows, allocated, unallocated: data.envelope - allocated, forecast, coverage: rows.filter(i => i.forecast !== null).length, fundingGap: forecast === null ? null : Math.max(0, forecast - data.envelope)};
  }
  function money(value) { return value === null ? 'Unavailable' : new Intl.NumberFormat('en-US', {style:'currency', currency:'USD', maximumFractionDigits:0}).format(value / 100); }
  const scenarios = {baseline:'Approved plan', reduction:'10% less funding', defer:'Defer discovery Epic'};
  function markup(input, scenario = 'baseline', selected = null) {
    const p = project(input, scenario);
    const detail = p.rows.find(i => i.objective === selected);
    const tile = (label, value, note) => '<article><small>'+label+'</small><strong>'+money(value)+'</strong><p>'+note+'</p></article>';
    const queue = p.rows.filter(i => i.headroom === null || i.headroom < 0 || i.capacityGap > 0);
    return '<section class="nfp" aria-labelledby="nfp-title"><header><small>SYNTHETIC PLANNING REFERENCE</small><h2 id="nfp-title">Funding &amp; Capacity</h2><p>Connect cloud-product priorities to funding and delivery capacity.</p><p>'+esc(p.organization)+' · '+esc(p.division)+' · '+esc(p.period)+' · USD</p><p>Source: '+esc(p.source)+' · Observed '+esc(p.observedOn)+' · Revision '+esc(p.revision)+'</p></header>'+
      '<div class="nfp-boundary">Illustrative financial data. Planning allocations and scenario controls do not authorize spending, staffing, procurement, CAR changes, or execution. Live financial integration is planned.</div>'+
      '<div class="nfp-scenarios" aria-label="Funding scenarios">'+Object.entries(scenarios).map(([key,label]) => '<button type="button" data-funding-scenario="'+key+'" aria-pressed="'+(key===scenario)+'">'+label+'</button>').join('')+'</div>'+
      '<p class="nfp-assumption">'+(scenario === 'reduction' ? 'Assumption: the envelope falls 10%; allocations, commitments, actual spending and delivery costs stay unchanged.' : scenario === 'defer' ? 'Assumption: defer EP-FUND-DISCOVERY and remove its $80,000 uncommitted forecast and 1 FTE quarter. KR9.3 option discovery moves to the next period; actual spending and commitments stay unchanged.' : 'Baseline: synthetic approved planning allocations; all spending and capacity figures are illustrative.')+'</p>'+
      '<div class="nfp-metrics">'+tile('Funding envelope', p.envelope, 'Period funding limit')+tile('Allocated',p.allocated,'Objective planning allocations')+tile('Unallocated',p.unallocated,p.unallocated < 0 ? 'Overallocated: review required' : 'Envelope less allocations')+tile('Forecast funding gap',p.fundingGap,p.coverage+' of '+p.rows.length+' forecasts available; no incomplete total inferred')+'</div>'+
      '<div class="nfp-table" role="region" aria-label="Investment by Objective" tabindex="0"><table><caption>Investment by Objective · select a row for evidence and tradeoffs</caption><thead><tr><th scope="col">Objective</th><th scope="col">Allocation</th><th scope="col">Actual spending</th><th scope="col">Outstanding commitments</th><th scope="col">Remaining forecast</th><th scope="col">Forecast at completion</th><th scope="col">Headroom</th></tr></thead><tbody>'+p.rows.map(i => '<tr><th scope="row"><button type="button" data-funding-objective="'+esc(i.objective)+'" aria-pressed="'+(i.objective===selected)+'">'+esc(i.objective)+' · '+esc(i.title)+'</button></th>'+['allocation','actual','commitments','remaining','forecast','headroom'].map(key => '<td>'+money(i[key])+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'+
      '<div class="nfp-lower"><article><h3>Leadership decision queue</h3>'+queue.map(i => '<div class="nfp-queue-item"><button type="button" data-funding-objective="'+esc(i.objective)+'">Review '+esc(i.objective)+'</button><p>'+(i.headroom===null ? 'Actual spending or remaining forecast unavailable. Obtain source evidence before inferring affordability.' : i.headroom < 0 ? 'Forecast exceeds allocation by '+money(-i.headroom)+'. Review scope, funding, or deferral.' : 'Funding fits the allocation.')+' '+(i.capacityGap > 0 ? 'Capacity gap: '+i.capacityGap.toFixed(1)+' FTE quarters.' : '')+'</p></div>').join('')+'</article><article><h3>Investment detail</h3>'+(detail ? '<h4>'+esc(detail.objective)+' · '+esc(detail.title)+'</h4><p>Key Results: '+esc(detail.krs.join(', '))+'</p><p>Epics: '+esc(detail.epics.join(', '))+'</p><p>Estimate basis: '+esc(detail.basis)+'</p><p>Source: '+esc(detail.source)+' · '+esc(p.observedOn)+' · '+esc(p.revision)+'</p><p>Capacity: '+detail.requiredCapacity.toFixed(1)+' required / '+detail.availableCapacity.toFixed(1)+' available FTE quarters.</p><p>KR measurement: '+esc(detail.outcome)+'. Spending does not establish benefit.</p>'+(scenario === 'defer' && detail.deferral ? '<p>Delivery consequence: '+esc(detail.deferral.consequence)+'</p>' : '') : '<p>Select an Objective or a queue entry to review its own source, KR/Epic mapping, estimate basis and capacity.</p>')+'</article></div><details><summary>Financial definitions and production boundary</summary><p>Forecast at completion = actual spending + outstanding commitments + uncommitted remaining forecast. Commitments exclude amounts already spent. Unavailable actuals or forecasts propagate to unavailable totals. Capacity uses aggregate FTE quarters for this reporting period. These synthetic figures are independent of delivery and benefit scenario controls.</p><p>Funding decisions require separate authenticated financial authority and exact-version review. Those services, financial feeds and durable approval records remain planned.</p></details></section>';
  }
  function mount(container, data) {
    let scenario = 'baseline', selected = null;
    function draw() { container.innerHTML = markup(data, scenario, selected); }
    draw();
    container.onclick = event => {
      const button = event.target.closest('[data-funding-scenario], [data-funding-objective]');
      if (!button || !container.contains(button)) return;
      const attribute = button.hasAttribute('data-funding-scenario') ? 'data-funding-scenario' : 'data-funding-objective';
      const value = button.getAttribute(attribute);
      if (attribute === 'data-funding-scenario') scenario = value; else selected = value;
      draw();
      const replacement = [...container.querySelectorAll('['+attribute+']')].find(b => b.getAttribute(attribute) === value);
      if (replacement) replacement.focus();
    };
  }
  const api = Object.freeze({CONTRACT,validate,project,markup,mount});
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.NorthstarFunding = api;
})(typeof globalThis === 'undefined' ? this : globalThis);

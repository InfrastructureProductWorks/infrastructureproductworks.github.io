const assert = require('node:assert/strict');
const fs = require('node:fs');
const {formatGuardReport, formatGuardOkrReport} = require('../assets/guard-demo.js');
const bundle = require('../assets/guard-demo-reports.json');
assert.equal(bundle.synthetic, true);
assert.deepEqual(bundle.cases.map(s => s.id), ['pass', 'warning', 'fail']);
const revisions = new Set();
for (const sample of bundle.cases) {
  const scan = sample.scan, plan = sample.planning;
  assert.match(scan.revision.sha, /^[a-f0-9]{40}$/);
  revisions.add(scan.revision.sha);
  assert.deepEqual(plan.source.revision, scan.revision);
  assert.deepEqual(plan.source.repository, scan.repository);
  assert.equal(plan.source.findingCount, scan.findings.length);
  assert.equal(plan.source.conclusion, scan.conclusion);
  assert.equal(plan.source.overallScore, scan.overallScore);
  assert.equal(sample.continuitySummary.currentRevision, scan.revision.sha);
  assert.equal(scan.conclusion, {PASS:'success', WARNING:'neutral', FAIL:'failure'}[sample.label]);
  assert.equal(scan.overallScore, Math.round(100 * scan.ruleResults.filter(r => r.result === 'PASS').length / scan.ruleResults.length));
  assert.equal(scan.findings.length, scan.ruleResults.filter(r => ['WARNING','FAIL'].includes(r.result)).length);
  for (const finding of scan.findings) {
    assert(scan.ruleResults.some(r => r.ruleId === finding.ruleId && r.result === finding.result));
    assert(plan.objectives.some(o => o.epics.some(e => e.ruleId === finding.ruleId)));
  }
  const counts = {objectives:0,keyResults:0,epics:0,features:0,userStories:0,candidateTasks:0};
  for (const o of plan.objectives) {
    counts.objectives++; counts.keyResults += o.keyResults.length;
    for (const e of o.epics) {
      counts.epics++;
      assert(e.keyResultIds.every(id => o.keyResults.some(kr => kr.id === id)));
      assert(scan.findings.some(f => f.ruleId === e.ruleId && e.evidence.some(v => v.path === f.path)));
      for (const f of e.features) {
        counts.features++;
        for (const s of f.userStories) {
          counts.userStories++; counts.candidateTasks += s.candidateTasks.length;
          assert.equal(s.candidate, true);
          assert(s.acceptanceEvidence.length);
          assert(s.candidateTasks.every(t => t.candidate === true));
        }
      }
    }
  }
  assert.deepEqual(counts, plan.totals);
  assert(Object.values(plan.boundary).every(v => v === true));
  const report = formatGuardReport(bundle, sample);
  const okr = formatGuardOkrReport(bundle, sample);
  for (const text of ['SYNTHETIC OKR IMPROVEMENT REPORT', scan.revision.sha, sample.label, sample.nextAction, bundle.boundary, bundle.scope, 'AUTHORITY BOUNDARY']) assert(okr.includes(text));
  if (sample.id === 'pass') assert.match(okr, /No candidate remediation work/);
  else for (const text of ['Objective O1', 'Key result KR1', 'baseline 1 → target 0', 'Epic EP1', 'Feature F1', 'Candidate story US1', 'Acceptance evidence:', 'Candidate task T2', scan.findings[0].ruleId, scan.findings[0].evidence]) assert(okr.includes(text));
  for (const text of ['SYNTHETIC', scan.revision.sha, sample.label, sample.nextAction, bundle.boundary, bundle.scope]) assert(report.includes(text));
  if (sample.id === 'pass') {
    assert.equal(plan.objectives.length, 0);
    assert.equal(scan.findings.length, 0);
    assert.match(report, /No candidate remediation work/);
  } else assert.match(report, /Candidate task T2/);
  if (sample.continuitySummary.status === 'not_established') assert.equal(sample.continuitySummary.baselineRevision, null);
}
assert.equal(revisions.size, 3);
const html = fs.readFileSync('guard/demo/index.html','utf8');
assert(html.includes('<noscript>'));
assert(html.includes('id="guard-output" hidden'));
assert(html.includes('id="guard-scenario" disabled'));
console.log('Guard sample report consistency: PASS');

// Cache keys must change with every coupled demo asset, including the report fixture.
const {execFileSync} = require('node:child_process');
const script = fs.readFileSync('assets/guard-demo.js', 'utf8');
for (const asset of ['guard-demo.js', 'guard-demo.css', 'guard-demo-reports.json']) {
  const hash = execFileSync('git', ['hash-object', 'assets/' + asset], {encoding:'utf8'}).trim();
  const reference = '/assets/' + asset + '?v=' + hash;
  assert(html.includes(reference), 'Missing current asset version: ' + asset);
  if (asset.endsWith('.json')) assert(script.includes(reference), 'Report fetch must use the same version');
}

'use strict';

function formatGuardReport(bundle, sample) {
  const scan = sample.scan, plan = sample.planning, continuity = sample.continuitySummary;
  const lines = [
    'IAAP GUARD — SYNTHETIC SAMPLE REPORT',
    bundle.boundary, '', bundle.scope, '',
    'SCENARIO: ' + sample.title,
    'Proposed change: ' + sample.request, '',
    'SOURCE AND SCOPE',
    'Fictional repository: ' + scan.repository.name,
    'Fictional head revision: ' + scan.revision.sha,
    'Fictional baseline revision: ' + (continuity.baselineRevision || 'Not available'),
    'Components: ' + scan.detectedComponents.join(', '),
    'Rule catalog: ' + scan.ruleCatalogVersion,
    'Scoring model: ' + scan.scoringModelVersion,
    'Scan schema: ' + scan.schemaVersion, '',
    'ARCHITECTURE: ' + sample.label,
    'GitHub conclusion mapping: ' + scan.conclusion,
    'Sample coverage score: ' + scan.overallScore + '/100 (three illustrative rules only)',
    'Observed evidence: ' + sample.observation, '', 'RULE RESULTS'
  ];
  scan.ruleResults.forEach(rule => lines.push(rule.ruleId + ' | ' + rule.result + ' | ' + rule.dimension));
  lines.push('', 'FINDINGS');
  if (!scan.findings.length) lines.push('No current findings in this sample scope. This does not establish that a real repository is free of issues.');
  scan.findings.forEach(finding => lines.push(
    finding.ruleId + ' — ' + finding.result,
    'Artifact: ' + finding.path + ' (' + finding.componentContext + ')',
    'Evidence: ' + finding.evidence,
    'Recommendation: ' + finding.recommendation
  ));
  lines.push('', 'EVIDENCE CONTINUITY (ADVISORY)', continuity.status.toUpperCase().replaceAll('_', ' '), continuity.explanation,
    'This authored summary is not a native evidence manifest. Evidence continuity is not authorization continuity.',
    '', 'ADVISORY IMPROVEMENT PLAN', 'Planning schema: ' + plan.schemaVersion,
    'Planning catalog: ' + plan.planningCatalogVersion, 'Status: ' + plan.status);
  if (!plan.objectives.length) lines.push('No candidate remediation work is proposed for this sample. Continue accountable human review.');
  plan.objectives.forEach(objective => {
    lines.push('Objective ' + objective.id + ': ' + objective.title);
    objective.keyResults.forEach(kr => lines.push('  Key result ' + kr.id + ': ' + kr.statement,
      '  Metric: ' + kr.metric + ' | baseline ' + kr.baseline + ' → target ' + kr.target));
    objective.epics.forEach(epic => {
      lines.push('  Epic ' + epic.id + ': ' + epic.title + ' [' + epic.ruleId + ' → ' + epic.keyResultIds.join(', ') + ']', '  Outcome: ' + epic.outcome);
      epic.features.forEach(feature => {
        lines.push('    Feature ' + feature.id + ': ' + feature.title);
        feature.userStories.forEach(story => {
          lines.push('      Candidate story ' + story.id + ': ' + story.statement);
          story.acceptanceEvidence.forEach(evidence => lines.push('      Acceptance evidence: ' + evidence));
          story.candidateTasks.forEach(task => lines.push('      Candidate task ' + task.id + ': ' + task.title));
        });
      });
    });
  });
  lines.push('', 'NEXT ACTION', sample.nextAction, '', 'AUTHORITY BOUNDARY',
    'Guard supplies evidence and candidate work only. It does not approve, merge, assign, remediate, or deploy. Existing repository protections and accountable decisions still apply.');
  return lines.join('\n') + '\n';
}

if (typeof module !== 'undefined') module.exports = { formatGuardReport };

if (typeof document !== 'undefined') {
  const select = document.getElementById('guard-scenario');
  const output = document.getElementById('guard-output');
  const status = document.getElementById('demo-status');
  const download = document.getElementById('download-report');
  let bundle, selected;
  const setText = (id, value) => { document.getElementById(id).textContent = value; };
  function unavailable() {
    selected = null;
    output.hidden = true;
    select.disabled = true;
    download.disabled = true;
    status.textContent = 'Sample reports are unavailable. Reload to try again, or use the Guard user guide above. No assessment has been performed.';
  }
  function render() {
    try {
      const sample = bundle.cases.find(item => item.id === select.value);
      if (!sample) throw new Error('Unknown scenario');
      const report = formatGuardReport(bundle, sample);
      setText('scenario-title', sample.title);
      setText('sample-request', 'Sample proposal: ' + sample.request);
      setText('architecture-result', sample.label);
      setText('coverage', sample.scan.overallScore + '/100 — three illustrative rules');
      setText('continuity-result', sample.continuitySummary.status.toUpperCase().replaceAll('_', ' '));
      setText('continuity-explanation', sample.continuitySummary.explanation);
      setText('next-action', sample.nextAction);
      setText('sample-report', report);
      setText('sample-json', JSON.stringify({ schemaVersion: bundle.schemaVersion, synthetic: true, boundary: bundle.boundary, scope: bundle.scope, sample }, null, 2));
      selected = { id: sample.id, report };
      output.hidden = false;
      download.disabled = false;
      status.textContent = 'Showing the synthetic ' + sample.label + ' report. No live evaluation has run.';
    } catch { unavailable(); }
  }
  select.addEventListener('change', render);
  download.addEventListener('click', () => {
    if (!selected) return;
    const url = URL.createObjectURL(new Blob([selected.report], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'iaap-guard-synthetic-' + selected.id + '-report.txt';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  fetch('/assets/guard-demo-reports.json').then(response => {
    if (!response.ok) throw new Error('Sample unavailable');
    return response.json();
  }).then(data => {
    if (data.schemaVersion !== 'ipw-guard-demo/v1' || data.synthetic !== true || !Array.isArray(data.cases) ||
        data.cases.length !== 3 || ['pass', 'warning', 'fail'].some(id => data.cases.filter(sample => sample.id === id).length !== 1)) {
      throw new Error('Invalid sample bundle');
    }
    // Format every report before enabling controls so a partial bundle cannot appear healthy.
    data.cases.forEach(sample => formatGuardReport(data, sample));
    bundle = data;
    select.value = 'pass';
    select.disabled = false;
    render();
  }).catch(unavailable);
}

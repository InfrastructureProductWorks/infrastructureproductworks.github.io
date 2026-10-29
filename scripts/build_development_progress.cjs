'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const publicText = vm.createContext({document:{addEventListener(){}}});
vm.runInContext(fs.readFileSync(path.join(root, 'assets/portfolio.js'), 'utf8'), publicText);
function safePublicText(value) {
  publicText.candidate = value;
  return vm.runInContext('publicPortfolioString(candidate)', publicText);
}
const START = '<!-- development-progress:start -->';
const END = '<!-- development-progress:end -->';
const boundary = 'Measured engineering increments only. Tests and automated review do not establish customer acceptance, legal compliance or whole-product readiness.';
const keys = (x, expected) => x && typeof x === 'object' && !Array.isArray(x)
  && Object.keys(x).sort().join('|') === expected.slice().sort().join('|');
function requireValue(ok) { if (!ok) throw new Error('Invalid development evidence'); }
function publicSource(value) {
  if (value === null) return true;
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    const prefix = '/' + ['InfrastructureProductWorks', 'infrastructureproductworks.github.io'].join('/') + '/';
    return url.origin === 'https://github.com' && !url.username && !url.password
      && !url.search && !url.hash && url.href === value && url.pathname.startsWith(prefix)
      && /^(?:pull\/[1-9][0-9]*|commit\/[a-f0-9]{40})$/.test(url.pathname.slice(prefix.length));
  } catch { return false; }
}
function validate(data, roadmap, now = new Date()) {
  requireValue(keys(data, ['schemaVersion', 'asOf', 'boundary', 'increments']));
  requireValue(data.schemaVersion === 'ipw-development-progress/v1' && data.boundary === boundary);
  requireValue(typeof data.asOf === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(data.asOf)
    && Number.isFinite(Date.parse(data.asOf)) && new Date(data.asOf).toISOString().replace('.000', '') === data.asOf
    && Date.parse(data.asOf) <= now.getTime());
  requireValue(Array.isArray(data.increments) && data.increments.length > 0 && data.increments.length <= 20);
  const ids = new Set();
  for (const item of data.increments) {
    requireValue(keys(item, ['id', 'epic', 'title', 'change', 'stage', 'tests', 'ciChecks', 'review', 'evidenceCommitment', 'limitations', 'publicSource']));
    requireValue(typeof item.id === 'string' && /^[a-z][a-z0-9-]{2,63}$/.test(item.id) && !ids.has(item.id)); ids.add(item.id);
    requireValue(Object.hasOwn(roadmap.epics, item.epic));
    for (const name of ['title', 'change', 'limitations']) requireValue(typeof item[name] === 'string'
      && item[name].length > 0 && item[name].length <= 600 && !/[<>\r\n\x00-\x1f]/.test(item[name]) && safePublicText(item[name]));
    requireValue(['released', 'under-review', 'locally-tested'].includes(item.stage));
    requireValue(['clean-automated', 'pending'].includes(item.review));
    requireValue(Number.isSafeInteger(item.tests) && item.tests >= 0 && item.tests <= 100000);
    requireValue(Number.isSafeInteger(item.ciChecks) && item.ciChecks >= 0 && item.ciChecks <= 1000);
    requireValue(typeof item.evidenceCommitment === 'string' && /^[a-f0-9]{64}$/.test(item.evidenceCommitment));
    requireValue(publicSource(item.publicSource));
    requireValue(item.stage !== 'released' || item.publicSource !== null && item.review === 'clean-automated' && item.ciChecks > 0);
    requireValue(item.stage !== 'locally-tested' || item.ciChecks === 0);
  }
  return data;
}
function escape(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c])); }
function render(data) {
  const stages = {released:'Released · bounded scope', 'under-review':'Implemented · under review', 'locally-tested':'Implemented · locally tested'};
  return `<section id="development-progress" class="dashboard-section"><div class="dashboard-wrap"><div class="dashboard-heading"><div><p class="eyebrow">MEASURED DEVELOPMENT</p><h2>Recent engineering, with the evidence kept in view.</h2><p>As of <time datetime="${data.asOf}">${new Date(data.asOf).toLocaleString('en-US', {timeZone:'America/New_York', dateStyle:'long', timeStyle:'short'})} Eastern</time>. These dated increments complement the roadmap baseline; they do not increase its accepted percentages automatically.</p></div></div><div class="telemetry-panel">${data.increments.map(item => `<article><small class="eyebrow">${escape(item.epic)} · ${stages[item.stage]}</small><h3>${escape(item.title)}</h3><p>${escape(item.change)}</p><dl class="development-measures"><div><dt>Focused tests passed</dt><dd>${item.tests}</dd></div><div><dt>CI checks passed</dt><dd>${item.ciChecks}</dd></div><div><dt>Automated review</dt><dd>${item.review === 'clean-automated' ? 'Clean at measured revision' : 'Pending'}</dd></div></dl><p>${escape(item.limitations)}</p><details><summary>Evidence identity</summary><p>Exact evidence commitment: <code class="development-commitment">${item.evidenceCommitment}</code></p>${item.publicSource ? `<p><a href="${escape(item.publicSource)}">Inspect public source</a></p>` : '<p>Internal evidence identity retained privately. No private source coordinates are published.</p>'}</details></article>`).join('')}</div><p class="validation-boundary">${escape(data.boundary)} Counts apply to each named increment and are not added into a portfolio-wide test or completion score.</p></div></section>`;
}
function replace(html, section) {
  requireValue(html.split(START).length === 2 && html.split(END).length === 2 && html.indexOf(START) < html.indexOf(END));
  return html.slice(0, html.indexOf(START) + START.length) + section + html.slice(html.indexOf(END));
}
if (require.main === module) {
  const data = validate(JSON.parse(fs.readFileSync(path.join(root, 'data/development-progress.json'), 'utf8')),
    JSON.parse(fs.readFileSync(path.join(root, 'data/roadmap-relationships.json'), 'utf8')));
  const filename = path.join(root, 'portfolio/index.html');
  const previous = fs.readFileSync(filename, 'utf8');
  const next = replace(previous, render(data));
  if (process.argv.includes('--check')) requireValue(previous === next);
  else fs.writeFileSync(filename, next);
  console.log('Development evidence projection: PASS');
}
module.exports = {validate, render, replace, boundary, START, END};

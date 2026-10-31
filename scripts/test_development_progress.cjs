'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {validate, render, replace, START, END} = require('./build_development_progress.cjs');
const data = JSON.parse(fs.readFileSync('data/development-progress.json', 'utf8'));
const roadmap = JSON.parse(fs.readFileSync('data/roadmap-relationships.json', 'utf8'));
assert.equal(validate(data, roadmap), data);
let cases = 0;
for (const change of [
  d => d.extra = 'unreviewed', d => d.asOf = '2099-01-01T00:00:00Z',
  d => d.asOf = '2026-02-30T00:00:00Z', d => d.boundary = 'Production ready',
  d => d.increments.push(d.increments[0]), d => d.increments[0].epic = 'EP-99',
  d => d.increments[0].tests = true, d => d.increments[0].ciChecks = -1,
  d => d.increments[0].stage = 'customer-accepted', d => d.increments[0].evidenceCommitment = 'a'.repeat(40),
  d => d.increments[0].publicSource = 'https://private.example/source',
  d => d.increments[0].stage = 'locally-tested', d => d.increments[0].review = 'human-approved',
  d => {d.increments[0].stage = 'released'; d.increments[0].publicSource = null;},
  d => d.increments[0].change = '<script>not text</script>',
  d => d.increments[0].limitations = ['PrivatePartner', 'secret-repo'].join('/'),
  d => d.increments[0].title = ['iaap-', 'forge'].join(''),
  d => d.increments[0].change = 'a'.repeat(40)
]) {
  const invalid = structuredClone(data); change(invalid); assert.throws(() => validate(invalid, roadmap)); cases++;
}
const html = render(data);
assert.match(html, /<time datetime=/); assert.match(html, /not increase its accepted percentages/);
assert.match(html, /not added into a portfolio-wide/);
const hostile = structuredClone(data); hostile.increments[0].title = 'A & B "quoted"';
assert.match(render(validate(hostile, roadmap)), /A &amp; B &quot;quoted&quot;/);
const original = `before${START}old${END}after`;
assert.equal(replace(original, html), `before${START}${html}${END}after`);
assert.throws(() => replace(original + START, html));
assert.throws(() => replace(END + START, html));
console.log(`Development evidence: ${cases} negative cases plus binding, escaping and boundary checks passed`);

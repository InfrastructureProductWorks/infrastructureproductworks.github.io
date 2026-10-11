const assert = require('node:assert/strict');
const path = require('node:path');
const assetRoot = process.argv[2];
if (!assetRoot) throw new Error('Pass the dashboard asset directory');
const api = require(path.resolve(assetRoot,'funding-dashboard.js'));
const fixture = require(path.resolve(assetRoot,'funding-fixture.js'));
const copy = () => JSON.parse(JSON.stringify(fixture));
const before = JSON.stringify(fixture);
const baseline = api.project(fixture);
assert.equal(baseline.envelope,100000000);
assert.equal(baseline.allocated,90000000);
assert.equal(baseline.unallocated,10000000);
assert.equal(baseline.rows[0].forecast,53000000);
assert.equal(baseline.rows[0].headroom,-8000000);
assert.equal(baseline.rows[0].capacityGap,1);
assert.equal(baseline.forecast,null);
assert.equal(baseline.fundingGap,null);
assert.equal(baseline.coverage,2);
const complete = copy(); complete.investments[2].actual = 4000000;
assert.equal(api.project(complete).forecast,97000000);
assert.equal(api.project(complete,'reduction').fundingGap,7000000);
assert.equal(api.project(fixture,'reduction').unallocated,0);
const deferred = api.project(fixture,'defer');
assert.equal(deferred.rows[0].forecast,45000000);
assert.equal(deferred.rows[0].headroom,0);
assert.equal(deferred.rows[0].capacityGap,0);
assert.equal(deferred.rows[0].actual,baseline.rows[0].actual);
assert.equal(deferred.rows[0].commitments,baseline.rows[0].commitments);
assert.equal(JSON.stringify(fixture),before);
const absent = copy(); absent.investments[0].remaining = null; delete absent.investments[0].deferral;
assert.equal(api.project(absent).rows[0].forecast,null);
assert.equal(api.project(absent).coverage,1);
for (const mutate of [
 d => d.synthetic=false,
 d => d.currency='EUR',
 d => d.envelope=-1,
 d => d.investments[0].actual=NaN,
 d => d.investments[0].allocation=1.5,
 d => d.investments[0].organization='Other',
 d => d.investments[0].period='FY28 Q1',
 d => d.investments[0].krs=['KR10.2'],
 d => d.investments[0].epics=d.investments[1].epics,
 d => d.investments[0].deferral.cost=99999999,
 d => d.investments[0].deferral.capacity=9,
 d => d.investments[0].availableCapacity=-1,
 d => d.investments[0].actual=Number.MAX_SAFE_INTEGER,
 d => d.observedOn='2026-02-30'
]) { const d=copy(); mutate(d); assert.throws(() => api.project(d)); }
assert.throws(() => api.project(fixture,'approve'));
const html = api.markup(fixture,'defer','O9');
assert.match(html,/Delivery consequence/);
assert.match(html,/do not authorize spending/);
assert.match(html,/Unavailable/);
const malicious=copy(); malicious.investments[0].title='<script>alert(1)</script>';
assert.doesNotMatch(api.markup(malicious),/<script>/);
console.log('Funding semantic tests passed: nulls, arithmetic, source scope, scenarios, mutation and escaping.');

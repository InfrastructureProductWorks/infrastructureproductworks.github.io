const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function harness() {
  const errors = [], renders = [], requests = [];
  const context = {
    console: {warn() {}}, AbortController, setTimeout, clearTimeout,
    document: {
      addEventListener() {},
      getElementById(id) { return {classList: {add() { errors.push(id); }}}; }
    }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('assets/portfolio.js', 'utf8'), context);
  const roadmap = JSON.parse(fs.readFileSync('data/roadmap-relationships.json', 'utf8'));
  context.roadmapFixture = roadmap;
  const bundle = vm.runInContext(`({
    schemaVersion:'portfolio-bundle/v1',
    roadmap:roadmapFixture,
    presentation:{schemaVersion:'portfolio-presentation/v1',deliveryFocus:DELIVERY_FOCUS,milestones:DELIVERY_OUTLOOK_MILESTONES},
    dashboard:{...FALLBACK,generatedAt:roadmapFixture.generatedAt+'T12:00:00Z',authorityNotice:AUTHORITY_NOTICE,
      source:{roadmap:'config/portfolio-roadmap.json',roadmapBaseline:normalizeRoadmapDate(roadmapFixture.planning.baseline),
        scope:LIVE_SCOPE,aggregation:LIVE_AGGREGATION,repository:INTEGRATION_REPOSITORY,
        revision:roadmapFixture.sourceRevision,roadmapBlobSha:roadmapFixture.roadmapBlobSha},
      objectives:roadmapFixture.objectives.map(o=>({id:o.id,definition:o.definition,keyResultCount:o.keyResults.length,
        epics:[...new Set(roadmapFixture.keyResults.filter(k=>k.objective===o.id).flatMap(k=>k.epics))]})),
      products:PRODUCT_CONTRACT.map(p=>({id:p.id,name:p.name,role:p.role,stageIndex:1,state:'Defined',status:'DEFINING',
        evidence:'Synthetic fixture',nextMilestone:'Bounded test',href:'/'+p.id+'/',versions:{},
        source:{repository:p.repository,revision:'a'.repeat(40),mode:'product-owned-main'}}))}
  })`, context);
  context.bundle = JSON.parse(JSON.stringify(bundle));
  context.renderLog = renders;
  vm.runInContext(`
    renderBaseline=data=>renderLog.push(['baseline',data]);
    renderProducts=data=>renderLog.push(['products',data]);
    renderNext=()=>{};
    renderRoadmapRelationships=data=>renderLog.push(['roadmap',data]);
    renderRoadmapFallback=()=>renderLog.push(['fallback']);
    renderDeliveryOutlook=()=>{};
  `, context);
  context.fetch = async url => { requests.push(url); return {ok:true,json:async()=>context.bundle}; };
  return {context, errors, renders, requests, run:code=>vm.runInContext(code,context)};
}

(async()=>{
  const good = harness();
  assert.equal(good.run('validPortfolioBundle(bundle)'),true);
  await good.run('loadPortfolio()');
  assert.equal(good.requests.length,1);
  assert.match(good.requests[0],/portfolio-bundle\.json/);
  assert.equal(good.errors.length,0);
  assert.ok(good.renders.some(([kind])=>kind==='roadmap'));
  for(const mutate of [
    b=>b.roadmap.sourceRevision='b'.repeat(40),
    b=>b.roadmap.roadmapBlobSha='b'.repeat(40),
    b=>b.dashboard.baseline.features++,
    b=>b.roadmap.generatedAt='2099-01-01',
    b=>b.roadmap.headlineKeyResults[0].epicContributions=[],
    b=>b.presentation.milestones[0].critical=['EP-99'],
    b=>b.presentation.deliveryFocus.epic='EP-99',
    b=>b.roadmap.epics['EP-01'].completionPercent=101,
  ]) {
    const h=harness();mutate(h.context.bundle);
    await h.run('loadPortfolio()');
    assert.ok(h.errors.includes('sync-error'));
    assert.ok(h.renders.some(([kind])=>kind==='fallback'));
    assert.ok(!h.renders.some(([kind])=>kind==='roadmap'));
    assert.equal(h.renders.find(([kind])=>kind==='products')[1].products.length,0);
    assert.equal(h.requests.length,1,'must not fetch a separate stale roadmap');
  }
  const offline=harness();offline.context.fetch=async()=>{throw new Error('offline');};
  await offline.run('loadPortfolio()');
  assert.ok(offline.renders.some(([kind])=>kind==='fallback'));
  const changed=harness();
  changed.context.bundle.presentation.deliveryFocus.increment='Next accepted increment';
  changed.context.bundle.roadmap.epics['EP-02'].completionPercent=50;
  await changed.run('loadPortfolio()');
  assert.equal(changed.run('DELIVERY_FOCUS.increment'),'Next accepted increment');
  assert.equal(changed.renders.find(([kind])=>kind==='roadmap')[1].epics['EP-02'].completionPercent,50);
  console.log('Portfolio bundle: valid rendering, canonical focus, atomic rejection and offline fallback PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});

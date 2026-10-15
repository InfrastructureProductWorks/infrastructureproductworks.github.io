const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function harness() {
  const errors = [], renders = [], requests = [], elements = new Map(), shown = new Set();
  const makeElement=()=>({children:[],dataset:{},classList:{add(){},remove(){},toggle(){}},
    append(...children){this.children.push(...children);},replaceChildren(...children){this.children=[...children];},
    querySelectorAll(){return [];},setAttribute(){}});
  const context = {
    console: {warn() {}}, AbortController, setTimeout, clearTimeout,
    document: {
      addEventListener() {},
      createElement:makeElement,querySelectorAll(){return [];},
      getElementById(id) { if(!elements.has(id))elements.set(id,{...makeElement(),classList: {add() { errors.push(id);shown.add(id); },remove(){shown.delete(id);}}}); return elements.get(id); }
    }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('assets/portfolio.js', 'utf8'), context);
  const roadmap = JSON.parse(fs.readFileSync('data/roadmap-relationships.json', 'utf8'));
  context.roadmapFixture = roadmap;
  const bundle = vm.runInContext(`({
    schemaVersion:'portfolio-bundle/v2',
    roadmap:roadmapFixture,
    presentation:{schemaVersion:'portfolio-presentation/v1',deliveryFocus:DELIVERY_FOCUS,milestones:DELIVERY_OUTLOOK_MILESTONES},
    dashboard:{...FALLBACK,generatedAt:roadmapFixture.generatedAt+'T12:00:00Z',authorityNotice:AUTHORITY_NOTICE,
      baseline:{objectives:roadmapFixture.objectives.length,keyResults:roadmapFixture.keyResults.length,
        epics:Object.keys(roadmapFixture.epics).length,features:Object.values(roadmapFixture.epics).reduce((sum,epic)=>sum+epic.features.length,0)},
      portfolioFocus:{...FALLBACK.portfolioFocus,next:['Synthetic bounded test fixture']},
      source:{roadmap:'public-portfolio-roadmap',roadmapBaseline:normalizeRoadmapDate(roadmapFixture.planning.baseline),
        scope:LIVE_SCOPE,aggregation:LIVE_AGGREGATION,repository:PUBLIC_EVIDENCE_REPOSITORY,
        commitment:roadmapFixture.sourceCommitment,roadmapCommitment:roadmapFixture.roadmapCommitment},
      objectives:roadmapFixture.objectives.map(o=>({id:o.id,definition:o.definition,keyResultCount:o.keyResults.length,
        epics:[...new Set(roadmapFixture.keyResults.filter(k=>k.objective===o.id).flatMap(k=>k.epics))]})),
      products:PRODUCT_CONTRACT.map(p=>({id:p.id,name:p.name,role:p.role,stageIndex:1,state:'Defined',status:'DEFINING',
        evidence:'Synthetic fixture',nextMilestone:'Bounded test',href:'/'+p.id+'/',versions:{},
        source:{product:p.id,commitment:'a'.repeat(64),mode:'product-owned-main'}}))}
  })`, context);
  context.bundle = JSON.parse(JSON.stringify(bundle));
  context.renderLog = renders;
  vm.runInContext(`
    originalRenderBaseline=renderBaseline;originalRenderRoadmapFallback=renderRoadmapFallback;originalRenderNext=renderNext;originalRenderDeliveryOutlook=renderDeliveryOutlook;
    renderBaseline=data=>renderLog.push(['baseline',data]);
    renderProducts=data=>renderLog.push(['products',data]);
    renderNext=()=>{};
    renderRoadmapRelationships=data=>renderLog.push(['roadmap',data]);
    renderRoadmapFallback=()=>renderLog.push(['fallback']);
    renderDeliveryOutlook=()=>{};
  `, context);
  context.fetch = async url => { requests.push(url); return {ok:true,json:async()=>context.bundle}; };
  return {context, errors, renders, requests, elements, shown, run:code=>vm.runInContext(code,context)};
}

(async()=>{
  const originalTimezone=process.env.TZ;
  try{
    for(const timezone of ['UTC','America/New_York','Europe/Budapest','Pacific/Kiritimati']){
      process.env.TZ=timezone;
      const dates=harness();
      assert.equal(dates.run("normalizeRoadmapDate('October 11, 2026')"),'2026-10-11',timezone);
      assert.equal(dates.run("normalizeRoadmapDate('2026-10-11')"),'2026-10-11',timezone);
      assert.equal(dates.run("normalizeRoadmapDate('February 29, 2028')"),'2028-02-29',timezone);
      for(const invalid of ['February 29, 2026','October 99, 2026','2026-02-30','2026-10-11T00:00:00Z','10/11/2026']){
        dates.context.dateInput=invalid;
        assert.equal(dates.run('normalizeRoadmapDate(dateInput)'),null,`${timezone}: ${invalid}`);
      }
      assert.equal(dates.run('validPortfolioBundle(bundle)'),true,timezone);
    }
  }finally{
    if(originalTimezone===undefined)delete process.env.TZ;
    else process.env.TZ=originalTimezone;
  }
  const snapshot=harness();
  const roadmap=snapshot.context.roadmapFixture;
  const fallback=JSON.parse(snapshot.run('JSON.stringify(FALLBACK)'));
  const metadata=JSON.parse(snapshot.run('JSON.stringify(FALLBACK_SNAPSHOT)'));
  const expectedObjectives=roadmap.objectives.map(o=>({id:o.id,definition:o.definition,keyResultCount:o.keyResults.length,
    epics:[...new Set(roadmap.keyResults.filter(k=>k.objective===o.id).flatMap(k=>k.epics))]}));
  assert.deepEqual(fallback.objectives,expectedObjectives,'Every fallback objective ID, label, count and epic set must match the snapshot');
  assert.deepEqual(fallback.baseline,{objectives:roadmap.objectives.length,keyResults:roadmap.keyResults.length,
    epics:Object.keys(roadmap.epics).length,features:Object.values(roadmap.epics).reduce((n,e)=>n+e.features.length,0)});
  assert.equal(fallback.objectives.reduce((n,o)=>n+o.keyResultCount,0),fallback.baseline.keyResults);
  assert.equal(metadata.date,roadmap.progressHistory.at(-1).date,'Date identifies retained evidence, not projection run time');
  assert.equal(metadata.date,roadmap.generatedAt,'Snapshot description and retained observations must agree');
  assert.deepEqual(metadata.planning,roadmap.planning);
  assert.equal(metadata.headlineKeyResultCount,roadmap.headlineKeyResults.length);
  snapshot.run('originalRenderBaseline(FALLBACK);originalRenderRoadmapFallback(FALLBACK);originalRenderNext(FALLBACK)');
  for(const [id,value] of Object.entries({'metric-objectives':fallback.baseline.objectives,'metric-krs':fallback.baseline.keyResults,
    'metric-epics':fallback.baseline.epics,'metric-features':fallback.baseline.features,'metric-headline-krs':metadata.headlineKeyResultCount,
    'roadmap-retained-measures':fallback.baseline.keyResults,'roadmap-baseline':metadata.planning.baseline,
    'roadmap-quarter':metadata.planning.evidenceQuarter,'roadmap-horizon':metadata.planning.horizon})){
    assert.equal(snapshot.elements.get(id).textContent,String(value),id);
    const html=fs.readFileSync('portfolio/index.html','utf8');
    assert.ok(html.includes('id="'+id+'">'+value+'<'),'Static '+id+' must match committed snapshot');
  }
  assert.equal(snapshot.elements.get('roadmap-relationship-list').children.length,roadmap.objectives.length);
  snapshot.run('originalRenderDeliveryOutlook(null)');
  assert.equal(snapshot.elements.get('delivery-outlook-grid').children.length,0,'Fallback cannot show seeded milestone narratives');
  assert.equal(snapshot.elements.get('delivery-outlook-focus').textContent,'Unavailable');
  assert.ok(snapshot.elements.get('roadmap-time-note').textContent.includes(metadata.date));
  assert.match(fallback.portfolioFocus.next.join(' '),/Current next actions are unavailable/);
  assert.doesNotMatch(JSON.stringify(fallback),/EDA-06/);
  const good = harness();
  assert.equal(good.run('validPortfolioBundle(bundle)'),true);
  await good.run('loadPortfolio()');
  assert.equal(good.requests.length,1);
  assert.match(good.requests[0],/portfolio-bundle\.json/);
  assert.equal(good.errors.length,0);
  assert.ok(good.renders.some(([kind])=>kind==='roadmap'));
  for(const mutate of [
    b=>b.roadmap.sourceCommitment='b'.repeat(64),
    b=>b.roadmap.roadmapCommitment='b'.repeat(64),
    b=>b.dashboard.baseline.features++,
    b=>b.roadmap.generatedAt='2099-01-01',
    b=>b.roadmap.headlineKeyResults[0].epicContributions=[],
    b=>b.presentation.milestones[0].critical=['EP-99'],
    b=>b.presentation.deliveryFocus.epic='EP-99',
    b=>b.roadmap.epics['EP-01'].completionPercent=101,
    b=>b.dashboard.products[0].evidence=['PrivatePartner','secret-repo'].join('/'),
    b=>b.dashboard.products[0].versions={[['PrivatePartner','secret-repo'].join('/') ]:'v1'},
    b=>b.roadmap.epics['EP-01'].progressBasis='//s.internal',
    b=>b.presentation.deliveryFocus.copy='a'.repeat(40),
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
  assert.equal(offline.elements.get('live-posture').textContent,'SNAPSHOT · LIVE TELEMETRY UNAVAILABLE');
  assert.equal(offline.elements.get('portability-state').textContent,'UNAVAILABLE');
  assert.equal(offline.elements.get('focus-state').textContent,'UNAVAILABLE');
  assert.equal(offline.elements.get('focus-state-detail').textContent,'Valid live bundle required');
  assert.match(offline.elements.get('focus-caption-text').textContent,/require a valid live bundle/);
  const staticHtml=fs.readFileSync('portfolio/index.html','utf8');
  assert.ok(staticHtml.includes('id="focus-state">UNAVAILABLE<'));
  assert.doesNotMatch(staticHtml,/EP-16 is the (?:active|current) delivery focus|EDA-06|GHE-07 is externally blocked/);
  assert.match(offline.run('DELIVERY_FOCUS.increment'),/unavailable/);
  assert.doesNotMatch(offline.run('JSON.stringify(DELIVERY_FOCUS)'),/EDA-06/);
  // A later failed refresh cannot retain the preceding live focus as fallback.
  good.context.fetch=async()=>{throw new Error('offline refresh');};
  good.run("DELIVERY_FOCUS.increment='STALE LIVE FOCUS'");
  await good.run('loadPortfolio()');
  assert.equal(good.run('DELIVERY_FOCUS.increment'),'Live telemetry unavailable');
  offline.context.fetch=async()=>({ok:true,json:async()=>offline.context.bundle});
  await offline.run('loadPortfolio()');
  assert.ok(!offline.shown.has('sync-error')&&!offline.shown.has('roadmap-map-error'),'Valid recovery must clear unavailable banners');
  assert.ok(offline.renders.some(([kind])=>kind==='roadmap'));
  const changed=harness();
  changed.context.bundle.presentation.deliveryFocus.increment='Next accepted increment';
  changed.context.bundle.roadmap.epics['EP-02'].completionPercent=50;
  await changed.run('loadPortfolio()');
  assert.equal(changed.run('DELIVERY_FOCUS.increment'),'Next accepted increment');
  assert.equal(changed.renders.find(([kind])=>kind==='roadmap')[1].epics['EP-02'].completionPercent,50);
  console.log('Portfolio bundle: valid rendering, canonical focus, atomic rejection and offline fallback PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});

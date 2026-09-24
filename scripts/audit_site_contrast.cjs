const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const AxeBuilder=require(process.env.AXE_MODULE||'@axe-core/playwright').default;
const mode=process.env.CONTRAST_VIEWPORT||'desktop';
const viewport=mode==='mobile'?{width:390,height:844}:{width:1440,height:1000};
const root=process.cwd(),base=process.env.CONTRAST_BASE_URL||'http://127.0.0.1:8765';
function pages(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(item=>{
  if(item.name.startsWith('.')||item.name==='node_modules')return [];
  const file=path.join(dir,item.name);
  return item.isDirectory()?pages(file):item.name.endsWith('.html')?[file]:[];
});}
(async()=>{
  const launch={headless:true};
  if(process.env.CHROMIUM_MODULE){const module=require(process.env.CHROMIUM_MODULE);const binary=module.default||module;launch.executablePath=await binary.executablePath();launch.args=binary.args;}
  const browser=await chromium.launch(launch);
  const reports=[],unique=new Map(),reviews=new Map();
  const output=`/tmp/site-contrast-${mode}`;fs.mkdirSync(output,{recursive:true});
  try{
    const context=await browser.newContext({viewport});
    const page=await context.newPage();
    page.setDefaultTimeout(15000);
    async function analyze(route,state){
      const result=await new AxeBuilder({page}).withRules(['color-contrast']).analyze();
      const summarize=node=>({target:node.target,html:node.html,checks:[...node.any,...node.all,...node.none].map(c=>({message:c.message,data:c.data}))});
      const violations=result.violations.flatMap(v=>v.nodes.map(summarize));
      const incomplete=result.incomplete.flatMap(v=>v.nodes.map(summarize));
      reports.push({route,state,viewport,violations,incomplete});
      for(const item of violations)unique.set(JSON.stringify([route,item.target,item.checks]),{route,state,...item});
      for(const item of incomplete)reviews.set(JSON.stringify([route,item.target,item.checks]),{route,state,...item});
      if(state==='default')await page.screenshot({path:`${output}/${route.replace(/\W+/g,'_')||'home'}.png`});
      console.log('SCANNED',mode,route,state,violations.length,incomplete.length);
      fs.writeFileSync(`${output}/report.json`,JSON.stringify({mode,reports,violations:[...unique.values()],review:[...reviews.values()]},null,2));
    }
    async function audit(route,state){
      await analyze(route,state);
      // Axe cannot resolve CSS gradients. Check both luminance endpoints as well.
      // This is a test-only background substitution; production styles are restored.
      for(const endpoint of ['dark','light']){
        await page.evaluate(endpoint=>{
          const parse=color=>{const n=color.match(/[\d.]+/g)?.map(Number);return n&&n.length>=3?[...n.slice(0,3),n[3]??1]:[255,255,255,1];};
          const blend=(a,b)=>a.slice(0,3).map((v,i)=>v*a[3]+b[i]*(1-a[3]));
          const lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
          window.__contrastRestore=[];
          for(const el of document.querySelectorAll('*')){
            const style=getComputedStyle(el);if(!style.backgroundImage.includes('gradient('))continue;
            const stops=(style.backgroundImage.match(/rgba?\([^)]*\)/g)||[]).map(parse);
            if(!stops.length)continue;
            const opaque=stops.filter(c=>c[3]===1);
            let base=[255,255,255];
            for(let parent=el.parentElement;parent;parent=parent.parentElement){const c=parse(getComputedStyle(parent).backgroundColor);if(c[3]===1){base=c;break;}}
            const backgrounds=opaque.length?opaque:[blend(parse(style.backgroundColor),base)];
            const choices=backgrounds.flatMap(bg=>[bg,...stops.filter(c=>c[3]>0&&c[3]<1).map(c=>blend(c,bg))]).sort((a,b)=>lum(a)-lum(b));
            const selected=endpoint==='dark'?choices[0]:choices.at(-1);
            window.__contrastRestore.push([el,el.getAttribute('style')]);
            el.style.setProperty('background-image','none','important');
            el.style.setProperty('background-color',`rgb(${selected.slice(0,3).map(Math.round).join(',')})`,'important');
          }
        },endpoint);
        try{await analyze(route,state+' / gradient-'+endpoint);}
        finally{await page.evaluate(()=>{for(const [el,style] of window.__contrastRestore){if(style===null)el.removeAttribute('style');else el.setAttribute('style',style);}delete window.__contrastRestore;});}
      }
    }
    for(const file of pages(root).sort()){
      const route='/'+path.relative(root,file).replace(/index\.html$/,'');
      if(process.env.CONTRAST_ROUTES&&!process.env.CONTRAST_ROUTES.split(',').includes(route))continue;
      await page.goto(base+route,{waitUntil:'networkidle'});
      await audit(route,'default');
      // Expose navigation text that is hidden at the initial viewport.
      const menu=page.locator(mode==='mobile'?'.mobile-nav':'.nav-products');
      if(await menu.count()&&await menu.isVisible()){
        await menu.evaluate(el=>el.open=true);await audit(route,'navigation');await menu.evaluate(el=>el.open=false);
      }
      if(route==='/console/demo/'){
        for(const name of ['findings','product','planning','evidence','traceability','decision']){
          await page.locator(`[data-view-target="${name}"]:visible`).first().click();await audit(route,name);
        }
      }
      if(route==='/assurance/demo/'){
        for(const selector of ['[data-scenario="expired"]','[data-scenario="approver"]','[data-scenario="rollback"]','[data-assurance-tab="sentry"]','[data-sentry-scenario="corrected"]','[data-assurance-tab="custody"]','[data-custody-scenario="broadened"]']){
          const button=page.locator(selector);if(await button.count()&&await button.isVisible()){await button.click();await page.waitForTimeout(100);await audit(route,selector);}
        }
      }
      if(route==='/assurance/portal/'){
        for(const value of ['security','governance']){await page.locator('#record-audience').selectOption(value);await audit(route,value);}
        await page.locator('.portal-order-card details').first().evaluate(el=>el.open=true);await audit(route,'evidence details');
      }
    }
    fs.writeFileSync(`${output}/report.json`,JSON.stringify({mode,reports,violations:[...unique.values()],review:[...reviews.values()]},null,2));
    for(const item of unique.values())console.log('CONTRAST',JSON.stringify(item));
    for(const item of reviews.values())console.log('REVIEW',JSON.stringify(item));
    console.log('SUMMARY',JSON.stringify({mode,states:reports.length,pages:new Set(reports.map(r=>r.route)).size,violations:unique.size,manualReview:reviews.size}));
    if(unique.size)process.exitCode=1;
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

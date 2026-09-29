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
  const reports=[],unique=new Map(),reviews=new Map(),verified=new Map();
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
      if(state.includes(' / gradient-'))for(const rule of result.passes)for(const node of rule.nodes){const key=JSON.stringify([route,node.target]);if(!verified.has(key))verified.set(key,new Set());verified.get(key).add(state.split(' / gradient-')[1]);}
      // Gate unresolved text after the gradient passes. Decorative symbols have no text contrast requirement.
      if(state.includes(' / gradient-'))for(const node of incomplete){
        const checks=node.checks.filter(c=>!c.message.includes('only non-text characters'));
        if(!checks.length)continue;
        if(checks.every(c=>c.data?.fgColor&&c.data?.bgColor)){
          for(const c of checks)if(c.data.contrastRatio<parseFloat(c.data.expectedContrastRatio))violations.push(node);
          continue;
        }
        // Independently measure solid-color text that axe cannot hit-test reliably.
        // Only accept an unobstructed element; unknown images/opacity still fail closed.
        const measured=checks.every(c=>['elmPartiallyObscured','bgOverlap'].includes(c.data?.messageKey))&&await page.evaluate(({target})=>{
          if(target.length!==1)return null;
          const el=document.querySelector(target[0]);if(!el)return null;
          const old=[scrollX,scrollY];el.scrollIntoView({block:'center',inline:'center',behavior:'instant'});
          const rect=el.getBoundingClientRect();
          const hit=document.elementFromPoint(Math.max(0,Math.min(innerWidth-1,rect.x+rect.width/2)),Math.max(0,Math.min(innerHeight-1,rect.y+rect.height/2)));
          scrollTo({left:old[0],top:old[1],behavior:'instant'});
          if(hit!==el&&!el.contains(hit)){
            // Transparent arrow boxes and clipped timing pills do not change the text colors.
            const hs=hit&&getComputedStyle(hit);
            if(!el.matches('.roadmap-time-pill')&&(!hs||hs.backgroundColor!=='rgba(0, 0, 0, 0)'||hs.backgroundImage!=='none'||hs.boxShadow!=='none'))return null;
          }
          const parse=s=>s.match(/[\d.]+/g)?.map(Number);
          const blend=(a,b)=>a.slice(0,3).map((v,i)=>v*(a[3]??1)+b[i]*(1-(a[3]??1)));
          const chain=[],filters=[];for(let n=el;n;n=n.parentElement){const s=getComputedStyle(n);if(s.backgroundImage!=='none'||Number(s.opacity)!==1)return null;const color=parse(s.backgroundColor);if(s.filter!=='none'){const match=s.filter.match(/^saturate\(([\d.]+)\)$/);if(!match||(color[3]??1)!==1||filters.length)return null;filters.push(Number(match[1]));}chain.push(color);}
          let bg=[255,255,255];for(const c of chain.reverse())bg=blend(c,bg);
          const style=getComputedStyle(el);let fg=blend(parse(style.color),bg);
          // CSS saturate() on the opaque completed-action card affects both colors.
          for(const amount of filters){const saturate=c=>{const gray=c[0]*.213+c[1]*.715+c[2]*.072;return c.map(v=>Math.max(0,Math.min(255,gray+(v-gray)*amount)));};fg=saturate(fg);bg=saturate(bg);}
          const lum=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
          return (Math.max(lum(fg),lum(bg))+.05)/(Math.min(lum(fg),lum(bg))+.05);
        },{target:node.target});
        if(!measured||measured<Math.max(...checks.map(c=>parseFloat(c.data?.expectedContrastRatio)||4.5)))violations.push({...node,unresolved:!measured,measured});
      }
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
        const decorationStyle=await page.addStyleTag({content:'.metric-card::before,.roadmap-objective-summary::after,.roadmap-kr-summary::after,.roadmap-headline-summary::after,.roadmap-measure-summary::after,.trust-node::after,.evidence-chain article::after{display:none!important}'});
        try{await analyze(route,state+' / gradient-'+endpoint);}
        finally{await decorationStyle.evaluate(el=>el.remove());await page.evaluate(()=>{for(const [el,style] of window.__contrastRestore){if(style===null)el.removeAttribute('style');else el.setAttribute('style',style);}delete window.__contrastRestore;});}
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
      if(route==='/portfolio/'){
        // Exercise the full roadmap renderer even when the external telemetry feed is unavailable.
        await page.evaluate(async()=>{const response=await fetch('/data/roadmap-relationships.json');renderRoadmapRelationships(await response.json());});
        await audit(route,'local roadmap renderer');
      }
      const disclosures=page.locator('main details');
      if(await disclosures.count()){
        const original=await disclosures.evaluateAll(items=>items.map(el=>el.open));
        await disclosures.evaluateAll(items=>items.forEach(el=>el.open=true));
        await audit(route,'expanded details');
        await disclosures.evaluateAll((items,original)=>items.forEach((el,i)=>el.open=original[i]),original);
      }
      if(route==='/console/demo/'){
        for(const name of ['findings','product','planning','evidence','traceability','decision']){
          await page.locator(`[data-view-target="${name}"]:visible`).first().click();await audit(route,name);
        }
      }
      if(route==='/console/demo/'){
        const orders=await page.locator('[data-order-id]:visible').evaluateAll(items=>[...new Set(items.map(el=>el.dataset.orderId))]);
        for(const id of orders){await page.locator(`[data-order-id="${id}"]:visible`).first().click();await audit(route,'order '+id);}
        await page.locator('#tamper-demo').click();await audit(route,'tampered evidence');
      }
      if(route==='/northstar-signal/demo/'){
        for(const role of ['leader','manager','delivery']){
          await page.locator(`[data-role="${role}"]`).click();await audit(route,'role '+role);
        }
        for(const scenario of ['decision','delivered','measured']){
          await page.locator(`[data-scenario="${scenario}"]`).click();
          for(const view of ['okr','composer','leadership','management','decision','authorization','evidence','lineage','handoff','outcome']){
            await page.locator(`[data-view="${view}"]`).click();await audit(route,'scenario '+scenario+' / view '+view);
          }
          await page.locator('[data-view="lineage"]').click();
          const currentLineage=await page.locator('#northstar-view').innerText();
          if(!/WHAT THIS MEANS/.test(currentLineage)||!/WHY IT MATTERS/.test(currentLineage)||!/WHAT NEEDS ATTENTION/.test(currentLineage)||!/ACCOUNTABLE ROLE/.test(currentLineage)||!/WHAT HAPPENS NEXT/.test(currentLineage))throw new Error('Northstar lineage must translate technical lineage into leadership meaning');
          if(await page.locator('[data-lineage-ask-input]').count()!==1||await page.locator('[data-lineage-ask-submit]').count()!==1||await page.locator('.ns-lineage-technical summary').count()!==1)throw new Error('Northstar lineage must expose Ask Northstar and collapsible technical proof');
          await page.locator('[data-lineage-question="why"]').click();
          if(!/NORTHSTAR EXPLAINS/.test(await page.locator('#northstar-view').innerText()))throw new Error('Ask Northstar guided explanation must answer contextual leadership questions');
          await page.locator('[data-lineage-objective-root="O10"]').click();
          await page.locator('[data-lineage-kr="KR10.2"]').click();
          await page.locator('[data-lineage-question="authority"]').click();
          if(!/No current Capability Authorization Record is bound to this path/.test(await page.locator('#northstar-view').innerText()))throw new Error('Ask Northstar must not imply authority when no current CAR exists');
          await page.locator('[data-lineage-objective-root="O10"]').click();
          await page.locator('[data-lineage-kr="KR10.1"]').click();
          await page.locator('[data-lineage-scenario="stale"]').click();
          await page.locator('[data-lineage-node="car"]').click();
          await page.locator('[data-lineage-ask-input]').fill('Why is this revision stale?');
          await page.locator('[data-lineage-ask-submit]').click();
          if(!/does not match the current bound revision/.test(await page.locator('#northstar-view').innerText()))throw new Error('Specific stale-revision questions must receive the actionable stale-revision explanation');
          await page.locator('[data-lineage-objective-root="O11"]').click();
          if(await page.locator('.ns-lineage-answer').count())throw new Error('Ask Northstar answer must clear when Objective or KR browsing context changes');
          if(!/LINEAGE INTEGRITY\s+(VERIFIED|READY FOR ASSURANCE|PENDING AUTHORIZATION)/.test(currentLineage)||!/Outcome measurement\s+Northstar/.test(currentLineage)||!/Evidence integrity\s+Assurance/.test(currentLineage))throw new Error('Northstar recursive lineage must truthfully render the current strategy-to-evidence state');
          if(await page.locator('[data-lineage-objective-root]').count()!==3)throw new Error('Northstar recursive lineage must expose all three approved Objective roots');
          if(!/APPROVED OBJECTIVE NODES/.test(currentLineage)||!/OBJECTIVE\s+O9/.test(currentLineage)||/STRATEGIC OUTCOME/.test(currentLineage))throw new Error('Northstar recursive lineage must begin at approved Objective nodes and must not present Strategic Outcome Management in this release');
          await page.locator('[data-lineage-objective-root="O10"]').click();
          if(!/O10\s+Increase reuse of governed infrastructure products/.test(await page.locator('#northstar-view').innerText()))throw new Error('Northstar Objective roots must be selectable');
          await page.locator('[data-lineage-kr="KR10.2"]').click();
          if(!/KEY RESULT\s+KR10\.2/.test(await page.locator('#northstar-view').innerText()))throw new Error('Northstar selected Objective must expose selectable child KRs');
          await page.locator('[data-lineage-step="down"]').click();
          if(!/SELECTED NODE\s+DECISION/.test(await page.locator('#northstar-view').innerText()))throw new Error('Northstar lineage must drill down from KR to Decision');
          await page.locator('[data-lineage-step="up"]').click();
          if(!/SELECTED NODE\s+KEY RESULT/.test(await page.locator('#northstar-view').innerText()))throw new Error('Northstar lineage must drill back up to the parent node');
          await page.locator('[data-lineage-objective-root="O9"]').click();
          if(/PENDING AUTHORIZATION/.test(currentLineage)&&(/CE-EP-23-KR9\.4/.test(currentLineage)||/AE-0001/.test(currentLineage)))throw new Error('Northstar must not fabricate contribution or Assurance evidence before current authorization exists');
          for(const failure of ['wrongKr','stale','expanded']){
            await page.locator('[data-lineage-scenario="'+failure+'"]').click();
            const failed=await page.locator('#northstar-view').innerText();
            if(!/LINEAGE INTEGRITY\s+REJECTED/.test(failed)||!/Fail closed\./.test(failed))throw new Error('Northstar recursive lineage scenario '+failure+' must fail closed');
            if(failure==='wrongKr'&&!/Candidate replay target · selected KR definition is not inherited across coordinates/.test(failed))throw new Error('Wrong-KR replay must not pair a substituted KR ID with the selected KR definition');
          }
          await page.locator('[data-lineage-scenario="current"]').click();
          const recovered=await page.locator('#northstar-view').innerText();
          if(!/LINEAGE INTEGRITY\s+(VERIFIED|READY FOR ASSURANCE|PENDING AUTHORIZATION)/.test(recovered))throw new Error('Northstar recursive lineage must recover to the truthful current state after negative tests');
          await page.locator('[data-view="okr"]').click();
          await page.locator('[data-compose-kr="KR10.1"]').click();
          await page.locator('[data-view="lineage"]').click();
          const selectedLineage=await page.locator('#northstar-view').innerText();
          if(!/O10 → KR10\.1/.test(selectedLineage)||/O9 → KR9\.4 → CPD-0001/.test(selectedLineage))throw new Error('Recursive lineage must derive from the selected OKR context without leaking the primary O9 path');
          await page.locator('[data-view="okr"]').click();
          await page.locator('[data-open-trail="KR9.4"]').click();
          await page.locator('[data-close-trail]').click();
          await page.locator('[data-view="okr"]').click();
          const trail=page.locator('[data-open-trail="KR9.4"]');
          if(await trail.count()!==1)throw new Error('Northstar KR9.4 trace trigger must exist exactly once for scenario '+scenario);
          if(!await trail.isVisible())throw new Error('Northstar KR9.4 trace trigger must be visible for scenario '+scenario);
          await trail.click();
          const dialog=page.locator('#ns-trail-dialog[open]');
          if(await dialog.count()!==1)throw new Error('Northstar trace drawer must open for scenario '+scenario);
          const close=page.locator('[data-close-trail]');
          if(await close.count()!==1||!await close.isVisible())throw new Error('Northstar trace drawer close control must be visible for scenario '+scenario);
          await audit(route,'scenario '+scenario+' / trace drawer');
          await close.click();
          if(await page.locator('#ns-trail-dialog[open]').count())throw new Error('Northstar trace drawer must close for scenario '+scenario);
        }
        await page.locator('[data-view="okr"]').click();
        const composeKr=page.locator('[data-compose-kr="KR10.2"]');
        if(await composeKr.count()!==1)throw new Error('Leader persona must be able to choose a specific KR for management decomposition');
        await composeKr.click();
        const unsupportedComposer=await page.locator('.ns-management-composer').innerText();
        if(!/1 AUTHORIZED KR AVAILABLE/.test(unsupportedComposer)||!/O10 → KR10.1/.test(unsupportedComposer)||!/CAR-0002/.test(unsupportedComposer)||await page.locator('[data-management-kr-check="CPD-0002"]').count()!==1)throw new Error('Manager persona must preserve the selected page context while exposing the independent pool of current CAR-backed KRs');
        await page.locator('[data-view="evidence"]').click();
        const unsupportedEvidence=await page.locator('#northstar-view').innerText();
        if(!/O10 → KR10.2/.test(unsupportedEvidence)||!/No authorization decision bound/.test(unsupportedEvidence)||/CPD-0001/.test(unsupportedEvidence)||/CAR-0001/.test(unsupportedEvidence))throw new Error('Evidence view must fail closed for a selected KR with no authorization contract');
        await page.locator('[data-view="okr"]').click();
        await page.locator('[data-compose-kr="KR10.1"]').click();
        if(!/O10 → KR10.1/.test(await page.locator('.ns-management-composer').innerText())||await page.locator('[data-management-kr-check="CPD-0002"]').count()!==1)throw new Error('Manager persona must receive the current authorized non-primary KR context without requiring duplicate confirmation');
        const o10ManagementView=await page.locator('#northstar-view').innerText();
        if(!/O10 → KR10.1/.test(await page.locator('.ns-management-composer').innerText())||await page.locator('[data-management-draft]').count()!==1||!/Delivery state\s+ACTIVE/.test(o10ManagementView)||/Delivery state\s+READY/.test(o10ManagementView))throw new Error('CPD-0002 confirmation must return to selected O10/KR10.1 management context with selected-KR delivery state');
        await page.locator('[data-view="decision"]').click();
        const o10Decision=await page.locator('#northstar-view').innerText();
        if(!/CPD-0002 · DECISION BRIEF/.test(o10Decision)||!/Standardize a reusable data-platform foundation product/.test(o10Decision)||/Create a reusable managed-network foundation product/.test(o10Decision))throw new Error('Decision view must remain bound to the selected O10/KR10.1 authorization context');
        if(!/CONTEXT BEFORE DECISION/.test(o10Decision)||!/ORGANIZATIONAL PROFILE/.test(o10Decision)||!/CAPABILITY \+ REUSE/.test(o10Decision)||!/INVESTMENT \+ TCO/.test(o10Decision)||!/EVIDENCE \+ CONFIDENCE/.test(o10Decision)||!/EXPECTED BENEFIT/.test(o10Decision)||!/REUSE/.test(o10Decision)||!/BUILD/.test(o10Decision)||!/PHASE/.test(o10Decision)||!/DEFER/.test(o10Decision)||!/REDIRECT/.test(o10Decision)||!/Synthetic demo boundary/.test(o10Decision))throw new Error('Decision view must expose the bounded product-page decision context and full accountable choice set');
        await page.locator('[data-view="leadership"]').click();
        const o10Leadership=await page.locator('#northstar-view').innerText();
        if(!/O10 · KR10.1/.test(o10Leadership)||!/CPD-0002/.test(o10Leadership)||!/CAR-0002/.test(o10Leadership)||!/ACTIVE/.test(o10Leadership)||!/ON TRACK/.test(o10Leadership)||/CPD-0001/.test(o10Leadership)||/EP-23/.test(o10Leadership))throw new Error('Leadership detail must remain bound to selected O10/KR10.1 decision, authorization, delivery and benefit context');
        await page.locator('[data-view="evidence"]').click();
        const o10Evidence=await page.locator('#northstar-view').innerText();
        if(!/O10 → KR10.1/.test(o10Evidence)||!/CPD-0002/.test(o10Evidence)||!/CAR-0002/.test(o10Evidence)||!/Standardize a reusable data-platform foundation product/.test(o10Evidence)||/CPD-0001/.test(o10Evidence)||/CAR-0001/.test(o10Evidence)||/managed-network/.test(o10Evidence))throw new Error('Evidence view must remain bound to selected O10/KR10.1 evidence without primary-KR leakage');
        await page.locator('[data-view="authorization"]').click();
        await page.locator('[data-view="management"]').click();
        if(await page.locator('[data-management-intent]').count()!==1)throw new Error('Management Composer must expose management intent when any current CAR-backed KR exists, even if the selected KR is not yet authorized');
        const seededAuthorizedChoices=page.locator('[data-management-kr-check]');
        if(await seededAuthorizedChoices.count()!==1||await seededAuthorizedChoices.first().getAttribute('data-management-kr-check')!=='CPD-0002')throw new Error('Management Composer must discover every current CAR-backed KR in management scope independently of selected page context');
        if(!await seededAuthorizedChoices.first().isChecked())throw new Error('When exactly one authorized KR is available, Management Composer should preselect it for composition');
        const seededComposerText=await page.locator('.ns-management-composer').innerText();
        if(!/1 AUTHORIZED KR AVAILABLE/.test(seededComposerText)||!/O10 → KR10.1/.test(seededComposerText)||!/CAR-0002/.test(seededComposerText)||/AUTHORIZATION REQUIRED/.test(seededComposerText))throw new Error('Default Management Composer must foreground the authorized KR pool rather than the selected unauthorized KR');
        await page.locator('[data-management-draft]').click();
        if(!/Reusable Data Platform Foundation/.test(await page.locator('[data-management-proposal]').first().innerText()))throw new Error('Composite AI must draft from the discovered authorized KR rather than an unauthorized selected KR');
        await page.locator('[data-management-reject]').click();
        await page.locator('[data-view="authorization"]').click();
        await page.locator('[data-auth-select="CPD-0001"]').click();
        await page.locator('[data-auth-action="approve"][data-auth-id="CPD-0001"]').click();
        await page.locator('[data-authorize-item="CPD-0001"]').click();
        await page.locator('[data-confirm-authorization]').click();
        await page.locator('[data-view="management"]').click();
        if(await page.locator('[data-management-intent]').count()!==1)throw new Error('Management Composer must expose a management-intent text box');
        if(await page.locator('[data-management-kr-check]').count()<1)throw new Error('Management Composer must expose selectable authorized KRs');
        await page.locator('[data-management-intent]').fill('Create one reusable platform Epic that preserves both authorized outcomes and their independent CAR evidence.');
        const authorizedChoices=page.locator('[data-management-kr-check]');
        if(await authorizedChoices.count()<2)throw new Error('Management Composer multi-KR demo requires at least two currently authorized KRs after CPD-0001/CPD-0002 confirmation');
        for(let i=0;i<await authorizedChoices.count();i++){const box=authorizedChoices.nth(i);if(!await box.isChecked())await box.check();}
        await page.locator('[data-management-draft]').click();
        const o10ProposalText=await page.locator('.ns-management-composer').innerText();
        if(!/Cross-KR Authorized Outcome Epic/.test(o10ProposalText)||!/CPD-0001/.test(o10ProposalText)||!/CPD-0002/.test(o10ProposalText)||!/CAR scope binding\s+Every proposed Epic remains bound to the exact current CAR outcome and scope/i.test(o10ProposalText))throw new Error('Selecting multiple authorized KRs must generate a cross-KR Epic bound to the exact selected CAR set');
        await page.locator('[data-management-accept]').click();
        await page.locator('.ns-view-nav [data-view="lineage"]').click();
        const multiLineage=await page.locator('#northstar-view').innerText();
        if(!/O10 → KR10\.1/.test(multiLineage)||!/LINEAGE INTEGRITY\s+READY FOR ASSURANCE/.test(multiLineage)||!/INFRASTRUCTURE PRODUCT\s+NOT BOUND/.test(multiLineage))throw new Error('Selected O10 lineage must accept the multi-KR Epic only because its exact O10 binding is present and must not invent a product identity');
        const acceptedBeforeBrowse=await page.locator('#northstar-view').innerText();
        await page.locator('[data-lineage-objective-root="O11"]').click();
        await page.locator('[data-lineage-objective-root="O10"]').click();
        await page.locator('[data-lineage-kr="KR10.1"]').click();
        const acceptedAfterBrowse=await page.locator('#northstar-view').innerText();
        if(!/LINEAGE INTEGRITY\s+READY FOR ASSURANCE/.test(acceptedAfterBrowse)||!/EP-CANDIDATE-MULTI-01/.test(acceptedAfterBrowse))throw new Error('Browsing other Objective/KR roots must not invalidate an accepted Epic or its exact lineage');
        await page.locator('[data-lineage-objective-root="O11"]').click();
        if(!/O11 → KR11\.1/.test(await page.locator('#northstar-view').innerText()))throw new Error('Lineage browsing must allow read-only navigation to another approved Objective');
        await page.locator('[data-lineage-objective-root="O10"]').click();
        await page.locator('[data-lineage-kr="KR10.1"]').click();
        const restoredMultiLineage=await page.locator('#northstar-view').innerText();
        if(!/O10 → KR10\.1/.test(restoredMultiLineage)||!/LINEAGE INTEGRITY\s+READY FOR ASSURANCE/.test(restoredMultiLineage))throw new Error('Browsing another Objective must not clear accepted Epic or authorization state');
        await page.locator('.ns-view-nav [data-view="handoff"]').click();
        const o10Handoff=await page.locator('.ns-handoff-package').innerText();
        if(!/CPD-0001/.test(o10Handoff)||!/CPD-0002/.test(o10Handoff)||!/CAR-0001/.test(o10Handoff)||!/CAR-0002/.test(o10Handoff)||!/Cross-KR Authorized Outcome Epic/.test(o10Handoff))throw new Error('Delivery must receive a multi-KR Epic with every selected Objective/KR/decision/CAR binding preserved');
        const o10Airlock=await page.locator('.ns-airlock').innerText();
        if(!/O9 → KR9.4/.test(o10Airlock)||!/O10 → KR10.1/.test(o10Airlock)||!/CAR-0001/.test(o10Airlock)||!/CAR-0002/.test(o10Airlock))throw new Error('Multi-KR delivery airlock must preserve each selected KR/CAR lineage');
        const o10Feedback=await page.locator('.ns-handoff-feedback').innerText();
        await page.locator('[data-view="management"]').click();
        const choicesAfterMulti=page.locator('[data-management-kr-check]');
        for(let i=0;i<await choicesAfterMulti.count();i++){const box=choicesAfterMulti.nth(i);if(await box.getAttribute('data-management-kr-check')==='CPD-0002')await box.uncheck();else if(!await box.isChecked())await box.check();}
        await page.locator('[data-management-intent]').fill('Create the managed-network Epic only from the checked authorization.');
        await page.locator('[data-management-draft]').click();
        const singleProposalCard=await page.locator('[data-management-proposal]').first().innerText();
        const singleComposerText=await page.locator('.ns-management-composer').innerText();
        const cpd1Checked=await page.locator('[data-management-kr-check="CPD-0001"]').isChecked();
        const cpd2Checked=await page.locator('[data-management-kr-check="CPD-0002"]').isChecked();
        if(!cpd1Checked||cpd2Checked)throw new Error('Single-KR composition must preserve the exact checked authorization set');
        await page.locator('[data-management-accept]').click();
        await page.locator('.ns-view-nav [data-view="lineage"]').click();
        const mismatchedAcceptedLineage=await page.locator('#northstar-view').innerText();
        if(!/O10 → KR10\.1/.test(mismatchedAcceptedLineage)||!/PENDING AUTHORIZATION/.test(mismatchedAcceptedLineage)||/CE-EP-23-KR10\.1/.test(mismatchedAcceptedLineage))throw new Error('An accepted Epic bound only to O9/KR9.4 must not be consumed as O10/KR10.1 lineage');
        await page.locator('.ns-view-nav [data-view="management"]').click();
        if(!/Managed Network Foundation/.test(singleProposalCard)||/Reusable Data Platform Foundation/.test(singleProposalCard)||!/Create the managed-network Epic only from the checked authorization/.test(singleProposalCard)||!/CAR scope binding\s+Every proposed Epic remains bound to the exact current CAR outcome and scope/i.test(singleComposerText))throw new Error('Single-KR generation must derive its proposal and management intent from the checked authorization rather than the page context');
        if(!/MANAGEMENT ACCEPTED/.test(await page.locator('.ns-management-composer').innerText()))throw new Error('Single-KR proposal acceptance must remain intact after lineage inspection');
        await page.locator('[data-management-intent]').fill('Revised managed-network intent must invalidate the visible proposal immediately.');
        const afterIntentEdit=await page.locator('.ns-management-composer').innerText();
        if(await page.locator('[data-management-proposal]').count()||await page.locator('[data-management-accept]').count()||/MANAGEMENT ACCEPTED/.test(afterIntentEdit)||await page.locator('[data-view="handoff"].primary').count())throw new Error('Editing management intent must immediately remove stale proposal and acceptance UI');
        if(await page.locator('[data-management-draft]').count()!==1)throw new Error('Editing management intent must return the composer to a fresh draftable state');
        await page.locator('[data-management-draft]').click();
        await page.locator('[data-management-accept]').click();
        await page.locator('[data-view="authorization"]').click();
        await page.locator('[data-auth-select="CPD-0002"]').click();
        await page.locator('[data-auth-action="conditional"][data-auth-id="CPD-0002"]').click();
        await page.locator('[data-authorize-item="CPD-0002"]').click();
        await page.locator('[data-confirm-authorization]').click();
        await page.locator('.ns-view-nav [data-view="handoff"]').click();
        const preservedSingleHandoff=await page.locator('.ns-handoff-package').innerText();
        if(!/CAR-0001/.test(preservedSingleHandoff)||/CAR-0002/.test(preservedSingleHandoff)||!/Managed Network Foundation/.test(preservedSingleHandoff))throw new Error('Changing an unselected page-context CAR must not invalidate a single-KR Epic sourced only from CPD-0001');
        await page.locator('[data-view="management"]').click();
        const preservedComposer=await page.locator('.ns-management-composer').innerText();
        if(!/MANAGEMENT ACCEPTED/.test(preservedComposer)||!/CPD-0001/.test(preservedComposer)||!/CAR-0001/.test(preservedComposer)||/AUTHORIZATION REQUIRED/.test(preservedComposer))throw new Error('Management Composer must remain available from accepted source bindings even when the page-context authorization is no longer current');
        if(!/ACTIVE/.test(o10Feedback)||!/ON TRACK/.test(o10Feedback)||/READY/.test(o10Feedback)||/UNKNOWN/.test(o10Feedback))throw new Error('Delivery feedback must use the selected O10/KR10.1 signals rather than the KR9.4 scenario');
        await page.locator('[data-view="outcome"]').click();
        const o10Outcome=await page.locator('#northstar-view').innerText();
        if(!/O10 → KR10.1/.test(o10Outcome)||!/ACTIVE/.test(o10Outcome)||!/ON TRACK/.test(o10Outcome)||/KR9.4 authorization/.test(o10Outcome))throw new Error('Outcome feedback must remain bound to the selected O10/KR10.1 context');
        await page.locator('[data-view="authorization"]').click();
        await page.locator('[data-auth-select="CPD-0001"]').click();
        await page.locator('[data-auth-action="conditional"][data-auth-id="CPD-0001"]').click();
        await page.locator('[data-authorize-item="CPD-0001"]').click();
        await page.locator('[data-confirm-authorization]').click();
        await page.locator('.ns-view-nav [data-view="handoff"]').click();
        if(!/Management acceptance required/.test(await page.locator('#northstar-view').innerText())||await page.locator('.ns-handoff-package').count())throw new Error('Refreshing an actual source CAR must invalidate management acceptance and handoff');
        await page.locator('[data-view="okr"]').click();
        await page.locator('[data-open-trail="KR9.4"]').click();
        await page.locator('[data-close-trail]').click();
        await page.locator('[data-view="management"]').click();
        const resetManagement=await page.locator('.ns-management-composer').innerText();
        if(!/O9 → KR9.4/.test(resetManagement)||!/Propose Epics with Composite AI/.test(resetManagement)||/MANAGEMENT ACCEPTED/.test(resetManagement)||/Reusable Data Platform Foundation/.test(resetManagement))throw new Error('Changing selected KR through trace must invalidate prior management proposal and acceptance state');
        await page.locator('[data-view="okr"]').click();
        await page.locator('[data-compose-kr="KR11.1"]').click();
        const deferredManagement=await page.locator('.ns-management-composer').innerText();
        if(!/AUTHORIZED KR/.test(deferredManagement)||!/O9 → KR9.4/.test(deferredManagement)||!/CAR-0001/.test(deferredManagement)||await page.locator('[data-management-authorize]').count()||await page.locator('[data-management-draft]').count()!==1)throw new Error('A deferred selected page-context KR must not block composition from other current CAR-backed KRs or expose an impossible authorization continuation');
        await page.locator('[data-view="evidence"]').click();
        const deferredEvidence=await page.locator('#northstar-view').innerText();
        if(!/O11 → KR11.1/.test(deferredEvidence)||!/CPD-0004/.test(deferredEvidence)||!/deferred/i.test(deferredEvidence)||!/NOT DEMONSTRATED/.test(deferredEvidence)||!/INSUFFICIENT/.test(deferredEvidence)||/CAR-0001/.test(deferredEvidence))throw new Error('Deferred selected-KR evidence must remain explicitly insufficient and must not be represented as demonstrated product proof');
        await page.locator('[data-view="decision"]').click();
        const deferredDecision=await page.locator('#northstar-view').innerText();
        if(!/CPD-0004 · DECISION BRIEF/.test(deferredDecision)||!/MEDIUM EVIDENCE/.test(deferredDecision)||!/decision evidence insufficient/i.test(deferredDecision)||!/No new product investment should advance/.test(deferredDecision)||!/Portfolio Manager/.test(deferredDecision)||/managed-network/i.test(deferredDecision))throw new Error('Deferred Decision context must derive evidence, profile and investment framing from CPD-0004 rather than the primary managed-network fixture');
        // Legacy authorization and CAR-rebinding regressions require a pristine demo state.
        // Reload after the multi-persona journey so those tests prove their own invariants independently.
        await page.reload({waitUntil:'networkidle'});
        await page.locator('[data-scenario="decision"]').click();
        await page.locator('[data-view="okr"]').click();
        await page.locator('[data-compose-kr="KR9.4"]').click();
        const selectedPrimaryComposer=await page.locator('.ns-management-composer').innerText();
        if(!/1 AUTHORIZED KR AVAILABLE/.test(selectedPrimaryComposer)||!/O10 → KR10.1/.test(selectedPrimaryComposer)||!/CAR-0002/.test(selectedPrimaryComposer)||await page.locator('[data-management-draft]').count()!==1)throw new Error('Manager persona must preserve selected primary KR context while exposing the independent current CAR-backed KR pool');
        await page.locator('[data-view="authorization"]').click();
        await page.locator('[data-auth-select="CPD-0001"]').click();
        if(!/CPD-0001/.test(await page.locator('.ns-auth-detail').innerText()))throw new Error('Leader authorization continuation must preserve the selected KR decision');
        const authItems=page.locator('[data-auth-item]');
        if(await authItems.count()!==4)throw new Error('Northstar authorization queue must expose four independent synthetic decisions');
        const reuseSeed=await page.locator('[data-auth-item="CPD-0003"]').innerText();
        const deferredSeed=await page.locator('[data-auth-item="CPD-0004"]').innerText();
        if(!/REUSE EXISTING/.test(reuseSeed)||!/REUSE · NO NEW CAR/.test(reuseSeed))throw new Error('Northstar reuse fixture must not masquerade as an approved CAR');
        if(!/DEFERRED/.test(deferredSeed)||!/DEFERRED · NO CAR/.test(deferredSeed))throw new Error('Northstar insufficient-evidence fixture must remain deferred without a CAR');
        const beforeDecision=await page.locator('[data-auth-item="CPD-0002"]').innerText();
        await page.locator('[data-auth-select="CPD-0001"]').click();
        await page.locator('[data-auth-action="approve"][data-auth-id="CPD-0001"]').click();
        const selectedDetail=page.locator('.ns-auth-detail');
        const preConfirm=await selectedDetail.innerText();
        const preConfirmCard=await page.locator('[data-auth-item="CPD-0001"]').innerText();
        if(!/APPROVED/.test(preConfirm)||!/PENDING CONFIRMATION/.test(preConfirm)||!/Not confirmed · review exact authorization package/.test(preConfirm)||!/CAR NOT CONFIRMED/.test(preConfirmCard)||/CAR-0001/.test(preConfirmCard))throw new Error('Northstar approval decision must remain pending exact package confirmation with no CAR emitted');
        await page.locator('[data-authorize-item="CPD-0001"]').click();
        if(await page.locator('#ns-authorization-ceremony-dialog[open]').count()!==1)throw new Error('Approved Northstar item must require authorization ceremony');
        await page.locator('[data-confirm-authorization]').click();
        await page.locator('[data-view="authorization"]').click();
        if(!/CAR-0001/.test(await selectedDetail.innerText())||!/CURRENT/.test(await selectedDetail.innerText()))throw new Error('Confirmed Northstar package must emit its exact current CAR');
        const afterDecision=await page.locator('[data-auth-item="CPD-0002"]').innerText();
        if(beforeDecision!==afterDecision)throw new Error('Authorizing one Northstar queue item must not mutate another item');
        await audit(route,'Authorization Queue / independent item decisions');
        await page.locator('[data-auth-action="defer"][data-auth-id="CPD-0001"]').click();
        const invalidatedCard=await page.locator('[data-auth-item="CPD-0001"]').innerText();
        if(/CONFIRMED/.test(invalidatedCard)||/CAR-0001/.test(invalidatedCard))throw new Error('Material Northstar decision change must invalidate prior CAR receipt');
        await page.locator('[data-view="decision"]').click();
        const decisionState=await page.locator('.ns-state-row').first().innerText();
        if(!/DEFERRED/.test(decisionState)||!/NOT AUTHORIZED/.test(decisionState))throw new Error('Northstar Decision view must reflect deferred CPD-0001 authorization state');
        await page.locator('[data-view="okr"]').click();
        if(!/DEFERRED/.test(await page.locator('.ns-attention-card').innerText()))throw new Error('Northstar OKR attention rail must reflect deferred CPD-0001');
        await page.locator('[data-open-trail="KR9.4"]').click();
        const deferredTrail=await page.locator('#ns-trail-dialog[open]').innerText();
        if(!/DEFERRED/.test(deferredTrail)||!/NO CAR/.test(deferredTrail))throw new Error('Northstar trace trail must suppress CAR after deferred CPD-0001');
        await page.locator('[data-close-trail]').click();
        await page.locator('.ns-view-nav [data-view="handoff"]').click();
        const deferredHandoff=await page.locator('#northstar-view').innerText();
        if(!/NO CURRENT SOURCE CAR/.test(deferredHandoff)||!/BLOCKED/.test(deferredHandoff)||!/Fail closed/.test(deferredHandoff))throw new Error('Northstar execution handoff must fail closed after deferred CPD-0001');
        await page.locator('[data-view="authorization"]').click();
        await page.locator('[data-auth-action="conditional"][data-auth-id="CPD-0001"]').click();
        await page.locator('[data-role="manager"]').click();
        const preCarComposer=page.locator('.ns-management-composer');
        const preCarText=await preCarComposer.innerText();
        if(await preCarComposer.count()!==1||!/MANAGEMENT COMPOSER/.test(preCarText)||!/O10 → KR10.1/.test(preCarText)||!/CAR-0002/.test(preCarText))throw new Error('A pending selected CAR must not hide other current CAR-backed KRs from Management Composer');
        if(await page.locator('[data-management-draft]').count()!==1||await page.locator('[data-management-accept]').count()||/BHP-0001/.test(preCarText))throw new Error('Management Composer may draft only from current source CARs and must not imply acceptance or BHP eligibility');
        if(await page.locator('[data-management-authorize]').count())throw new Error('Global authorized KR pool must not expose a misleading selected-KR authorization continuation while current source CARs exist');
        await audit(route,'Management Composer / current CAR pool with selected pending CAR');
        await page.locator('[data-view="authorization"]').click();
        await page.locator('[data-auth-select="CPD-0001"]').click();
        if(!/CPD-0001/.test(await page.locator('.ns-auth-detail').innerText())||!/Not confirmed · review exact authorization package/.test(await page.locator('.ns-auth-detail').innerText()))throw new Error('Guided Management Composer authorization must land on the exact primary decision with honest CAR state');
        await audit(route,'Authorization Queue / shared state across views');
        await page.locator('[data-auth-check="CPD-0001"]').check();
        await page.locator('[data-auth-check="CPD-0004"]').check();
        const batchText=await page.locator('.ns-batch-bar').innerText();
        if(!/2 items/.test(batchText)||!/1 eligible for authorization/.test(batchText)||!/1 require individual handling/.test(batchText))throw new Error('Northstar multi-select must preserve per-item eligibility');
        await page.locator('[data-review-selected]').click();
        const ceremony=page.locator('#ns-authorization-ceremony-dialog[open]');
        if(await ceremony.count()!==1)throw new Error('Northstar authorization ceremony must open for selected decisions');
        const ceremonyText=await ceremony.innerText();
        if(!/1 of 2 selected items eligible/.test(ceremonyText)||!/Evidence digest/.test(ceremonyText)||!/Still not granted/.test(ceremonyText))throw new Error('Northstar ceremony must expose eligibility, digest and authority exclusions');
        await audit(route,'Leadership Decision Workspace / multi-select ceremony');
        await page.locator('[data-confirm-authorization]').click();
        if(await page.locator('#ns-authorization-ceremony-dialog[open]').count())throw new Error('Northstar authorization ceremony must close after confirmation');
        await page.locator('[data-view="management"]').click();
        if(!/MANAGEMENT COMPOSER/.test(await page.locator('.ns-management-composer').innerText())||await page.locator('[data-management-draft]').count()!==1||await page.locator('[data-management-kr-check]').count()<2)throw new Error('After CPD-0001 confirmation, Management Composer must expose the complete current CAR-backed KR pool with Epic composition enabled');
        await page.locator('.ns-view-nav [data-view="authorization"]').click();
        const confirmed=await page.locator('[data-auth-item="CPD-0001"]').innerText();
        const blocked=await page.locator('[data-auth-item="CPD-0004"]').innerText();
        if(!/CONFIRMED/.test(confirmed)||!/CAR-0001/.test(confirmed))throw new Error('Eligible Northstar item must retain its own confirmed CAR receipt');
        if(/CONFIRMED/.test(blocked))throw new Error('Ineligible Northstar item must not piggyback on multi-select authorization');
        await page.locator('.ns-view-nav [data-view="handoff"]').click();
        const handoffView=page.locator('#northstar-view');
        if(!/Management acceptance required/.test(await handoffView.innerText())||await page.locator('[data-confirm-handoff]').count())throw new Error('Northstar must not create BHP before management accepts a validated Epic');
        await page.locator('[data-view="management"]').click();
        if(await page.locator('[data-management-draft]').count()!==1)throw new Error('Northstar Management Composer must expose Composite AI proposal action');
        await page.locator('[data-management-draft]').click();
        if(await page.locator('[data-management-proposal]').count()!==2)throw new Error('Northstar Management Composer must expose bounded synthetic Epic proposals');
        const managementText=await page.locator('.ns-management-composer').innerText();
        if(!/REUSE \/ EQUIVALENCE/.test(managementText)||!/DETERMINISTIC VALIDATION/.test(managementText)||!/CAR scope binding/.test(managementText))throw new Error('Northstar Management Composer must expose reuse and deterministic CAR-bound validation');
        await audit(route,'Management Composer / AI Epic proposals + deterministic validation');
        await page.locator('[data-view="authorization"]').click();
        await page.locator('[data-auth-select="CPD-0001"]').click();
        await page.locator('[data-auth-action="approve"][data-auth-id="CPD-0001"]').click();
        await page.locator('[data-authorize-item="CPD-0001"]').click();
        await page.locator('[data-confirm-authorization]').click();
        await page.locator('[data-view="management"]').click();
        const resetProposed=await page.locator('.ns-management-composer').innerText();
        if(await page.locator('[data-management-proposal]').count()||await page.locator('[data-management-accept]').count()||await page.locator('[data-management-draft]').count()!==1||!/Propose Epics with Composite AI/.test(resetProposed))throw new Error('Changing source authorization must invalidate generated-but-unaccepted Epic proposals before they can bind to the new CAR');
        await page.locator('[data-management-draft]').click();
        await page.locator('[data-management-accept]').click();
        if(!/MANAGEMENT ACCEPTED/.test(await page.locator('.ns-management-composer').innerText()))throw new Error('Northstar Management Composer must require explicit management acceptance');
        await page.locator('.ns-view-nav [data-view="handoff"]').click();
        if(!/BHP-0001/.test(await handoffView.innerText())||!/AWAITING HUMAN HANDOFF/.test(await handoffView.innerText()))throw new Error('Accepted management Epic must enable bounded BHP generation');
        await page.locator('[data-confirm-handoff]').click();
        const receipt=await page.locator('.ns-handoff-receipt').innerText();
        if(!/BHP-0001/.test(receipt)||!/NO EXTERNAL WRITE/.test(receipt))throw new Error('Northstar handoff confirmation must remain a synthetic receipt with no external write');
        await page.locator('[data-view="authorization"]').click();
        await page.locator('[data-auth-select="CPD-0001"]').click();
        await page.locator('[data-auth-action="conditional"][data-auth-id="CPD-0001"]').click();
        await page.locator('[data-authorize-item="CPD-0001"]').click();
        await page.locator('[data-confirm-authorization]').click();
        await page.locator('.ns-view-nav [data-view="handoff"]').click();
        if(!/Management acceptance required/.test(await handoffView.innerText())||await page.locator('.ns-handoff-receipt').count())throw new Error('Reauthorizing source CAR must invalidate prior management acceptance and BHP receipt');
        await page.locator('[data-view="management"]').click();
        if(!/None · management review required/.test(await page.locator('#northstar-view').innerText()))throw new Error('Northstar must require management to accept Epic against replacement CAR package');
        await page.locator('[data-management-draft]').click();
        await page.locator('[data-management-accept]').click();
        await page.locator('.ns-view-nav [data-view="handoff"]').click();
        if(!/BHP-0001/.test(await handoffView.innerText()))throw new Error('Fresh management acceptance must restore BHP eligibility');
        await page.locator('[data-confirm-handoff]').click();
        await audit(route,'Management Composer / CAR package rebinding');
        await page.locator('[data-view="authorization"]').click();
        await page.locator('[data-auth-select="CPD-0002"]').click();
        await page.locator('[data-authorize-item="CPD-0002"]').click();
        await page.locator('[data-confirm-authorization]').click();
        await page.locator('.ns-view-nav [data-view="handoff"]').click();
        const preservedReceipt=await page.locator('.ns-handoff-receipt').innerText();
        if(!/BHP-0001/.test(preservedReceipt)||!/Jira/.test(preservedReceipt))throw new Error('Authorizing unrelated Northstar item must preserve existing handoff receipt');
        await page.locator('[data-handoff-target="ado"]').click();
        if(await page.locator('.ns-handoff-receipt').count())throw new Error('Changing Northstar handoff target must invalidate the prior receipt');
        if(!/Azure DevOps/.test(await handoffView.innerText()))throw new Error('Northstar handoff target must update deterministically');
        await page.locator('[data-confirm-handoff]').click();
        await audit(route,'Execution Handoff / bounded adapter contract');
        const lineageReceiptBefore=await page.locator('.ns-handoff-receipt').innerText();
        await page.locator('[data-view="authorization"]').click();
        await page.locator('[data-auth-select="CPD-0002"]').click();
        await page.locator('[data-authorize-item="CPD-0002"]').click();
        await page.locator('[data-confirm-authorization]').click();
        await page.locator('.ns-view-nav [data-view="handoff"]').click();
        const lineageReceiptAfter=await page.locator('.ns-handoff-receipt').innerText();
        if(lineageReceiptBefore!==lineageReceiptAfter)throw new Error('Unrelated Northstar authorization must not invalidate or mutate CPD-0001 handoff receipt');
        if(!/O9 → KR9.4 → CPD-0001/.test(await page.locator('.ns-handoff-package').innerText()))throw new Error('Delivery persona must receive exact selected Objective/KR/decision lineage');
        await audit(route,'Execution Handoff / independent authorization lineage');
        await page.locator('[data-view="authorization"]').click();
        await page.locator('[data-auth-select="CPD-0001"]').click();
        await page.locator('[data-auth-action="defer"][data-auth-id="CPD-0001"]').click();
        await page.locator('.ns-view-nav [data-view="handoff"]').click();
        const blockedHandoff=await handoffView.innerText();
        if(!/NO CURRENT SOURCE CAR/.test(blockedHandoff)||!/BLOCKED/.test(blockedHandoff)||await page.locator('[data-confirm-handoff]').count())throw new Error('Northstar execution handoff must fail closed without a current source CAR');
        await page.locator('[data-view="authorization"]').click();
        await page.locator('[data-auth-action="conditional"][data-auth-id="CPD-0001"]').click();
        await page.locator('[data-authorize-item="CPD-0001"]').click();
        await page.locator('[data-confirm-authorization]').click();
        await page.locator('[data-view="composer"]').click();
        if(await page.locator('.ns-composer-flow').count()!==1)throw new Error('Northstar Composer view must render inline');
        await audit(route,'OKR Composer / first-class view');
        await page.locator('[data-view="okr"]').click();
        const goldenObjective=page.locator('.ns-objective-card').filter({hasText:'O10'}).first();
        if(!/CURRENT CAR\s+·\s+CAR-0002/.test(await goldenObjective.innerText())||!/Explore CAR lineage/.test(await goldenObjective.innerText()))throw new Error('Northstar demo must visibly expose one synthetic Objective with a current CAR golden path');
        await page.locator('[data-lineage-objective-open="O10"]').click();
        const goldenLineage=await page.locator('#northstar-view').innerText();
        if(!/O10/.test(goldenLineage)||!/KR10\.1/.test(goldenLineage)||!/CAPABILITY AUTHORIZATION\s+CAR-0002/.test(goldenLineage)||!/CURRENT CAR\s+·\s+CAR-0002/.test(goldenLineage))throw new Error('Northstar CAR golden path must visibly connect O10 to KR10.1 and CAR-0002');
        await page.locator('[data-view="okr"]').click();
        const composer=page.locator('[data-open-composer]').first();
        if(await composer.count()!==1||!await composer.isVisible())throw new Error('Northstar OKR Composer trigger must be visible');
        await composer.click();
        if(await page.locator('#ns-composer-dialog[open]').count()!==1)throw new Error('Northstar OKR Composer must open');
        await audit(route,'OKR Composer / leader intent');
        await page.locator('[data-composer-draft]').click();
        await audit(route,'OKR Composer / AI proposal + deterministic validation');
        await page.locator('[data-composer-accept]').click();
        await audit(route,'OKR Composer / human accepted');
        await page.locator('[data-composer-done]').click();
        if(await page.locator('#ns-composer-dialog[open]').count())throw new Error('Northstar OKR Composer must close');
        if(await page.locator('.ns-composer-accepted').count()!==1)throw new Error('Accepted synthetic OKR draft status must be visible');
      }
      if(route==='/assurance/demo/'){
        for(const selector of ['[data-assurance-tab="shield"]',...['baseline','expired','broadened','approver','digest','rollback'].map(v=>`[data-scenario="${v}"]`),'[data-assurance-tab="sentry"]',...['violation','corrected'].map(v=>`[data-sentry-scenario="${v}"]`),'[data-assurance-tab="custody"]',...['access','transfer','broadened','audit'].map(v=>`[data-custody-scenario="${v}"]`)]){
          const button=page.locator(selector);if(await button.count()&&await button.isVisible()){await button.click();await page.waitForTimeout(100);await audit(route,selector);}
        }
      }
      if(route==='/assurance/portal/'){
        for(const value of ['security','governance']){await page.locator('#record-audience').selectOption(value);await audit(route,value);}
        await page.locator('.portal-order-card details').first().evaluate(el=>el.open=true);await audit(route,'evidence details');
      }
    }
    // A menu may cover text already verified with that menu closed.
    for(const [key,item] of unique)if(item.unresolved&&verified.get(JSON.stringify([item.route,item.target]))?.size===2)unique.delete(key);
    fs.writeFileSync(`${output}/report.json`,JSON.stringify({mode,reports,violations:[...unique.values()],review:[...reviews.values()]},null,2));
    for(const item of unique.values())console.log('CONTRAST',JSON.stringify(item));
    for(const item of reviews.values())console.log('REVIEW',JSON.stringify(item));
    console.log('SUMMARY',JSON.stringify({mode,states:reports.length,pages:new Set(reports.map(r=>r.route)).size,violations:unique.size,manualReview:reviews.size}));
    if(unique.size)process.exitCode=1;
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

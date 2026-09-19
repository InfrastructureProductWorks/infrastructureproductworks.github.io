const DASHBOARD_URL='https://raw.githubusercontent.com/InfrastructureProductWorks/infrastructureproductworks.github.io/telemetry/portfolio-live/data/portfolio-dashboard-live.json';
const ROADMAP_RELATIONSHIP_URL='/data/roadmap-relationships.json';
let dashboardState=null;
const STAGE_NAMES=['Define','Build','Validate','Integrate','Operationalize'];
const PRODUCT_CONTRACT=[
  {id:'storefront',name:'Storefront',role:'Experience',repository:'InfrastructureProductWorks/backstage-infrastructure-product-storefront-poc'},
  {id:'guard',name:'IaaP Guard',role:'Validate',repository:'InfrastructureProductWorks/iaap-guard'},
  {id:'forge',name:'IaaP Forge',role:'Construct',repository:'InfrastructureProductWorks/iaap-forge'},
  {id:'console',name:'IaaP Console',role:'Review',repository:'InfrastructureProductWorks/iaap-console'},
  {id:'assurance',name:'IaaP Assurance',role:'Assure',repository:'InfrastructureProductWorks/iaap-assurance'},
  {id:'crossplane',name:'Crossplane Control Plane',role:'Reconcile',repository:'InfrastructureProductWorks/crossplane-multicloud-seed-poc'}
];
const FOCUS_CONTRACT={closedEpic:'EP-07',activeEpic:'EP-08',activeLabel:'GitHub Enterprise Server and restricted-network portability'};
const DELIVERY_FOCUS={epic:'EP-16',title:'Connected Application Experience',increment:'EDA-06 — Immutable Evidence & Artifact Adapter',copy:'Separate immutable evidence and artifacts from the event store while preserving exact digest, provenance, tenant scope and zero-authority boundaries.'};
const BASELINE={objectives:8,keyResults:62,epics:19,features:150};
const STATUS_BY_STAGE={1:'DEFINING',2:'BUILDING',3:'VALIDATING',4:'INTEGRATING',5:'OPERATIONALIZING'};
const AUTHORITY_NOTICE='Engineering and roadmap telemetry only. No production, pilot, deployment, approval, commercialization, cloud, or risk-acceptance authority is implied.';
const LIVE_SCOPE='sanitized-product-owned-live-portfolio-telemetry';
const LIVE_AGGREGATION='scheduled-protected-main-product-status-contracts';
const INTEGRATION_REPOSITORY='InfrastructureProductWorks/multicloud-foundation-poc-integration';
const FALLBACK={
  schemaVersion:'portfolio-dashboard/v1',
  generatedAt:null,
  posture:'CONTINUE_VALIDATION',
  baseline:BASELINE,
  portfolioFocus:{
    closedEpic:'EP-07',
    activeEpic:'EP-08',
    activeLabel:'GitHub Enterprise Server and restricted-network portability',
    next:[
      'EP-08 remains the active portability track: GHE-06 bounded accepted; GHE-07 ready but externally blocked on an authorized live target; GHE-08 gated on GHE-07 live evidence',
      'EP-16 is the active delivery focus; EDA-06 separates immutable evidence/artifacts from event and projection state',
      'Connected Storefront and Forge preserve authenticated, integrity-bound handoff and the human-review boundary while durable evidence storage advances',
      'Customer identity, persistence, audit, Guard operational profiles, Crossplane and cloud/provider integrations remain separately gated',
      'EP-18 multi-customer isolation defines customer-bound identity, policy, evidence, secrets and cross-customer fail-closed testing before any tenant-isolation claim',
      'EP-17 AI-assisted and agent-operated evolution remains evidence-gated after trusted connected and customer-operational foundations'
    ]
  },
  stageModel:STAGE_NAMES,
  objectives:[
    {id:'O1',definition:'Preserve trustworthy evidence and release integrity',keyResultCount:3,epics:['EP-01']},
    {id:'O2',definition:'Validate evaluator value without widening authority',keyResultCount:3,epics:['EP-02','EP-03']},
    {id:'O3',definition:'Prove one minimum multi-cloud foundation safely and reversibly',keyResultCount:27,epics:['EP-04','EP-09','EP-10','EP-11','EP-12','EP-13','EP-14','EP-15']},
    {id:'O4',definition:'Prepare customer-hosted planning and operational decisions',keyResultCount:12,epics:['EP-03','EP-05','EP-06','EP-10','EP-11','EP-13','EP-14','EP-15','EP-19']},
    {id:'O5',definition:'Make the portfolio installable and portable in customer-controlled enterprise environments',keyResultCount:6,epics:['EP-07','EP-08']},
    {id:'O6',definition:'Connect the product experience without widening execution authority',keyResultCount:4,epics:['EP-16']},
    {id:'O7',definition:'Prepare evidence-gated AI-assisted and agent-operated evolution',keyResultCount:3,epics:['EP-17']},
    {id:'O8',definition:'Establish verifiable multi-customer isolation',keyResultCount:4,epics:['EP-18']}
  ],
  products:[]
};
function text(id,value){const target=document.getElementById(id);if(target)target.textContent=String(value??'')}
function node(tag,className,value){const n=document.createElement(tag);if(className)n.className=className;if(value!==undefined)n.textContent=String(value);return n}
function safePath(value){return typeof value==='string'&&value.startsWith('/')&&!value.startsWith('//')&&!value.includes('\\')&&!/[\r\n\t]/.test(value)?value:'#'}
function object(value){return value!==null&&typeof value==='object'&&!Array.isArray(value)}
function boundedText(value){return typeof value==='string'&&value.trim()!==''&&!/[\r\n\t]/.test(value)}
function exactKeys(value,keys){return object(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key))}
function validDate(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(`${value}T00:00:00Z`))&&new Date(`${value}T00:00:00Z`).toISOString().slice(0,10)===value}
function validTimestamp(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString()===value.replace('Z','.000Z')}
function validVersions(value){return object(value)&&Object.entries(value).every(([key,version])=>boundedText(key)&&boundedText(version))}
function validPositiveInteger(value){return Number.isInteger(value)&&value>0}
function validObjective(item){
  return exactKeys(item,['id','definition','keyResultCount','epics'])
    &&/^O[1-9][0-9]*$/.test(item.id)
    &&boundedText(item.definition)
    &&validPositiveInteger(item.keyResultCount)
    &&Array.isArray(item.epics)&&item.epics.length>0
    &&item.epics.every(epic=>/^EP-[0-9]{2}$/.test(epic))
    &&new Set(item.epics).size===item.epics.length;
}
function validDashboard(data){
  const baseline=data?.baseline,focus=data?.portfolioFocus,source=data?.source;
  const topKeys=['schemaVersion','generatedAt','posture','authorityNotice','source','baseline','portfolioFocus','stageModel','objectives','products'];
  const metrics=['objectives','keyResults','epics','features'];
  const objectives=Array.isArray(data?.objectives)?data.objectives:[];
  const objectiveIds=objectives.map(item=>item?.id);
  const epicIds=objectives.flatMap(item=>Array.isArray(item?.epics)?item.epics:[]);
  return exactKeys(data,topKeys)
    &&data.schemaVersion==='portfolio-dashboard/v1'
    &&validTimestamp(data.generatedAt)
    &&data.posture==='CONTINUE_VALIDATION'&&data.authorityNotice===AUTHORITY_NOTICE
    &&exactKeys(source,['roadmap','roadmapBaseline','scope','aggregation','repository','revision'])
    &&source.roadmap==='config/portfolio-roadmap.json'
    &&validDate(source.roadmapBaseline)
    &&source.scope===LIVE_SCOPE
    &&source.aggregation===LIVE_AGGREGATION
    &&source.repository===INTEGRATION_REPOSITORY
    &&/^[0-9a-f]{40}$/.test(source.revision)
    &&exactKeys(baseline,metrics)
    &&metrics.every(key=>validPositiveInteger(baseline[key]))
    &&baseline.features>=baseline.epics
    &&exactKeys(focus,['closedEpic','activeEpic','activeLabel','next'])
    &&focus.closedEpic===FOCUS_CONTRACT.closedEpic
    &&focus.activeEpic===FOCUS_CONTRACT.activeEpic
    &&focus.activeLabel===FOCUS_CONTRACT.activeLabel
    &&Array.isArray(focus.next)&&focus.next.length>0&&focus.next.every(boundedText)
    &&Array.isArray(data.stageModel)&&data.stageModel.length===STAGE_NAMES.length
    &&data.stageModel.every((stage,index)=>stage===STAGE_NAMES[index])
    &&objectives.length===baseline.objectives
    &&objectives.length>0&&objectives.every(validObjective)
    &&new Set(objectiveIds).size===objectiveIds.length
    &&objectives.reduce((total,item)=>total+item.keyResultCount,0)===baseline.keyResults
    &&new Set(epicIds).size===baseline.epics
    &&new Set(epicIds).has(focus.closedEpic)
    &&new Set(epicIds).has(focus.activeEpic)
    &&Array.isArray(data.products)&&data.products.length===PRODUCT_CONTRACT.length
    &&data.products.every((item,index)=>{
      const expected=PRODUCT_CONTRACT[index];
      const productSource=item?.source;
      const isAssurance=item?.id==='assurance';
      return exactKeys(item,['id','name','role','stageIndex','state','status','evidence','nextMilestone','href','versions','source'])
      &&item.id===expected.id&&item.name===expected.name&&item.role===expected.role
      &&boundedText(item.state)&&boundedText(item.status)&&boundedText(item.evidence)
      &&boundedText(item.nextMilestone)&&Number.isInteger(item.stageIndex)
      &&item.stageIndex>=1&&item.stageIndex<=STAGE_NAMES.length
      &&item.status===STATUS_BY_STAGE[item.stageIndex]&&item.href===`/${item.id}/`
      &&validVersions(item.versions)
      &&exactKeys(productSource,['repository','revision','mode'])
      &&productSource.repository===expected.repository
      &&(
        productSource.mode==='product-owned-main'&&typeof productSource.revision==='string'&&/^[0-9a-f]{40}$/.test(productSource.revision)
        ||(isAssurance&&productSource.mode==='bounded-snapshot'&&productSource.revision===null)
      );
    });
}
function fmtDate(value){if(!value)return 'Repository-backed';const d=new Date(value);if(Number.isNaN(d.valueOf()))return String(value);return d.toLocaleString(undefined,{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});}
function shortSha(value){return typeof value==='string'&&value.length>=7?value.slice(0,7):'snapshot'}
function renderBaseline(data){text('metric-objectives',data.baseline.objectives);text('metric-krs',data.baseline.keyResults);text('metric-epics',data.baseline.epics);text('metric-features',data.baseline.features);text('live-posture',String(data.posture||'').replaceAll('_',' '));text('live-updated',fmtDate(data.generatedAt));text('focus-id',DELIVERY_FOCUS.epic);text('focus-title',DELIVERY_FOCUS.title);text('focus-increment',DELIVERY_FOCUS.increment);text('focus-copy',DELIVERY_FOCUS.copy);text('portability-id',data.portfolioFocus.activeEpic);text('portability-title',data.portfolioFocus.activeLabel);text('portability-accepted','GHE-06 bounded accepted');const blocked=(data.portfolioFocus.next||[]).some(item=>item.toLowerCase().includes('ghe-07')&&item.toLowerCase().includes('externally blocked'));text('portability-state',blocked?'EXTERNALLY BLOCKED':'ACTIVE TRACK');text('portability-copy',blocked?'Waiting on an authorized live GHES/customer-controlled GitHub target.':'Live customer-runner and GHES acceptance remains gated on authorized target evidence.');text('portability-note',blocked?'Not an unfinished synthetic engineering issue.':'Live target evidence remains required before support can be claimed.');}
function roadmapStatusClass(group){return ['active','accepted','gated','documentation','future','planned'].includes(group)?` status-${group}`:' status-planned'}
function metaPill(value,group){const span=node('span',`roadmap-meta-pill${roadmapStatusClass(group)}`,value);return span}
function bindRoadmapControls(host,{filtersEnabled=true}={}){
  const filters=[...document.querySelectorAll('[data-roadmap-filter]')];
  filters.forEach(button=>{
    const selected=button.dataset.roadmapFilter==='all';
    button.disabled=!filtersEnabled;
    button.setAttribute('aria-disabled',String(!filtersEnabled));
    button.setAttribute('aria-pressed',String(selected));
    button.classList.toggle('active',selected);
    if(!filtersEnabled){button.onclick=null;return;}
    button.onclick=()=>{
      filters.forEach(b=>{
        const active=b===button;
        b.classList.toggle('active',active);
        b.setAttribute('aria-pressed',String(active));
      });
      const value=button.dataset.roadmapFilter;
      host.querySelectorAll('.roadmap-objective').forEach(item=>{item.hidden=value!=='all'&&item.dataset.group!==value;});
    };
  });
  const expand=document.getElementById('roadmap-expand-all');
  if(expand)expand.onclick=()=>{
    host.querySelectorAll('.roadmap-objective:not([hidden])').forEach(objective=>{
      objective.open=true;
      objective.querySelectorAll('details').forEach(child=>child.open=true);
    });
  };
  const collapse=document.getElementById('roadmap-collapse-all');if(collapse)collapse.onclick=()=>host.querySelectorAll('details').forEach(d=>d.open=false);
}
function renderRoadmapFallback(data){
  const host=document.getElementById('roadmap-relationship-list');if(!host)return;host.replaceChildren();
  (data.objectives||[]).forEach(o=>{
    const details=node('details','roadmap-objective fallback-objective');
    const summary=node('summary','roadmap-objective-summary');
    const copy=node('div','roadmap-objective-copy');copy.append(node('span','roadmap-id',o.id),node('strong','',o.definition));
    const meta=node('div','roadmap-objective-meta');meta.append(node('span','roadmap-meta-pill','Relationship data unavailable'),node('span','roadmap-meta-pill',`${o.keyResultCount} KRs`));
    summary.append(copy,meta);details.append(summary,node('p','roadmap-fallback-copy','Detailed KR-to-Epic mapping is temporarily unavailable. No relationship is being inferred.'));
    host.append(details);
  });
  bindRoadmapControls(host,{filtersEnabled:false});
}
function renderRoadmapRelationships(data){
  const host=document.getElementById('roadmap-relationship-list');if(!host)return;host.replaceChildren();
  text('roadmap-baseline',data.planning.baseline);text('roadmap-quarter',data.planning.evidenceQuarter);text('roadmap-horizon',data.planning.horizon);text('roadmap-time-note',data.planning.timingNote);
  const krById=new Map((data.keyResults||[]).map(k=>[k.id,k]));
  const epicById=data.epics||{};
  (data.objectives||[]).forEach((o,index)=>{
    const details=node('details','roadmap-objective');details.dataset.group=o.group;details.dataset.objective=o.id;if(index===0)details.open=false;
    const summary=node('summary','roadmap-objective-summary');
    const left=node('div','roadmap-objective-copy');left.append(node('span','roadmap-id',o.id),node('strong','',o.definition),node('span','roadmap-objective-progress',o.progress));
    const meta=node('div','roadmap-objective-meta');meta.append(metaPill(o.status,o.group),node('span','roadmap-time-pill',o.time),node('span','roadmap-count-pill',`${o.keyResults.length} KRs`),node('span','roadmap-count-pill',`${o.epics.length} Epics`));
    summary.append(left,meta);details.append(summary);
    const body=node('div','roadmap-objective-body');
    const progress=node('div','roadmap-progress-block');progress.append(node('small','','OBJECTIVE PROGRESS'),node('p','',o.progress),node('span','roadmap-period-line',o.time));body.append(progress);
    const krList=node('div','roadmap-kr-list');
    o.keyResults.forEach(krId=>{
      const kr=krById.get(krId);if(!kr)return;
      const krDetails=node('details','roadmap-kr');krDetails.dataset.group=kr.group;
      const krSummary=node('summary','roadmap-kr-summary');
      const krCopy=node('div','roadmap-kr-copy');krCopy.append(node('span','roadmap-kr-id',kr.id),node('strong','',kr.definition));
      if(kr.sharedRange)krCopy.append(node('span','roadmap-shared-note',`Shared source outcome for ${kr.sharedRange}`));
      const krMeta=node('div','roadmap-kr-meta');krMeta.append(metaPill(kr.status,kr.group),node('span','roadmap-time-pill',kr.time),node('span','roadmap-count-pill',`${kr.epics.length} contributing Epic${kr.epics.length===1?'':'s'}`));
      krSummary.append(krCopy,krMeta);krDetails.append(krSummary);
      const krBody=node('div','roadmap-kr-body');krBody.append(node('small','roadmap-contrib-label','CONTRIBUTING EPICS'));
      const epicGrid=node('div','roadmap-epic-grid');
      kr.epics.forEach(epicId=>{
        const ep=epicById[epicId];if(!ep)return;
        const card=node('article','roadmap-epic-card');card.dataset.group=ep.group;
        const top=node('div','roadmap-epic-top');
        const title=node('div');title.append(node('span','roadmap-epic-id',ep.id),node('h4','',ep.title));
        const badges=node('div','roadmap-epic-badges');badges.append(metaPill(ep.status,ep.group),node('span','roadmap-time-pill',ep.time));
        top.append(title,badges);card.append(top,node('p','roadmap-epic-progress',ep.progress),node('span','roadmap-feature-count',`${ep.featureCount} registered features`));
        epicGrid.append(card);
      });
      krBody.append(epicGrid);krDetails.append(krBody);krList.append(krDetails);
    });
    body.append(krList);details.append(body);host.append(details);
  });
  bindRoadmapControls(host,{filtersEnabled:true});
}
function validRoadmapRelationships(data){
  if(!object(data)||data.schemaVersion!=='roadmap-relationship-view/v1'||!object(data.planning)||!boundedText(data.planning.baseline)||!boundedText(data.planning.evidenceQuarter)||!boundedText(data.planning.horizon)||!boundedText(data.planning.timingNote))return false;
  if(!Array.isArray(data.objectives)||data.objectives.length!==8||!Array.isArray(data.keyResults)||data.keyResults.length!==62||!object(data.epics)||Object.keys(data.epics).length!==19)return false;
  const objectiveIds=data.objectives.map(o=>o?.id),krIds=data.keyResults.map(k=>k?.id),epicIds=Object.keys(data.epics);
  if(new Set(objectiveIds).size!==objectiveIds.length||new Set(krIds).size!==krIds.length)return false;
  const objectiveSet=new Set(objectiveIds),krSet=new Set(krIds),epicSet=new Set(epicIds);
  if(!data.objectives.every(o=>object(o)&&/^O\d+$/.test(o.id)&&boundedText(o.definition)&&boundedText(o.status)&&boundedText(o.group)&&boundedText(o.progress)&&boundedText(o.time)&&Array.isArray(o.keyResults)&&Array.isArray(o.epics)&&new Set(o.keyResults).size===o.keyResults.length&&new Set(o.epics).size===o.epics.length&&o.keyResults.every(id=>krSet.has(id))&&o.epics.every(id=>epicSet.has(id))))return false;
  if(!data.keyResults.every(k=>object(k)&&/^KR\d+\.\d+$/.test(k.id)&&objectiveSet.has(k.objective)&&boundedText(k.definition)&&boundedText(k.status)&&boundedText(k.group)&&boundedText(k.time)&&Array.isArray(k.epics)&&k.epics.length>0&&new Set(k.epics).size===k.epics.length&&k.epics.every(id=>epicSet.has(id))))return false;
  if(!epicIds.every(id=>{const ep=data.epics[id];return object(ep)&&ep.id===id&&/^EP-\d+$/.test(id)&&boundedText(ep.title)&&boundedText(ep.status)&&boundedText(ep.group)&&boundedText(ep.progress)&&boundedText(ep.time)&&Number.isInteger(ep.featureCount)&&ep.featureCount>=0&&Array.isArray(ep.features)&&ep.features.length===ep.featureCount&&ep.features.every(boundedText);} ))return false;
  const krById=new Map(data.keyResults.map(k=>[k.id,k]));
  const krReachCount=new Map(krIds.map(id=>[id,0]));
  const reachableEpics=new Set();
  for(const o of data.objectives){
    for(const krId of o.keyResults){
      const kr=krById.get(krId);
      if(!kr||kr.objective!==o.id)return false;
      krReachCount.set(krId,(krReachCount.get(krId)||0)+1);
      kr.epics.forEach(id=>reachableEpics.add(id));
    }
    const contributed=new Set(o.keyResults.flatMap(krId=>(krById.get(krId)||{epics:[]}).epics));
    if(o.epics.some(id=>!contributed.has(id))||[...contributed].some(id=>!o.epics.includes(id)))return false;
  }
  if([...krReachCount.values()].some(count=>count!==1))return false;
  if(epicIds.some(id=>!reachableEpics.has(id)))return false;
  return true;
}
async function loadRoadmapRelationships(){try{const data=await fetchJson(ROADMAP_RELATIONSHIP_URL);if(!validRoadmapRelationships(data))throw new Error('unsupported roadmap relationship contract');renderRoadmapRelationships(data);}catch(err){document.getElementById('roadmap-map-error')?.classList.add('show');renderRoadmapFallback(dashboardState||FALLBACK);console.warn('Roadmap relationship data unavailable or invalid; using bounded fallback.',err)}}
function renderProducts(data){const host=document.getElementById('product-grid');if(!host)return;host.replaceChildren();(data.products||[]).forEach(p=>{const link=node('a','product-card');link.href=safePath(p.href);const top=node('div','product-top');const titleWrap=node('div');titleWrap.append(node('div','product-role',String(p.role||'').toUpperCase()),node('h3','',p.name));const status=String(p.status||'');top.append(titleWrap,node('span',`status-pill ${status.toLowerCase()}`,status));link.append(top,node('div','product-state',p.state),node('p','product-evidence',p.evidence));const proof=node('div','proof-pattern');[['BUILD',p.state],['VALIDATE',p.status],['EVIDENCE',p.evidence]].forEach(([label,value])=>{const step=node('div','proof-step');step.append(node('small','',label),node('strong','',value));proof.append(step);});link.append(proof);const labels=node('div','stage-labels');STAGE_NAMES.forEach(s=>labels.append(node('span','',s)));link.append(labels);const track=node('div','stage-track');const stageIndex=Number.isInteger(p.stageIndex)?Math.max(0,Math.min(STAGE_NAMES.length,p.stageIndex)):0;STAGE_NAMES.forEach((_,i)=>track.append(node('span',`stage-segment${i<stageIndex?' done':''}`)));link.append(track);const current=node('div','stage-current');current.append(node('span','','Current engineering maturity'),node('strong','',STAGE_NAMES[Math.max(0,stageIndex-1)]||'Define'));link.append(current);const source=p.source||{};const sourceLine=node('div','product-source');const mode=source.mode==='bounded-snapshot'?'bounded snapshot':'product-owned main';sourceLine.append(node('span','',mode),node('span','',shortSha(source.revision)));link.append(sourceLine);const next=node('div','next-block');next.append(node('small','','NEXT MILESTONE'),node('p','',p.nextMilestone));link.append(next,node('span','product-link','Open product →'));host.append(link);});}
function renderNext(data){const host=document.getElementById('next-list');if(!host)return;host.replaceChildren();(data.portfolioFocus.next||[]).forEach((item,i)=>{if(i)host.append(node('i','','→'));host.append(node('span','',item));});}
async function fetchJson(url){const res=await fetch(`${url}?v=${Date.now()}`,{cache:'no-store'});if(!res.ok)throw new Error(`HTTP ${res.status}`);return res.json();}
async function loadDashboard(){let data=FALLBACK;try{const live=await fetchJson(DASHBOARD_URL);if(!validDashboard(live))throw new Error('unsupported portfolio dashboard contract');data=live;}catch(err){document.getElementById('sync-error')?.classList.add('show');console.warn('Portfolio dashboard feed unavailable or invalid; using bounded fallback.',err)}dashboardState=data;renderBaseline(data);renderProducts(data);renderNext(data);}
document.addEventListener('DOMContentLoaded',async()=>{await loadDashboard();await loadRoadmapRelationships();});

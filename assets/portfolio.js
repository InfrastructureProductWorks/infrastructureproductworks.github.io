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
const DELIVERY_OUTLOOK_MILESTONES=[
  {
    id:'core-v1',
    label:'IPW Core v1',
    window:'November 2026',
    summary:'Feature-complete bounded product system with connected experience, evidence integrity, isolation contracts and change-readiness handoffs.',
    epics:['EP-01','EP-03','EP-07','EP-16','EP-18','EP-19'],
    critical:['EP-16','EP-18','EP-19']
  },
  {
    id:'pilot-ready',
    label:'Customer-hosted / Pilot Ready',
    window:'Q1–Q2 2027',
    summary:'Customer-controlled identity, execution, foundation, security and operational evidence validated in an authorized environment.',
    epics:['EP-04','EP-05','EP-08','EP-09','EP-10','EP-11','EP-12','EP-13','EP-14','EP-15','EP-18'],
    critical:['EP-04','EP-08','EP-10','EP-11']
  },
  {
    id:'operational-readiness',
    label:'Operational Readiness Candidate',
    window:'Q3 2027',
    summary:'Support, recovery, security, cost, portability and customer evidence assembled for an explicit release, hold or stop decision.',
    epics:['EP-06'],
    critical:['EP-06']
  }
];
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
    &&(
      exactKeys(source,['roadmap','roadmapBaseline','scope','aggregation','repository','revision'])
      ||exactKeys(source,['roadmap','roadmapBaseline','scope','aggregation','repository','revision','roadmapBlobSha'])
    )
    &&source.roadmap==='config/portfolio-roadmap.json'
    &&validDate(source.roadmapBaseline)
    &&source.scope===LIVE_SCOPE
    &&source.aggregation===LIVE_AGGREGATION
    &&source.repository===INTEGRATION_REPOSITORY
    &&/^[0-9a-f]{40}$/.test(source.revision)
    &&(!Object.hasOwn(source,'roadmapBlobSha')||/^[0-9a-f]{40}$/.test(source.roadmapBlobSha))
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
  const fallbackBaseline=object(data?.source)&&boundedText(data.source.roadmapBaseline)?data.source.roadmapBaseline:'Unavailable';
  text('roadmap-baseline',fallbackBaseline);
  text('roadmap-quarter','Unavailable');
  text('roadmap-horizon','Unavailable');
  text('roadmap-time-note','Relationship timing is unavailable while the roadmap relationship dataset is unavailable or out of sync.');
  text('metric-headline-krs','—');
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
function headlineRollup(headline,krById){
  const measures=headline.measures.map(id=>krById.get(id)).filter(Boolean);
  const epicIds=[...new Set(measures.flatMap(k=>k.epics||[]))];
  const groups=[...new Set(measures.map(k=>k.group))];
  const group=groups.length===1?groups[0]:(groups.includes('gated')?'gated':groups.includes('active')?'active':groups.includes('documentation')?'documentation':groups.includes('future')?'future':groups.includes('planned')?'planned':'accepted');
  const statuses=[...new Set(measures.map(k=>k.status))];
  const times=[...new Set(measures.map(k=>k.time))];
  return {measures,epicIds,group,status:statuses.length===1?statuses[0]:'Mixed evidence state',time:times.length===1?times[0]:'Multiple evidence periods'};
}
function headlineGroup(measures){
  const groups=new Set(measures.map(m=>m.group));
  if(groups.has('gated'))return 'gated';
  if(groups.has('active'))return 'active';
  if(groups.has('documentation'))return 'documentation';
  if(groups.size===1&&groups.has('accepted'))return 'accepted';
  if(groups.has('planned'))return 'planned';
  return 'future';
}
function headlineStatus(group){
  return ({active:'In progress',accepted:'Accepted / bounded',gated:'Conditional / gated',documentation:'Documentation-first',planned:'Planned',future:'Future / evidence-gated'})[group]||'Planned';
}
function headlineTime(measures){
  const values=[...new Set(measures.map(m=>m.time).filter(Boolean))];
  return values.length===1?values[0]:'Mixed timing · see measures';
}
function pctMean(values){return values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):0}
function progressBar(percent,label){
  const wrap=node('div','okr-progress');
  const head=node('div','okr-progress-head');head.append(node('strong','',`${percent}% complete`),node('span','',label));
  const track=node('div','okr-progress-track');const fill=node('span','okr-progress-fill');fill.style.width=`${percent}%`;track.append(fill);wrap.append(head,track);return wrap;
}
function strategicEpicIds(h,measureById){return [...new Set(h.measures.flatMap(id=>(measureById.get(id)||{epics:[]}).epics))]}
function renderRoadmapRelationships(data){
  const host=document.getElementById('roadmap-relationship-list');if(!host)return;host.replaceChildren();
  text('roadmap-baseline',data.planning.baseline);text('roadmap-quarter',data.planning.evidenceQuarter);text('roadmap-horizon',data.planning.horizon);text('roadmap-time-note',data.planning.timingNote);text('metric-headline-krs',data.headlineKeyResults.length);
  const measureById=new Map(data.keyResults.map(k=>[k.id,k])),headlineById=new Map(data.headlineKeyResults.map(h=>[h.id,h])),epicById=data.epics;
  data.objectives.forEach(o=>{
    const strategic=o.headlineKeyResults.map(id=>headlineById.get(id)).filter(Boolean);
    const objectiveEpicIds=[...new Set(strategic.flatMap(h=>strategicEpicIds(h,measureById)))];
    const objectivePct=pctMean(objectiveEpicIds.map(id=>epicById[id].completionPercent));
    const details=node('details','roadmap-objective');details.dataset.group=o.group;
    const summary=node('summary','roadmap-objective-summary');
    const left=node('div','roadmap-objective-copy');left.append(node('span','roadmap-id',o.id),node('strong','',o.definition),progressBar(objectivePct,`${objectiveEpicIds.length} unique contributing Epics`));
    const meta=node('div','roadmap-objective-meta');meta.append(metaPill(o.status,o.group),node('span','roadmap-time-pill',o.time),node('span','roadmap-count-pill',`${strategic.length} strategic KRs`));
    summary.append(left,meta);details.append(summary);
    const body=node('div','roadmap-objective-body');
    const headlineList=node('div','roadmap-headline-list');
    strategic.forEach(h=>{
      const measures=h.measures.map(id=>measureById.get(id)).filter(Boolean),group=headlineGroup(measures),epicIds=strategicEpicIds(h,measureById),pct=pctMean(epicIds.map(id=>epicById[id].completionPercent));
      const hDetails=node('details','roadmap-headline-kr');hDetails.dataset.group=group;
      const hSummary=node('summary','roadmap-headline-summary');
      const hCopy=node('div','roadmap-headline-copy');hCopy.append(node('span','roadmap-headline-id',h.id.replace(/^O\d+-/,'').replace('HKR','KR ')),node('strong','',h.title),progressBar(pct,`${epicIds.length} contributing Epic${epicIds.length===1?'':'s'}`));
      const hMeta=node('div','roadmap-headline-meta');hMeta.append(metaPill(headlineStatus(group),group),node('span','roadmap-time-pill',headlineTime(measures)));
      hSummary.append(hCopy,hMeta);hDetails.append(hSummary);
      const hBody=node('div','roadmap-headline-body');hBody.append(node('small','roadmap-contrib-label','CONTRIBUTING EPICS'));
      const epicGrid=node('div','roadmap-epic-grid');
      epicIds.forEach(epicId=>{
        const ep=epicById[epicId];const card=node('article','roadmap-epic-card');card.dataset.group=ep.group;
        const top=node('div','roadmap-epic-top');const title=node('div');title.append(node('span','roadmap-epic-id',ep.id),node('h4','',ep.title));
        const badges=node('div','roadmap-epic-badges');badges.append(node('span','roadmap-percent-pill',`${ep.completionPercent}%`),metaPill(ep.status,ep.group),node('span','roadmap-time-pill',ep.time));
        top.append(title,badges);card.append(top,progressBar(ep.completionPercent,'Epic completion'),node('p','roadmap-epic-progress',ep.progress),node('p','roadmap-progress-basis',ep.progressBasis));epicGrid.append(card);
      });
      hBody.append(epicGrid);hDetails.append(hBody);headlineList.append(hDetails);
    });
    body.append(headlineList);details.append(body);host.append(details);
  });
  bindRoadmapControls(host,{filtersEnabled:true});
  renderDeliveryOutlook(data);
}
function milestoneEvidence(milestone,epicById){
  const rows=milestone.epics.map(id=>epicById[id]).filter(Boolean);
  const criticalRows=milestone.critical.map(id=>epicById[id]).filter(Boolean);
  const complete=rows.length===milestone.epics.length;
  const progress=complete?pctMean(rows.map(ep=>ep.completionPercent)):null;
  const openCritical=criticalRows.filter(ep=>ep.completionPercent<100);
  const hasExternalOrGated=openCritical.some(ep=>ep.group==='gated'||ep.group==='future'||/externally blocked|external prerequisite|customer-dependent/i.test(`${ep.status||''} ${ep.progress||''} ${ep.progressBasis||''} ${ep.time||''}`));
  const hasDocumentationCritical=openCritical.some(ep=>ep.group==='documentation');
  const allAccepted=complete&&rows.every(ep=>ep.completionPercent===100);
  let posture='DEVELOPING',group='documentation';
  if(!complete){posture='DATA INCOMPLETE';group='gated';}
  else if(allAccepted){posture='ACCEPTED';group='accepted';}
  else if(hasExternalOrGated){posture='CONDITIONAL';group='gated';}
  else if(hasDocumentationCritical){posture='DEVELOPING';group='documentation';}
  else if(openCritical.some(ep=>ep.group==='active')){posture='ACTIVE';group='active';}
  const confidence=!complete?'LOW':allAccepted?'HIGH':hasExternalOrGated?'LOW':hasDocumentationCritical?'MEDIUM':progress>=75?'HIGH':'MEDIUM';
  return {rows,criticalRows,openCritical,progress,posture,group,confidence};
}
function renderDeliveryOutlook(data){
  const host=document.getElementById('delivery-outlook-grid');if(!host)return;host.replaceChildren();
  const error=document.getElementById('delivery-outlook-error');error?.classList.remove('show');
  if(!object(data)||!object(data.epics)){
    error?.classList.add('show');
    text('delivery-outlook-focus','Unavailable');
    text('delivery-outlook-updated',fmtDate(dashboardState?.generatedAt));
    return;
  }
  DELIVERY_OUTLOOK_MILESTONES.forEach(milestone=>{
    const evidence=milestoneEvidence(milestone,data.epics);
    const card=node('article','delivery-outlook-card');card.dataset.group=evidence.group;
    const top=node('div','delivery-outlook-card-top');
    const title=node('div');title.append(node('small','delivery-outlook-label','PROJECTED COMPLETION WINDOW'),node('h3','',milestone.label));
    const status=metaPill(evidence.posture,evidence.group);top.append(title,status);card.append(top);
    card.append(node('div','delivery-outlook-window',milestone.window),node('p','delivery-outlook-summary',milestone.summary));
    if(evidence.progress!==null)card.append(progressBar(evidence.progress,'Evidence-backed milestone rollup'));
    const facts=node('div','delivery-outlook-facts');
    const confidence=node('div');confidence.append(node('small','','EVIDENCE CONFIDENCE'),node('strong','',evidence.confidence));
    const critical=node('div');critical.append(node('small','','OPEN CRITICAL PATH'),node('strong','',evidence.openCritical.length?evidence.openCritical.map(ep=>ep.id).join(' → '):'No open critical Epics'));
    facts.append(confidence,critical);card.append(facts);
    const path=node('p','delivery-outlook-path',evidence.openCritical.length?evidence.openCritical.map(ep=>`${ep.id} · ${ep.title}`).join('  →  '):'All milestone critical-path Epics are accepted.');
    card.append(path);host.append(card);
  });
  text('delivery-outlook-focus',DELIVERY_FOCUS.increment);
  text('delivery-outlook-updated',fmtDate(dashboardState?.generatedAt||data.generatedAt));
}
function validRoadmapRelationships(data){
  if(!object(data)||data.schemaVersion!=='roadmap-relationship-view/v4')return false;
  if(!object(data.relationshipModel)||data.relationshipModel.objectiveToHeadlineKeyResults!=='one-to-many'||data.relationshipModel.headlineKeyResultToEpics!=='derived-through-registered-measures'||data.relationshipModel.registeredMeasures!=='traceability-only-hidden-from-executive-view'||data.relationshipModel.objectiveToEpics!=='derived-through-registered-measures')return false;
  if(!object(data.progressModel)||data.progressModel.method!=='evidence-backed-epic-rollup/v1'||!boundedText(data.progressModel.scale)||!boundedText(data.progressModel.strategicKeyResult)||!boundedText(data.progressModel.objective)||!boundedText(data.progressModel.note))return false;
  if(!boundedText(data.generatedAt)||!/^\d{4}-\d{2}-\d{2}$/.test(data.generatedAt))return false;
  if(!boundedText(data.sourceRevision)||!/^[0-9a-f]{40}$/.test(data.sourceRevision))return false;
  if(!boundedText(data.roadmapBlobSha)||!/^[0-9a-f]{40}$/.test(data.roadmapBlobSha))return false;
  if(!object(data.planning)||!boundedText(data.planning.baseline)||!normalizeRoadmapDate(data.planning.baseline)||!boundedText(data.planning.evidenceQuarter)||!/^Q[1-4]\s+\d{4}$/.test(data.planning.evidenceQuarter)||!boundedText(data.planning.horizon)||!boundedText(data.planning.timingNote))return false;
  if(!Array.isArray(data.objectives)||data.objectives.length<1||!Array.isArray(data.headlineKeyResults)||data.headlineKeyResults.length<1||!Array.isArray(data.keyResults)||data.keyResults.length<1||!object(data.epics)||Object.keys(data.epics).length<1)return false;
  const objectiveIds=data.objectives.map(o=>o?.id),headlineIds=data.headlineKeyResults.map(h=>h?.id),krIds=data.keyResults.map(k=>k?.id),epicIds=Object.keys(data.epics);
  if(new Set(objectiveIds).size!==objectiveIds.length||new Set(headlineIds).size!==headlineIds.length||new Set(krIds).size!==krIds.length)return false;
  const objectiveSet=new Set(objectiveIds),headlineSet=new Set(headlineIds),krSet=new Set(krIds),epicSet=new Set(epicIds);
  const objectiveGroups=new Set(['active','accepted','gated','documentation','future']);
  const nestedGroups=new Set(['active','accepted','gated','documentation','future','planned']);
  if(!data.objectives.every(o=>object(o)&&/^O\d+$/.test(o.id)&&boundedText(o.definition)&&boundedText(o.status)&&objectiveGroups.has(o.group)&&boundedText(o.progress)&&boundedText(o.time)&&Array.isArray(o.headlineKeyResults)&&o.headlineKeyResults.length>=2&&o.headlineKeyResults.length<=4&&new Set(o.headlineKeyResults).size===o.headlineKeyResults.length&&o.headlineKeyResults.every(id=>headlineSet.has(id))&&Array.isArray(o.keyResults)&&o.keyResults.length>0&&new Set(o.keyResults).size===o.keyResults.length&&o.keyResults.every(id=>krSet.has(id))&&o.epics===undefined))return false;
  if(!data.headlineKeyResults.every(h=>object(h)&&/^O\d+-HKR\d+$/.test(h.id)&&objectiveSet.has(h.objective)&&boundedText(h.title)&&Array.isArray(h.measures)&&h.measures.length>0&&new Set(h.measures).size===h.measures.length&&h.measures.every(id=>krSet.has(id))))return false;
  if(!data.keyResults.every(k=>{
    const sharedRangeOk=k.sharedRange===null||(boundedText(k.sharedRange)&&/^KR\d+\.\d+(?:-KR\d+\.\d+)?$/.test(k.sharedRange));
    const sourceOk=boundedText(k.source)&&k.source.length<=240&&!k.source.includes('..')&&!k.source.startsWith('/')&&/^[A-Za-z0-9._\/-]+$/.test(k.source);
    return object(k)&&/^KR\d+\.\d+$/.test(k.id)&&objectiveSet.has(k.objective)&&boundedText(k.definition)&&boundedText(k.status)&&nestedGroups.has(k.group)&&boundedText(k.time)&&sourceOk&&sharedRangeOk&&Array.isArray(k.epics)&&k.epics.length>0&&new Set(k.epics).size===k.epics.length&&k.epics.every(id=>epicSet.has(id));
  }))return false;
  if(!epicIds.every(id=>{const ep=data.epics[id];return object(ep)&&ep.id===id&&/^EP-\d+$/.test(id)&&boundedText(ep.title)&&boundedText(ep.status)&&nestedGroups.has(ep.group)&&boundedText(ep.progress)&&boundedText(ep.time)&&Number.isInteger(ep.featureCount)&&ep.featureCount>=0&&Number.isInteger(ep.completionPercent)&&[0,25,50,75,100].includes(ep.completionPercent)&&boundedText(ep.progressBasis)&&Array.isArray(ep.features)&&ep.features.length===ep.featureCount&&ep.features.every(featureId=>boundedText(featureId)&&/^[A-Z][A-Z0-9]*-\d{2,}$/.test(featureId));}))return false;
  const allFeatureIds=epicIds.flatMap(id=>data.epics[id].features);if(new Set(allFeatureIds).size!==allFeatureIds.length)return false;
  const headlineById=new Map(data.headlineKeyResults.map(h=>[h.id,h])),krById=new Map(data.keyResults.map(k=>[k.id,k]));
  const headlineReach=new Map(headlineIds.map(id=>[id,0])),krReach=new Map(krIds.map(id=>[id,0])),reachableEpics=new Set();
  for(const o of data.objectives){
    for(const hid of o.headlineKeyResults){
      const h=headlineById.get(hid);if(!h||h.objective!==o.id)return false;headlineReach.set(hid,(headlineReach.get(hid)||0)+1);
      for(const krId of h.measures){const kr=krById.get(krId);if(!kr||kr.objective!==o.id)return false;krReach.set(krId,(krReach.get(krId)||0)+1);kr.epics.forEach(id=>reachableEpics.add(id));}
    }
    const derivedMeasures=new Set(o.headlineKeyResults.flatMap(hid=>(headlineById.get(hid)||{measures:[]}).measures));
    if(derivedMeasures.size!==o.keyResults.length||o.keyResults.some(id=>!derivedMeasures.has(id)))return false;
  }
  if([...headlineReach.values()].some(count=>count!==1)||[...krReach.values()].some(count=>count!==1)||epicIds.some(id=>!reachableEpics.has(id)))return false;
  return true;
}
function normalizeRoadmapDate(value){
  if(!boundedText(value))return null;
  const parsed=new Date(value);
  return Number.isNaN(parsed.valueOf())?null:parsed.toISOString().slice(0,10);
}
function roadmapMatchesDashboard(data,dashboard){
  if(!object(dashboard)||!object(dashboard.baseline)||!Array.isArray(dashboard.objectives))return false;
  const relationshipFeatureCount=Object.values(data.epics||{}).reduce((total,ep)=>total+(Number.isInteger(ep.featureCount)?ep.featureCount:0),0);
  if(data.objectives.length!==dashboard.baseline.objectives||data.keyResults.length!==dashboard.baseline.keyResults||Object.keys(data.epics).length!==dashboard.baseline.epics||relationshipFeatureCount!==dashboard.baseline.features)return false;
  if(object(dashboard.source)&&boundedText(dashboard.source.roadmapBlobSha)&&data.roadmapBlobSha!==dashboard.source.roadmapBlobSha)return false;
  if(object(dashboard.source)&&boundedText(dashboard.source.roadmapBaseline)){
    const relationshipBaseline=normalizeRoadmapDate(data.planning.baseline);
    const dashboardBaseline=normalizeRoadmapDate(dashboard.source.roadmapBaseline);
    if(!relationshipBaseline||!dashboardBaseline||relationshipBaseline!==dashboardBaseline)return false;
  }
  const objectiveById=new Map(data.objectives.map(o=>[o.id,o]));
  const krById=new Map(data.keyResults.map(k=>[k.id,k]));
  return dashboard.objectives.every(o=>{
    const mapped=objectiveById.get(o.id);
    if(!mapped||mapped.definition!==o.definition)return false;
    if(mapped.keyResults.length!==o.keyResultCount)return false;
    const derivedEpics=new Set(mapped.keyResults.flatMap(krId=>(krById.get(krId)||{epics:[]}).epics));
    const dashboardEpics=new Set(o.epics||[]);
    return derivedEpics.size===dashboardEpics.size&&[...derivedEpics].every(id=>dashboardEpics.has(id));
  });
}
async function loadRoadmapRelationships(){try{const data=await fetchJson(ROADMAP_RELATIONSHIP_URL,{timeoutMs:5000});if(!validRoadmapRelationships(data))throw new Error('unsupported roadmap relationship contract');if(!roadmapMatchesDashboard(data,dashboardState||FALLBACK))throw new Error('roadmap relationship data does not match current dashboard baseline');renderRoadmapRelationships(data);}catch(err){document.getElementById('roadmap-map-error')?.classList.add('show');renderRoadmapFallback(dashboardState||FALLBACK);renderDeliveryOutlook(null);console.warn('Roadmap relationship data unavailable, invalid, out of sync, or timed out; using bounded fallback.',err)}}
function renderProducts(data){const host=document.getElementById('product-grid');if(!host)return;host.replaceChildren();(data.products||[]).forEach(p=>{const link=node('a','product-card');link.href=safePath(p.href);const top=node('div','product-top');const titleWrap=node('div');titleWrap.append(node('div','product-role',String(p.role||'').toUpperCase()),node('h3','',p.name));const status=String(p.status||'');top.append(titleWrap,node('span',`status-pill ${status.toLowerCase()}`,status));link.append(top,node('div','product-state',p.state),node('p','product-evidence',p.evidence));const proof=node('div','proof-pattern');[['BUILD',p.state],['VALIDATE',p.status],['EVIDENCE',p.evidence]].forEach(([label,value])=>{const step=node('div','proof-step');step.append(node('small','',label),node('strong','',value));proof.append(step);});link.append(proof);const labels=node('div','stage-labels');STAGE_NAMES.forEach(s=>labels.append(node('span','',s)));link.append(labels);const track=node('div','stage-track');const stageIndex=Number.isInteger(p.stageIndex)?Math.max(0,Math.min(STAGE_NAMES.length,p.stageIndex)):0;STAGE_NAMES.forEach((_,i)=>track.append(node('span',`stage-segment${i<stageIndex?' done':''}`)));link.append(track);const current=node('div','stage-current');current.append(node('span','','Current engineering maturity'),node('strong','',STAGE_NAMES[Math.max(0,stageIndex-1)]||'Define'));link.append(current);const source=p.source||{};const sourceLine=node('div','product-source');const mode=source.mode==='bounded-snapshot'?'bounded snapshot':'product-owned main';sourceLine.append(node('span','',mode),node('span','',shortSha(source.revision)));link.append(sourceLine);const next=node('div','next-block');next.append(node('small','','NEXT MILESTONE'),node('p','',p.nextMilestone));link.append(next,node('span','product-link','Open product →'));host.append(link);});}
function renderNext(data){const host=document.getElementById('next-list');if(!host)return;host.replaceChildren();(data.portfolioFocus.next||[]).forEach((item,i)=>{if(i)host.append(node('i','','→'));host.append(node('span','',item));});}
async function fetchJson(url,{timeoutMs=0}={}){
  const controller=new AbortController();
  const timer=timeoutMs>0?setTimeout(()=>controller.abort(),timeoutMs):null;
  try{
    const res=await fetch(`${url}?v=${Date.now()}`,{cache:'no-store',signal:controller.signal});
    if(!res.ok)throw new Error(`HTTP ${res.status}`);
    return res.json();
  }finally{
    if(timer!==null)clearTimeout(timer);
  }
}
async function loadDashboard(){let data=FALLBACK;try{const live=await fetchJson(DASHBOARD_URL,{timeoutMs:5000});if(!validDashboard(live))throw new Error('unsupported portfolio dashboard contract');data=live;}catch(err){document.getElementById('sync-error')?.classList.add('show');console.warn('Portfolio dashboard feed unavailable, invalid, or timed out; using bounded fallback.',err)}dashboardState=data;renderBaseline(data);renderProducts(data);renderNext(data);}
document.addEventListener('DOMContentLoaded',async()=>{await loadDashboard();await loadRoadmapRelationships();});

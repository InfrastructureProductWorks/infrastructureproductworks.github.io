const DASHBOARD_URL='https://raw.githubusercontent.com/InfrastructureProductWorks/infrastructureproductworks.github.io/telemetry/portfolio-live/data/portfolio-dashboard-live.json';
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
const BASELINE={objectives:8,keyResults:58,epics:18,features:142};
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
      'EP-08 restricted-network and GHES portability remains the active platform track',
      'EP-16 Connected Application Experience begins in parallel with Preview boundaries preserved',
      'Connected Storefront and Connected Forge must prove authenticated, integrity-bound handoff before any Operational claim',
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
    {id:'O4',definition:'Prepare customer-hosted planning and operational decisions',keyResultCount:8,epics:['EP-03','EP-05','EP-06','EP-10','EP-11','EP-13','EP-14','EP-15']},
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
function canonicalDate(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(`${value}T00:00:00Z`))&&new Date(`${value}T00:00:00Z`).toISOString().slice(0,10)===value}
function canonicalTimestamp(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString()===value.replace('Z','.000Z')}
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
    &&canonicalTimestamp(data.generatedAt)
    &&data.posture==='CONTINUE_VALIDATION'&&data.authorityNotice===AUTHORITY_NOTICE
    &&exactKeys(source,['roadmap','roadmapBaseline','scope','aggregation','repository','revision'])
    &&source.roadmap==='config/portfolio-roadmap.json'
    &&canonicalDate(source.roadmapBaseline)
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
function renderBaseline(data){text('metric-objectives',data.baseline.objectives);text('metric-krs',data.baseline.keyResults);text('metric-epics',data.baseline.epics);text('metric-features',data.baseline.features);text('live-posture',String(data.posture||'').replaceAll('_',' '));text('live-updated',fmtDate(data.generatedAt));text('focus-id',data.portfolioFocus.activeEpic);text('focus-title',data.portfolioFocus.activeLabel);text('focus-copy',`${data.portfolioFocus.closedEpic} is functionally closed for the current bounded baseline. ${data.portfolioFocus.activeEpic} is the active portfolio focus.`);}
function renderObjectives(data){const host=document.getElementById('objective-list');if(!host)return;host.replaceChildren();(data.objectives||[]).forEach((o,i)=>{const article=node('article','objective-row');article.dataset.index=String(i+1);article.append(node('div','objective-number',i+1));const copy=node('div','objective-copy');copy.append(node('b','',o.definition),node('span','',`${o.id} · canonical roadmap objective`));article.append(copy);const kr=node('div','objective-stat');kr.append(node('small','','KEY RESULTS'),node('strong','',o.keyResultCount));article.append(kr);const epics=Array.isArray(o.epics)?o.epics:[];const ep=node('div','objective-stat');ep.append(node('small','','EPICS'),node('strong','',epics.length));article.append(ep);const chips=node('div','epic-chips');epics.forEach(e=>{let cls='epic-chip';if(e===data.portfolioFocus.activeEpic)cls+=' active';if(e===data.portfolioFocus.closedEpic)cls+=' closed';chips.append(node('span',cls,e));});article.append(chips);host.append(article);});}
function renderProducts(data){const host=document.getElementById('product-grid');if(!host)return;host.replaceChildren();(data.products||[]).forEach(p=>{const link=node('a','product-card');link.href=safePath(p.href);const top=node('div','product-top');const titleWrap=node('div');titleWrap.append(node('div','product-role',String(p.role||'').toUpperCase()),node('h3','',p.name));const status=String(p.status||'');top.append(titleWrap,node('span',`status-pill ${status.toLowerCase()}`,status));link.append(top,node('div','product-state',p.state),node('p','product-evidence',p.evidence));const proof=node('div','proof-pattern');[['BUILD',p.state],['VALIDATE',p.status],['EVIDENCE',p.evidence]].forEach(([label,value])=>{const step=node('div','proof-step');step.append(node('small','',label),node('strong','',value));proof.append(step);});link.append(proof);const labels=node('div','stage-labels');STAGE_NAMES.forEach(s=>labels.append(node('span','',s)));link.append(labels);const track=node('div','stage-track');const stageIndex=Number.isInteger(p.stageIndex)?Math.max(0,Math.min(STAGE_NAMES.length,p.stageIndex)):0;STAGE_NAMES.forEach((_,i)=>track.append(node('span',`stage-segment${i<stageIndex?' done':''}`)));link.append(track);const current=node('div','stage-current');current.append(node('span','','Current engineering maturity'),node('strong','',STAGE_NAMES[Math.max(0,stageIndex-1)]||'Define'));link.append(current);const source=p.source||{};const sourceLine=node('div','product-source');const mode=source.mode==='bounded-snapshot'?'bounded snapshot':'product-owned main';sourceLine.append(node('span','',mode),node('span','',shortSha(source.revision)));link.append(sourceLine);const next=node('div','next-block');next.append(node('small','','NEXT MILESTONE'),node('p','',p.nextMilestone));link.append(next,node('span','product-link','Open product →'));host.append(link);});}
function renderNext(data){const host=document.getElementById('next-list');if(!host)return;host.replaceChildren();(data.portfolioFocus.next||[]).forEach((item,i)=>{if(i)host.append(node('i','','→'));host.append(node('span','',item));});}
async function fetchJson(url){const res=await fetch(`${url}?v=${Date.now()}`,{cache:'no-store'});if(!res.ok)throw new Error(`HTTP ${res.status}`);return res.json();}
async function loadDashboard(){let data=FALLBACK;try{const live=await fetchJson(DASHBOARD_URL);if(!validDashboard(live))throw new Error('unsupported portfolio dashboard contract');data=live;}catch(err){document.getElementById('sync-error')?.classList.add('show');console.warn('Portfolio dashboard feed unavailable or invalid; using bounded fallback.',err)}renderBaseline(data);renderObjectives(data);renderProducts(data);renderNext(data);}
document.addEventListener('DOMContentLoaded',loadDashboard);

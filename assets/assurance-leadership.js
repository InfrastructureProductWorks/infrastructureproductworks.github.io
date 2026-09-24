'use strict';

document.addEventListener('DOMContentLoaded',()=>{
  const el=id=>document.getElementById(id);
  const api=window.AssuranceRecords;
  const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let source=null,entries=[],generation=0;
  function announce(message){el('record-import-status').textContent=message;}
  function render(){
    const rows=entries.map(entry=>api.project(entry,source.catalog.asOf));
    const summary=api.summarize(rows);
    const metrics=[['Requests loaded',summary.total],['Synthetic change verified',summary.applied],['Waiting for approval',summary.review],['Stopped before action',summary.stopped],['Rolled back',summary.rollback],['Median request to decision',`${summary.medianMinutes} min`]];
    el('record-metrics').innerHTML=metrics.map(([label,value])=>`<article><span>${escape(label)}</span><b>${escape(value)}</b></article>`).join('');
    el('record-snapshot').textContent=`Scope: ${source.catalog.scopeRef}. Recorded snapshot: ${source.catalog.asOf}. Totals describe only the ${rows.length} loaded requests.`;
    const audience=el('record-audience').value;
    const introductions={management:'Management: see the outcomes and where a person needs to act. Delivery status and delivery time are not available in these records.',security:'Security and operations: inspect the reason, bounded request, and next responsible role. A stopped request leaves the synthetic resource unchanged.',governance:'Governance: trace each explanation to its request, source revision, and complete decision fingerprint. These browser records model custody; they do not prove independent retention.'};
    el('record-audience-note').textContent=introductions[audience];
    const filter=el('record-filter').value;
    const visible=rows.filter(row=>filter==='all'||(filter==='attention'?row.status!=='applied':row.status===filter));
    el('record-visible-count').textContent=`Showing ${visible.length} of ${rows.length} requests. Summary totals remain for the full loaded set.`;
    el('portal-order-outcomes').innerHTML=visible.length?visible.map(row=>{
      const r=row.record,p=row.plain;
      const focus=audience==='governance'?`<p><b>Evidence:</b> Record integrity and membership in the published synthetic catalog verified. Independent custody: not established by this page.</p>`:audience==='security'?`<p><b>Resource:</b> ${escape(r.resourceRef)}<br><b>Action performed:</b> ${r.actionPerformed?'Yes, synthetic only':'No'}</p>`:`<p><b>Delivery:</b> Not observed. The gate result does not establish order fulfillment.</p>`;
      return `<article class="portal-order-card" data-request="${escape(r.requestRef)}"><h3>${escape(r.requestRef.replace('runtime-request:','').toUpperCase())}</h3><p>${escape(r.requesterRef)}</p><p><b>Requested:</b> ${escape(row.requestSummary)}</p><div class="portal-plain"><b>${escape(p.decision)}</b><p><b>What happened:</b> ${escape(p.action)}</p><p><b>Why:</b> ${escape(p.why)}</p><p><b>Next step:</b> ${escape(p.next)}</p><p><b>Responsible role:</b> ${escape(row.role)}. ${row.role==='No action required'?'':'Individual assignment is not recorded.'}</p></div>${focus}<p><b>Request to decision:</b> ${row.toDecisionMinutes} min, recorded fixture interval.</p><p><b>Time since decision:</b> ${row.sinceDecisionMinutes} min at the snapshot time. Review waiting time is not recorded.</p><details><summary>Decision record and source evidence</summary><p>Original result: <b>${escape(r.assuranceDecision)} · ${escape(r.runtimeOutcome)}</b></p><code>${escape(r.reasonCode)}</code><p>Request: <code>${escape(r.requestRef)}</code></p><p>Record fingerprint: <code>${escape(r.recordDigest)}</code></p><p>Authority fingerprint: <code>${escape(r.authorityPackageDigest)}</code></p><p>Evaluated: ${escape(r.evaluatedAt)}</p><p>Source revision: <code>${escape(source.catalog.source.revision)}</code></p><p>Source: ${escape(source.catalog.source.repository)} / ${escape(source.catalog.source.path)}</p><pre>${escape(JSON.stringify(r,null,2))}</pre></details></article>`;
    }).join(''):'<p>No loaded requests match this filter.</p>';
    el('record-export').disabled=false;
  }
  async function replace(text,label,token){
    const accepted=await api.verify(text,source);
    if(token!==generation)return;
    entries=accepted;render();announce(`${label}: ${entries.length} records verified against the published synthetic source catalog. The previous loaded set was replaced.`);
  }
  const ready=(async()=>{
    const response=await fetch('/assets/assurance-records.json',{cache:'no-store'});
    if(!response.ok)throw Error('Source catalog could not be loaded.');
    source=await api.openCatalog(await response.text());
    const initial=source.catalog.entries.filter(entry=>entry.initial);
    await replace(api.packageText(initial),'Published fixture set',generation);
    el('record-import').disabled=false;el('record-reset').disabled=false;
  })().catch(error=>{announce(`Verification unavailable: ${error.message}`);});
  el('record-import').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return;
    const token=++generation;
    announce('Checking the selected file. The last verified set remains visible until the check completes.');
    try{
      await ready;if(!source)throw Error('The source catalog is unavailable.');
      if(file.size>api.MAX_BYTES)throw Error('File exceeds the 100 KB limit.');
      await replace(await file.text(),'Imported file',token);
    }catch(error){if(token===generation)announce(`Import rejected: ${error.message} The last verified set is still displayed.`);}
    finally{event.target.value='';}
  });
  el('record-reset').addEventListener('click',async()=>{
    const token=++generation;
    try{await replace(api.packageText(source.catalog.entries.filter(entry=>entry.initial)),'Published fixture set',token);}
    catch(error){announce(`Verification unavailable: ${error.message}`);}
  });
  ['record-filter','record-audience'].forEach(id=>el(id).addEventListener('change',()=>{if(source&&entries.length)render();}));
  el('record-export').addEventListener('click',()=>{
    const url=URL.createObjectURL(new Blob([api.packageText(entries)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='iaap-assurance-verified-request-set.json';link.click();URL.revokeObjectURL(url);
  });
});

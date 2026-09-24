'use strict';

// Membership in this reviewed fixture catalog establishes the limited source boundary.
// A caller recomputing a digest cannot introduce a new trusted decision.
window.AssuranceRecords=(()=>{
  const CATALOG_SHA='sha256:326a9310fee5872132deb0cd1e8a43e324fb3123e9762faf02b420f0b1603ff1';
  const MAX_BYTES=100000;
  function canonical(value){
    if(value===null||typeof value!=='object')return JSON.stringify(value);
    if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
    return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}';
  }
  async function digest(text){
    const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
    return 'sha256:'+Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
  }
  async function openCatalog(text){
    if(await digest(text)!==CATALOG_SHA)throw Error('The source catalog did not match its published fingerprint.');
    const catalog=JSON.parse(text);
    return Object.freeze({catalog,byDigest:new Map(catalog.entries.map(entry=>[entry.record.recordDigest,entry]))});
  }
  async function verify(text,source){
    if(new TextEncoder().encode(text).length>MAX_BYTES)throw Error('File exceeds the 100 KB limit.');
    let data;try{data=JSON.parse(text);}catch{throw Error('Choose a JSON decision record or request bundle exported by the Assurance demo.');}
    const records=data?.schemaVersion==='iaap-assurance-browser-record/v1'?[data]:
      data?.schemaVersion==='iaap-assurance-portal-package/v1'&&Object.keys(data).sort().join(',')==='records,schemaVersion'?data.records:null;
    if(!Array.isArray(records)||records.length<1||records.length>50)throw Error('The file must contain 1–50 supported records.');
    const seen=new Set();const accepted=[];
    for(const record of records){
      if(!record||typeof record!=='object'||Array.isArray(record))throw Error('Invalid record.');
      const entry=source.byDigest.get(record.recordDigest);
      if(!entry)throw Error('A record is outside the published synthetic source catalog.');
      // Exact comparison rejects added fields, altered flags, and a reused known digest.
      if(canonical(record)!==canonical(entry.record))throw Error('A record was changed after it was produced.');
      const payload={...record};delete payload.recordDigest;
      if(await digest(canonical(payload))!==record.recordDigest)throw Error('Record fingerprint verification failed.');
      if(seen.has(record.requestRef))throw Error('Duplicate or conflicting results for one request. Import one result per request.');
      seen.add(record.requestRef);accepted.push(entry);
    }
    return accepted;
  }
  function project(entry,asOf){
    const r=entry.record;
    const plain=window.assurancePlainLanguage({decision:r.assuranceDecision,outcome:r.runtimeOutcome,reasonCode:r.reasonCode});
    if(plain.decision==='Explanation unavailable')throw Error('No supported explanation for this result.');
    const role=r.runtimeOutcome==='APPLIED'?'No action required':r.reasonCode==='APPROVAL_THRESHOLD_NOT_MET'?'Authorized independent approver':r.runtimeOutcome==='ROLLED BACK'?'Service operator':'Requester';
    const status=r.runtimeOutcome==='APPLIED'?'applied':r.runtimeOutcome==='REVIEW REQUIRED'?'review':r.runtimeOutcome==='ROLLED BACK'?'rollback':'stopped';
    return {record:r,plain,role,status,requestSummary:entry.requestSummary,
      toDecisionMinutes:(Date.parse(r.evaluatedAt)-Date.parse(entry.requestedAt))/60000,
      sinceDecisionMinutes:(Date.parse(asOf)-Date.parse(r.evaluatedAt))/60000};
  }
  function summarize(rows){
    const count=status=>rows.filter(row=>row.status===status).length;
    const times=rows.map(row=>row.toDecisionMinutes).sort((a,b)=>a-b);
    const n=times.length;
    return {total:n,applied:count('applied'),review:count('review'),stopped:count('stopped'),rollback:count('rollback'),medianMinutes:n?(times[Math.floor((n-1)/2)]+times[Math.floor(n/2)])/2:null};
  }
  function packageText(entries){return JSON.stringify({schemaVersion:'iaap-assurance-portal-package/v1',records:entries.map(entry=>entry.record)},null,2)+'\n';}
  return Object.freeze({MAX_BYTES,canonical,digest,openCatalog,verify,project,summarize,packageText});
})();

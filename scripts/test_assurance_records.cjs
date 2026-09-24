const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const context=vm.createContext({window:{},crypto:webcrypto,TextEncoder});
for(const path of ['assets/assurance-plain-language.js','assets/assurance-record-view.js'])vm.runInContext(fs.readFileSync(path,'utf8'),context);
const api=context.window.AssuranceRecords;
(async()=>{
  const text=fs.readFileSync('assets/assurance-records.json','utf8');
  const source=await api.openCatalog(text);
  await assert.rejects(api.openCatalog(text+' '),/fingerprint/);
  const initial=source.catalog.entries.filter(entry=>entry.initial);
  const accepted=await api.verify(api.packageText(initial),source);
  const rows=accepted.map(entry=>api.project(entry,source.catalog.asOf));
  assert.equal(rows.length,3);assert.equal(new Set(rows.map(row=>row.record.recordDigest)).size,3);
  assert.equal(JSON.stringify(api.summarize(rows)),JSON.stringify({total:3,applied:1,review:1,stopped:1,rollback:0,medianMinutes:5}));
  assert.equal(rows[1].toDecisionMinutes,11);assert.equal(rows[1].sinceDecisionMinutes,0);
  assert.equal(rows[2].role,'Authorized independent approver');
  for(const entry of source.catalog.entries){
    const [one]=await api.verify(JSON.stringify(entry.record),source);
    assert.notEqual(api.project(one,source.catalog.asOf).plain.decision,'Explanation unavailable');
  }
  const altered=JSON.parse(JSON.stringify(initial[1].record));
  altered.assuranceDecision='ALLOW';altered.runtimeOutcome='APPLIED';
  await assert.rejects(api.verify(JSON.stringify(altered),source),/changed/);
  const payload={...altered};delete payload.recordDigest;altered.recordDigest=await api.digest(api.canonical(payload));
  await assert.rejects(api.verify(JSON.stringify(altered),source),/outside/);
  for(const field of ['requestRef','authorityPackageRef','requesterRef','reasonCode','actionPerformed','custodyPreviewOnly']){
    const copy={...initial[0].record,[field]:'substitution'};
    await assert.rejects(api.verify(JSON.stringify(copy),source),/changed/);
  }
  await assert.rejects(api.verify(JSON.stringify({...initial[0].record,secret:'unapproved field'}),source),/changed/);
  await assert.rejects(api.verify(api.packageText([initial[0],initial[0]]),source),/Duplicate/);
  await assert.rejects(api.verify(api.packageText(source.catalog.entries.slice(3,5)),source),/conflicting/);
  await assert.rejects(api.verify(JSON.stringify({schemaVersion:'other',records:[]}),source),/supported/);
  await assert.rejects(api.verify(api.packageText([]),source),/1–50/);
  await assert.rejects(api.verify('x'.repeat(100001),source),/100 KB/);
  assert.equal(api.summarize([]).medianMinutes,null);
  // Every page must load exactly the bytes it names, including shared projection scripts.
  const {execFileSync}=require('node:child_process');
  for(const page of ['assurance/demo/index.html','assurance/portal/index.html']){
    const html=fs.readFileSync(page,'utf8');
    for(const [,path,sha] of html.matchAll(/src="\/(assets\/assurance[^?]+\.js)\?v=([a-f0-9]+)"/g)){
      assert.equal(execFileSync('git',['hash-object',path],{encoding:'utf8'}).trim(),sha,path);
    }
  }
  console.log('Assurance source binding, tamper rejection, isolation, timing, and asset references passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});

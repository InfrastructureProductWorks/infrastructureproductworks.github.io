#!/usr/bin/env python3
"""Enforce bounded schemas and sanitization rules for public JSON projections."""
from pathlib import Path
import json, re, sys

ROOT=Path(__file__).resolve().parents[1]
ASSURANCE=ROOT/"assets/assurance-records.json"
ROADMAP=ROOT/"data/roadmap-relationships.json"

SENSITIVE_KEY=re.compile(
    r"(?:^|_)(?:password|passwd|secret|token|credential|private_?key|access_?key|client_?secret|"
    r"connection_?string|ssh_?key|api_?key|session_?key|cookie)(?:$|_)", re.I
)
SENSITIVE_VALUE=re.compile(
    r"(?:AKIA|ASIA)[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{30,}|github_pat_[A-Za-z0-9_]{30,}|"
    r"-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----"
)

ASSURANCE_TOP={"schemaVersion","scopeRef","source","asOf","entries"}
ASSURANCE_ENTRY={"record","requestedAt","requestSummary","initial"}
ASSURANCE_RECORD={
    "schemaVersion","evaluatedAt","authorityPackageRef","presentedAuthorityId",
    "authorityPackageDigest","presentedAuthorityDigest","requestRef","requesterRef",
    "resourceRef","managedField","assuranceDecision","runtimeOutcome","reasonCode",
    "actionPerformed","reviewRequired","evidenceCustodianRef","custodyPreviewOnly",
    "notice","recordDigest"
}
ROADMAP_TOP={
    "schemaVersion","generatedAt","sourceRevision","planning","objectives","keyResults",
    "epics","relationshipModel","headlineKeyResults","progressHistory","forecastModel",
    "progressModel","roadmapBlobSha","contributionSource","contributionBlobSha"
}
ROADMAP_PLANNING={"baseline","evidenceQuarter","horizon","timingNote"}
ROADMAP_OBJECTIVE={"definition","group","headlineKeyResults","id","keyResults","progress","status","time"}
ROADMAP_KR={"definition","epics","group","id","objective","sharedRange","source","status","time"}
ROADMAP_EPIC={"completionPercent","featureCount","features","group","id","progress","progressBasis","status","time","title"}
ROADMAP_RELATIONSHIP={"epicContributionSemantics","headlineKeyResultToEpics","objectiveToEpics","objectiveToHeadlineKeyResults","registeredMeasures"}
ROADMAP_HEADLINE={"epicContributions","id","measures","objective","title"}
ROADMAP_CONTRIBUTION={"description","epic"}
ROADMAP_HISTORY={"date","epics"}
ROADMAP_FORECAST={"blockedBehavior","method","minimumSnapshots","minimumSpanDays","planningWindows"}
ROADMAP_PROGRESS={"method","note","objective","scale","strategicKeyResult"}

errors=[]

def normalized_key(key):
    key=re.sub(r"([a-z0-9])([A-Z])",r"\1_\2",str(key))
    return re.sub(r"[^A-Za-z0-9]+","_",key).lower()

def reject_sensitive(obj,path="$"):
    if isinstance(obj,dict):
        for key,value in obj.items():
            child=f"{path}.{key}"
            if SENSITIVE_KEY.search(normalized_key(key)):
                errors.append(f"{child}: sensitive field name is not allowed in public projection")
            reject_sensitive(value,child)
    elif isinstance(obj,list):
        for i,value in enumerate(obj):
            reject_sensitive(value,f"{path}[{i}]")
    elif isinstance(obj,str):
        if SENSITIVE_VALUE.search(obj):
            errors.append(f"{path}: credential-like value is not allowed in public projection")


def exact_keys(obj,allowed,label):
    if not isinstance(obj,dict):
        errors.append(f"{label}: expected object")
        return
    extra=set(obj)-allowed
    missing=allowed-set(obj)
    for key in sorted(extra):
        errors.append(f"{label}.{key}: field is outside approved public schema")
    for key in sorted(missing):
        errors.append(f"{label}.{key}: required public field missing")

try:
    assurance=json.loads(ASSURANCE.read_text("utf-8"))
except Exception as exc:
    errors.append(f"assurance projection unreadable: {exc}")
    assurance={}
try:
    roadmap=json.loads(ROADMAP.read_text("utf-8"))
except Exception as exc:
    errors.append(f"roadmap projection unreadable: {exc}")
    roadmap={}

exact_keys(assurance,ASSURANCE_TOP,"assurance")
if assurance.get("schemaVersion")!="iaap-assurance-record-catalog/v1":
    errors.append("assurance.schemaVersion: unexpected public schema version")
if assurance.get("scopeRef")!="synthetic-public-demo":
    errors.append("assurance.scopeRef: public catalog must remain synthetic-public-demo")
source=assurance.get("source")
if not isinstance(source,dict) or set(source)!={"repository","revision","path"}:
    errors.append("assurance.source: provenance shape changed")
elif source.get("repository")!="InfrastructureProductWorks/infrastructureproductworks.github.io":
    errors.append("assurance.source.repository: public projection must point to the public website repository")

entries=assurance.get("entries")
if not isinstance(entries,list) or not entries:
    errors.append("assurance.entries: at least one synthetic public record is required")
else:
    for i,entry in enumerate(entries):
        exact_keys(entry,ASSURANCE_ENTRY,f"assurance.entries[{i}]")
        record=entry.get("record") if isinstance(entry,dict) else None
        exact_keys(record,ASSURANCE_RECORD,f"assurance.entries[{i}].record")
        if isinstance(record,dict):
            if record.get("schemaVersion")!="iaap-assurance-browser-record/v1":
                errors.append(f"assurance.entries[{i}].record.schemaVersion: unexpected public record version")
            if not str(record.get("requesterRef","")).startswith("person:synthetic-"):
                errors.append(f"assurance.entries[{i}].record.requesterRef: requester must remain synthetic")
            if not str(record.get("evidenceCustodianRef","")).startswith("system:synthetic-"):
                errors.append(f"assurance.entries[{i}].record.evidenceCustodianRef: evidence custodian must remain synthetic")
            if record.get("custodyPreviewOnly") is not True:
                errors.append(f"assurance.entries[{i}].record.custodyPreviewOnly: public demo must remain preview-only")
            if "synthetic" not in str(record.get("notice","")).lower():
                errors.append(f"assurance.entries[{i}].record.notice: synthetic boundary marker missing")

exact_keys(roadmap,ROADMAP_TOP,"roadmap")
if roadmap.get("schemaVersion")!="roadmap-relationship-view/v5":
    errors.append("roadmap.schemaVersion: unexpected public roadmap schema version")
planning=roadmap.get("planning")
if not isinstance(planning,dict) or "timingNote" not in planning:
    errors.append("roadmap.planning: public timing disclaimer missing")
progress=roadmap.get("progressModel")
if not isinstance(progress,dict) or "not production readiness" not in str(progress.get("note","")).lower():
    errors.append("roadmap.progressModel.note: public readiness disclaimer missing")

# Bound nested roadmap structures too; otherwise arbitrary implementation detail
# could be added under an approved top-level field without changing the contract.
exact_keys(planning,ROADMAP_PLANNING,"roadmap.planning")
objectives=roadmap.get("objectives")
if not isinstance(objectives,list):
    errors.append("roadmap.objectives: expected array")
else:
    for i,obj in enumerate(objectives):
        exact_keys(obj,ROADMAP_OBJECTIVE,f"roadmap.objectives[{i}]")

key_results=roadmap.get("keyResults")
if not isinstance(key_results,list):
    errors.append("roadmap.keyResults: expected array")
else:
    for i,obj in enumerate(key_results):
        exact_keys(obj,ROADMAP_KR,f"roadmap.keyResults[{i}]")

epics=roadmap.get("epics")
if not isinstance(epics,dict):
    errors.append("roadmap.epics: expected object")
else:
    for epic_id,obj in epics.items():
        if not re.fullmatch(r"EP-\d+",str(epic_id)):
            errors.append(f"roadmap.epics.{epic_id}: unexpected epic identifier")
        exact_keys(obj,ROADMAP_EPIC,f"roadmap.epics.{epic_id}")

exact_keys(roadmap.get("relationshipModel"),ROADMAP_RELATIONSHIP,"roadmap.relationshipModel")

headline=roadmap.get("headlineKeyResults")
if not isinstance(headline,list):
    errors.append("roadmap.headlineKeyResults: expected array")
else:
    for i,obj in enumerate(headline):
        exact_keys(obj,ROADMAP_HEADLINE,f"roadmap.headlineKeyResults[{i}]")
        contributions=obj.get("epicContributions") if isinstance(obj,dict) else None
        if not isinstance(contributions,list):
            errors.append(f"roadmap.headlineKeyResults[{i}].epicContributions: expected array")
        else:
            for j,edge in enumerate(contributions):
                exact_keys(edge,ROADMAP_CONTRIBUTION,f"roadmap.headlineKeyResults[{i}].epicContributions[{j}]")

history=roadmap.get("progressHistory")
if not isinstance(history,list):
    errors.append("roadmap.progressHistory: expected array")
else:
    for i,obj in enumerate(history):
        exact_keys(obj,ROADMAP_HISTORY,f"roadmap.progressHistory[{i}]")
        values=obj.get("epics") if isinstance(obj,dict) else None
        if not isinstance(values,dict):
            errors.append(f"roadmap.progressHistory[{i}].epics: expected object")
        else:
            for epic_id in values:
                if not re.fullmatch(r"EP-\d+",str(epic_id)):
                    errors.append(f"roadmap.progressHistory[{i}].epics.{epic_id}: unexpected epic identifier")

exact_keys(roadmap.get("forecastModel"),ROADMAP_FORECAST,"roadmap.forecastModel")
exact_keys(roadmap.get("progressModel"),ROADMAP_PROGRESS,"roadmap.progressModel")

reject_sensitive(assurance,"assurance")
reject_sensitive(roadmap,"roadmap")

if errors:
    print("Public Projection Contract Gate: FAIL")
    for e in sorted(set(errors)):
        print(f" - {e}")
    sys.exit(1)

print("Public Projection Contract Gate: PASS")

#!/usr/bin/env python3
"""Enforce bounded schemas and sanitization rules for public JSON projections."""
from pathlib import Path
import json, re, sys

ROOT=Path(__file__).resolve().parents[1]
ASSURANCE=ROOT/"assets/assurance-records.json"
ROADMAP=ROOT/"data/roadmap-relationships.json"

SENSITIVE_KEY=re.compile(
    r"(?:^|_)(?:password|passwd|secret|token|credential|bearer|private_?key|access_?key|client_?secret|"
    r"connection_?string|ssh_?key|api_?key|session_?key|cookie)(?:$|_)", re.I
)
SENSITIVE_VALUE=re.compile(
    r"(?:AKIA|ASIA)[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{30,}|github_pat_[A-Za-z0-9_]{30,}|"
    r"-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----"
)
EPIC_ID_PATTERN=re.compile(r"EP-\d+", re.ASCII)

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
    "schemaVersion","generatedAt","sourceCommitment","planning","objectives","keyResults",
    "epics","relationshipModel","headlineKeyResults","progressHistory","forecastModel",
    "progressModel","roadmapCommitment","contributionSource","contributionCommitment"
}
ROADMAP_PLANNING={"baseline","evidenceQuarter","horizon","timingNote"}
ROADMAP_OBJECTIVE={"definition","group","headlineKeyResults","id","keyResults","progress","status","time"}
ROADMAP_KEY_RESULT={"definition","epics","group","id","objective","sharedRange","source","status","time"}
ROADMAP_EPIC={"completionPercent","featureCount","features","group","id","progress","progressBasis","status","time","title"}
ROADMAP_RELATIONSHIP_MODEL={"epicContributionSemantics","headlineKeyResultToEpics","objectiveToEpics","objectiveToHeadlineKeyResults","registeredMeasures"}
ROADMAP_HEADLINE_KR={"epicContributions","id","measures","objective","title"}
ROADMAP_EPIC_CONTRIBUTION={"description","epic"}
ROADMAP_PROGRESS_HISTORY={"date","epics"}
ROADMAP_FORECAST_MODEL={"blockedBehavior","method","minimumSnapshots","minimumSpanDays","planningWindows"}
ROADMAP_PROGRESS_MODEL={"method","note","objective","scale","strategicKeyResult"}

errors=[]

def normalized_key(key):
    text=str(key)
    text=re.sub(r"([a-z0-9])([A-Z])",r"\1_\2",text)
    text=re.sub(r"([A-Z]+)([A-Z][a-z])",r"\1_\2",text)
    return re.sub(r"[^A-Za-z0-9]+","_",text).lower()


def normalized_key_forms(key):
    text=str(key)
    folded=re.sub(r"[^A-Za-z0-9]+","_",text).lower()
    split=normalized_key(text)
    return (folded,) if folded==split else (folded,split)


def is_valid_epic_id(epic_id):
    return isinstance(epic_id,str) and bool(EPIC_ID_PATTERN.fullmatch(epic_id))


def reject_sensitive(obj,path="$",findings=None):
    target=errors if findings is None else findings
    if isinstance(obj,dict):
        for key,value in obj.items():
            child=f"{path}.{key}"
            if any(SENSITIVE_KEY.search(form) for form in normalized_key_forms(key)):
                target.append(f"{child}: sensitive field name is not allowed in public projection")
            reject_sensitive(value,child,target)
    elif isinstance(obj,list):
        for i,value in enumerate(obj):
            reject_sensitive(value,f"{path}[{i}]",target)
    elif isinstance(obj,str):
        if SENSITIVE_VALUE.search(obj):
            target.append(f"{path}: credential-like value is not allowed in public projection")


def exact_keys(obj,allowed,label,findings=None):
    target=errors if findings is None else findings
    if not isinstance(obj,dict):
        target.append(f"{label}: expected object")
        return
    extra=set(obj)-allowed
    missing=allowed-set(obj)
    for key in sorted(extra):
        target.append(f"{label}.{key}: field is outside approved public schema")
    for key in sorted(missing):
        target.append(f"{label}.{key}: required public field missing")


def validate_projections(assurance,roadmap):
    findings=[]

    exact_keys(assurance,ASSURANCE_TOP,"assurance",findings)
    if isinstance(assurance,dict):
        if assurance.get("schemaVersion")!="iaap-assurance-record-catalog/v1":
            findings.append("assurance.schemaVersion: unexpected public schema version")
        if assurance.get("scopeRef")!="synthetic-public-demo":
            findings.append("assurance.scopeRef: public catalog must remain synthetic-public-demo")
        source=assurance.get("source")
        if not isinstance(source,dict) or set(source)!={"repository","revision","path"}:
            findings.append("assurance.source: provenance shape changed")
        elif source.get("repository")!="InfrastructureProductWorks/infrastructureproductworks.github.io":
            findings.append("assurance.source.repository: public projection must point to the public website repository")

        entries=assurance.get("entries")
        if not isinstance(entries,list) or not entries:
            findings.append("assurance.entries: at least one synthetic public record is required")
        else:
            for i,entry in enumerate(entries):
                exact_keys(entry,ASSURANCE_ENTRY,f"assurance.entries[{i}]",findings)
                record=entry.get("record") if isinstance(entry,dict) else None
                exact_keys(record,ASSURANCE_RECORD,f"assurance.entries[{i}].record",findings)
                if isinstance(record,dict):
                    if record.get("schemaVersion")!="iaap-assurance-browser-record/v1":
                        findings.append(f"assurance.entries[{i}].record.schemaVersion: unexpected public record version")
                    if not str(record.get("requesterRef","")).startswith("person:synthetic-"):
                        findings.append(f"assurance.entries[{i}].record.requesterRef: requester must remain synthetic")
                    if not str(record.get("evidenceCustodianRef","")).startswith("system:synthetic-"):
                        findings.append(f"assurance.entries[{i}].record.evidenceCustodianRef: evidence custodian must remain synthetic")
                    if record.get("custodyPreviewOnly") is not True:
                        findings.append(f"assurance.entries[{i}].record.custodyPreviewOnly: public demo must remain preview-only")
                    if "synthetic" not in str(record.get("notice","")).lower():
                        findings.append(f"assurance.entries[{i}].record.notice: synthetic boundary marker missing")

    exact_keys(roadmap,ROADMAP_TOP,"roadmap",findings)
    if isinstance(roadmap,dict):
        exact_keys(roadmap.get("planning"),ROADMAP_PLANNING,"roadmap.planning",findings)

        objectives=roadmap.get("objectives")
        if not isinstance(objectives,list):
            findings.append("roadmap.objectives: expected array")
        else:
            for i,item in enumerate(objectives):
                exact_keys(item,ROADMAP_OBJECTIVE,f"roadmap.objectives[{i}]",findings)
                if isinstance(item,dict):
                    if not isinstance(item.get("keyResults"),list):
                        findings.append(f"roadmap.objectives[{i}].keyResults: expected array")
                    if not isinstance(item.get("headlineKeyResults"),list):
                        findings.append(f"roadmap.objectives[{i}].headlineKeyResults: expected array")

        key_results=roadmap.get("keyResults")
        if not isinstance(key_results,list):
            findings.append("roadmap.keyResults: expected array")
        else:
            for i,item in enumerate(key_results):
                exact_keys(item,ROADMAP_KEY_RESULT,f"roadmap.keyResults[{i}]",findings)
                if isinstance(item,dict) and not isinstance(item.get("epics"),list):
                    findings.append(f"roadmap.keyResults[{i}].epics: expected array")

        epics=roadmap.get("epics")
        if not isinstance(epics,dict):
            findings.append("roadmap.epics: expected object")
        else:
            for epic_id,item in epics.items():
                if not is_valid_epic_id(epic_id):
                    findings.append(f"roadmap.epics.{epic_id}: unexpected epic identifier")
                exact_keys(item,ROADMAP_EPIC,f"roadmap.epics[{epic_id}]",findings)
                if isinstance(item,dict) and not isinstance(item.get("features"),list):
                    findings.append(f"roadmap.epics[{epic_id}].features: expected array")

        exact_keys(roadmap.get("relationshipModel"),ROADMAP_RELATIONSHIP_MODEL,"roadmap.relationshipModel",findings)

        headline=roadmap.get("headlineKeyResults")
        if not isinstance(headline,list):
            findings.append("roadmap.headlineKeyResults: expected array")
        else:
            for i,item in enumerate(headline):
                exact_keys(item,ROADMAP_HEADLINE_KR,f"roadmap.headlineKeyResults[{i}]",findings)
                if isinstance(item,dict):
                    if not isinstance(item.get("measures"),list):
                        findings.append(f"roadmap.headlineKeyResults[{i}].measures: expected array")
                    contributions=item.get("epicContributions")
                    if not isinstance(contributions,list):
                        findings.append(f"roadmap.headlineKeyResults[{i}].epicContributions: expected array")
                    else:
                        for j,edge in enumerate(contributions):
                            exact_keys(edge,ROADMAP_EPIC_CONTRIBUTION,f"roadmap.headlineKeyResults[{i}].epicContributions[{j}]",findings)

        history=roadmap.get("progressHistory")
        if not isinstance(history,list):
            findings.append("roadmap.progressHistory: expected array")
        else:
            for i,item in enumerate(history):
                exact_keys(item,ROADMAP_PROGRESS_HISTORY,f"roadmap.progressHistory[{i}]",findings)
                if isinstance(item,dict):
                    values=item.get("epics")
                    if not isinstance(values,dict):
                        findings.append(f"roadmap.progressHistory[{i}].epics: expected object")
                    else:
                        for epic_id in values:
                            if not is_valid_epic_id(epic_id):
                                findings.append(f"roadmap.progressHistory[{i}].epics.{epic_id}: unexpected epic identifier")

        exact_keys(roadmap.get("forecastModel"),ROADMAP_FORECAST_MODEL,"roadmap.forecastModel",findings)
        exact_keys(roadmap.get("progressModel"),ROADMAP_PROGRESS_MODEL,"roadmap.progressModel",findings)
        if roadmap.get("schemaVersion")!="roadmap-relationship-view/v6":
            findings.append("roadmap.schemaVersion: unexpected public roadmap schema version")
        planning=roadmap.get("planning")
        if not isinstance(planning,dict) or "timingNote" not in planning:
            findings.append("roadmap.planning: public timing disclaimer missing")
        progress=roadmap.get("progressModel")
        if not isinstance(progress,dict) or "not production readiness" not in str(progress.get("note","")).lower():
            findings.append("roadmap.progressModel.note: public readiness disclaimer missing")

    reject_sensitive(assurance,"assurance",findings)
    reject_sensitive(roadmap,"roadmap",findings)
    return findings


def main():
    global errors
    errors=[]
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

    errors.extend(validate_projections(assurance,roadmap))

    if errors:
        print("Public Projection Contract Gate: FAIL")
        for e in sorted(set(errors)):
            print(f" - {e}")
        sys.exit(1)

    print("Public Projection Contract Gate: PASS")


if __name__=="__main__":
    main()

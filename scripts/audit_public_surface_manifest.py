#!/usr/bin/env python3
"""Fail closed when browser-facing public surfaces exceed the reviewed manifest."""
from pathlib import Path
from urllib.parse import urlparse
import json, os, re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/"config/public-surface-manifest.json"
ORG="InfrastructureProductWorks"
HTML_SUFFIXES={".html",".htm"}
DATA_SUFFIXES={".json"}
DOWNLOAD_SUFFIXES={".pdf"}
ORG_REPO=re.compile(r"https://github\.com/InfrastructureProductWorks/([A-Za-z0-9_.-]+)(?:[/#?\s"']|$)",re.I)
RAW_FEED=re.compile(r"https://raw\.githubusercontent\.com/InfrastructureProductWorks/[^\s"']+",re.I)

def git_blob(path):
    try:
        return subprocess.check_output(["git","hash-object",str(ROOT/path)],cwd=ROOT,text=True).strip()
    except Exception:
        return None

def read_manifest():
    try:
        data=json.loads(MANIFEST.read_text("utf-8"))
    except Exception as exc:
        raise SystemExit(f"Public Surface Manifest Gate: FAIL\n - manifest unreadable: {exc}")
    if data.get("schemaVersion")!="ipw-public-surface/v1":
        raise SystemExit("Public Surface Manifest Gate: FAIL\n - unsupported manifest schema")
    return data

def tracked_files():
    out=subprocess.check_output(["git","ls-files"],cwd=ROOT,text=True)
    return set(out.splitlines())

manifest=read_manifest()
tracked=tracked_files()
errors=[]

pages=set(manifest.get("pages",[]))
actual_pages={p for p in tracked if Path(p).suffix.lower() in HTML_SUFFIXES}
for p in sorted(actual_pages-pages):
    errors.append(f"{p}: public HTML route is not declared in manifest")
for p in sorted(pages-actual_pages):
    errors.append(f"{p}: manifest-declared public route is missing")

declared_data={item["path"]:item for item in manifest.get("publicData",[])}
declared_downloads={item["path"]:item for item in manifest.get("downloads",[])}

# Browser-served JSON/PDF surfaces must be explicitly declared. Config/package JSON
# and governance/source files are excluded because they are not linked site surfaces.
site_json={p for p in tracked if Path(p).suffix.lower() in DATA_SUFFIXES and (p.startswith("assets/") or p.startswith("data/"))}
site_pdfs={p for p in tracked if Path(p).suffix.lower() in DOWNLOAD_SUFFIXES and p.startswith("assets/")}

for p in sorted(site_json-set(declared_data)):
    errors.append(f"{p}: public machine-readable JSON is not declared in manifest")
for p in sorted(set(declared_data)-site_json):
    errors.append(f"{p}: manifest-declared public JSON is missing")
for p in sorted(site_pdfs-set(declared_downloads)):
    errors.append(f"{p}: public download is not declared in manifest")
for p in sorted(set(declared_downloads)-site_pdfs):
    errors.append(f"{p}: manifest-declared public download is missing")

for group in (declared_data,declared_downloads):
    for path,item in group.items():
        expected=item.get("gitBlobSha","")
        actual=git_blob(path)
        if not re.fullmatch(r"[0-9a-f]{40}",expected or ""):
            errors.append(f"{path}: manifest provenance digest is invalid")
        elif actual!=expected:
            errors.append(f"{path}: public artifact changed without manifest provenance update")

approved_repos={x.lower() for x in manifest.get("publicRepositories",[])}
approved_feeds=set(manifest.get("externalDataFeeds",[]))

for rel in sorted(tracked):
    suffix=Path(rel).suffix.lower()
    if suffix not in {".html",".htm",".js",".mjs",".cjs",".md",".css",".json"}:
        continue
    try:
        body=(ROOT/rel).read_text("utf-8")
    except Exception:
        continue
    for m in ORG_REPO.finditer(body):
        repo=f"{ORG}/{m.group(1)}".lower()
        if repo not in approved_repos:
            errors.append(f"{rel}: organization repository reference is not approved in public manifest: {repo}")
    for m in RAW_FEED.finditer(body):
        url=m.group(0).rstrip(").,;")
        if url not in approved_feeds:
            errors.append(f"{rel}: external organization data feed is not approved in public manifest: {url}")

if errors:
    print("Public Surface Manifest Gate: FAIL")
    for e in sorted(set(errors)):
        print(f" - {e}")
    sys.exit(1)

print("Public Surface Manifest Gate: PASS")

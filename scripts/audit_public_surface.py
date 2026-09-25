#!/usr/bin/env python3
"""Fail closed when the website exposes undeclared public surfaces."""
from pathlib import Path
import json, os, re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/"config/public-surface-manifest.json"
URL_RE=re.compile(r"https://github\.com/InfrastructureProductWorks/([A-Za-z0-9_.-]+)")
RAW_RE=re.compile(r"https://raw\.githubusercontent\.com/InfrastructureProductWorks/[^\s"'<>]+")
JSON_FETCH_RE=re.compile(r"""(?:fetch\s*\(\s*|const\s+[A-Za-z0-9_]+\s*=\s*)["']([^"']+\.json(?:\?[^"']*)?)["']""",re.I)

def git_blob(path):
    try:
        return subprocess.check_output(["git","hash-object",str(ROOT/path)],cwd=ROOT,text=True).strip()
    except Exception:
        return None

def resolve_local(rel,url):
    value=url.split("#",1)[0].split("?",1)[0]
    if not value or value.startswith("//") or "://" in value:
        return None
    if value.startswith("/"):
        return value.lstrip("/")
    try:
        return ((ROOT/rel).parent/Path(value)).resolve().relative_to(ROOT.resolve()).as_posix()
    except Exception:
        return None

def load_manifest():
    try:
        data=json.loads(MANIFEST.read_text("utf-8"))
    except Exception as exc:
        raise SystemExit(f"Public Surface Manifest Gate: FAIL\n - manifest unreadable: {exc}")
    if data.get("schemaVersion")!="ipw-public-surface/v1":
        raise SystemExit("Public Surface Manifest Gate: FAIL\n - unsupported manifest schema")
    return data

m=load_manifest()
errors=[]

declared_pages=set(m.get("pages",[]))
current_pages={p.relative_to(ROOT).as_posix() for p in ROOT.rglob("*") if p.is_file() and p.suffix.lower() in {".html",".htm"}}
for rel in sorted(current_pages-declared_pages):
    errors.append(f"{rel}: browser-facing page is not declared in public surface manifest")
for rel in sorted(declared_pages-current_pages):
    errors.append(f"{rel}: declared public page is missing")

for section in ("publicData","downloads"):
    seen=set()
    for item in m.get(section,[]):
        path=item.get("path","")
        sha=item.get("gitBlobSha","")
        if not path or path in seen:
            errors.append(f"{section}: duplicate or empty path declaration")
            continue
        seen.add(path)
        p=ROOT/path
        if not p.is_file():
            errors.append(f"{path}: declared {section} artifact missing")
            continue
        actual=git_blob(path)
        if actual!=sha:
            errors.append(f"{path}: public artifact changed without manifest provenance update")

declared_json={x["path"] for x in m.get("publicData",[]) if isinstance(x,dict) and x.get("path")}
declared_downloads={x["path"] for x in m.get("downloads",[]) if isinstance(x,dict) and x.get("path")}
declared_repos=set(m.get("publicRepositories",[]))
declared_raw=set(m.get("externalDataFeeds",[]))

# Browser-consumed JSON must be declared. This deliberately targets fetches and
# directly assigned JSON URLs, not prose mentioning .json filenames.
for p in ROOT.rglob("*"):
    if not p.is_file() or ".git" in p.parts:
        continue
    if p.suffix.lower() not in {".html",".htm",".js",".mjs",".cjs"}:
        continue
    try:
        body=p.read_text("utf-8")
    except UnicodeDecodeError:
        continue
    rel=p.relative_to(ROOT).as_posix()
    for match in JSON_FETCH_RE.finditer(body):
        path=resolve_local(rel,match.group(1))
        if path and path.endswith(".json") and path not in declared_json:
            errors.append(f"{rel}: browser-consumed JSON is not declared: {path}")
    for repo in URL_RE.findall(body):
        fq=f"InfrastructureProductWorks/{repo}"
        if fq not in declared_repos:
            errors.append(f"{rel}: organization repository link is not declared public: {fq}")
    for raw in RAW_RE.findall(body):
        if raw not in declared_raw:
            errors.append(f"{rel}: external raw data feed is not declared: {raw}")

# Downloads linked from HTML must be declared when they are PDFs.
PDF_LINK_RE=re.compile(r"""(?is)href\s*=\s*["']([^"']+\.pdf(?:\?[^"']*)?)["']""")
for rel in current_pages:
    body=(ROOT/rel).read_text("utf-8",errors="ignore")
    for match in PDF_LINK_RE.finditer(body):
        path=resolve_local(rel,match.group(1))
        if path and path not in declared_downloads:
            errors.append(f"{rel}: linked public PDF is not declared: {path}")

if errors:
    print("Public Surface Manifest Gate: FAIL")
    for e in sorted(set(errors)):
        print(f" - {e}")
    sys.exit(1)

print("Public Surface Manifest Gate: PASS")

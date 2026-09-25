#!/usr/bin/env python3
"""Fail closed on new reconstruction-enabling public artifacts without stripping content."""
from pathlib import Path
from html.parser import HTMLParser
import os, re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
SKIP={".git","node_modules"}
PUBLISHED_TEXT_EXT={".html",".htm",".js",".mjs",".cjs",".json",".svg",".css",".xml",".txt",".md",".webmanifest"}
FORBIDDEN_NAMES={"openapi.json","openapi.yaml","openapi.yml","swagger.json","swagger.yaml","swagger.yml",
 ".env",".env.local",".env.production","terraform.tfstate","terraform.tfstate.backup"}
FORBIDDEN_SUFFIXES=(".map",".tfstate")
KEY_NAMES={"id_rsa","id_dsa","id_ecdsa","id_ed25519"}
KEY_SUFFIXES={".pem",".key",".p12",".pfx"}
SECRET_PATTERNS=[
 ("private key",re.compile(rb"-----BEGIN (?:(?:RSA|EC|OPENSSH|DSA) |ENCRYPTED )?PRIVATE KEY-----")),
 ("GitHub token",re.compile(rb"\bgh[pousr]_[A-Za-z0-9_]{30,}\b")),
 ("GitHub fine-grained token",re.compile(rb"\bgithub_pat_[A-Za-z0-9_]{30,}\b")),
 ("AWS access key",re.compile(rb"\bAKIA[0-9A-Z]{16}\b")),
]
PRIVATE_NAMES=(
 "iaap-guard","iaap-forge","iaap-console","ai-powered-infrastructure-as-a-product",
 "backstage-infrastructure-product-storefront-poc","multicloud-foundation-poc-integration",
)
PRIVATE_REF=re.compile(r"(?<![A-Za-z0-9_.-])(?:InfrastructureProductWorks/)?(?:"+
 "|".join(re.escape(x) for x in PRIVATE_NAMES)+r")(?![A-Za-z0-9_.-])",re.I)

def files_at(ref):
    try:
        out=subprocess.check_output(["git","ls-tree","-r","--name-only",ref],cwd=ROOT,text=True)
        return set(out.splitlines())
    except Exception:
        return set()

# Existing public references are preserved, not silently deleted. The gate blocks NEW
# browser-facing occurrences relative to the PR base. On main pushes, HEAD^ is the baseline.
base_ref=None
# CI provides the immutable comparison base explicitly. This avoids treating GitHub's
# synthetic PR merge commit as the baseline. Local runs fall back to origin/main/HEAD^.
candidate=os.environ.get("EXTRACTION_BASE_SHA","").strip()
if candidate and subprocess.run(["git","cat-file","-e",candidate+"^{commit}"],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode==0:
    base_ref=candidate
elif subprocess.run(["git","rev-parse","--verify","origin/main"],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode==0:
    base_ref="origin/main"
elif subprocess.run(["git","rev-parse","--verify","HEAD^"],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode==0:
    base_ref="HEAD^"
base_files=files_at(base_ref) if base_ref else set()

errors=[]; pages=[]
for p in ROOT.rglob("*"):
    if not p.is_file() or any(part in SKIP for part in p.parts): continue
    rel=p.relative_to(ROOT).as_posix(); low=p.name.lower()
    if low in FORBIDDEN_NAMES or low in KEY_NAMES or any(low.endswith(s) for s in FORBIDDEN_SUFFIXES):
        errors.append(f"{rel}: forbidden implementation/credential artifact")
    if p.suffix.lower() in KEY_SUFFIXES:
        errors.append(f"{rel}: credential-bearing file type is not publishable")
    if p.suffix.lower()==".html": pages.append(rel)

    # Secret signatures are byte-scanned regardless of extension or file size.
    # Stream in overlapping chunks so large publishable assets cannot bypass the gate.
    overlap=b""
    with p.open("rb") as fh:
        while True:
            chunk=fh.read(1024*1024)
            if not chunk: break
            scan=overlap+chunk
            for label,rx in SECRET_PATTERNS:
                if rx.search(scan):
                    errors.append(f"{rel}: possible {label}")
            overlap=scan[-512:]

    if p.suffix.lower() in PUBLISHED_TEXT_EXT:
        text=p.read_text("utf-8",errors="ignore")
        # Preserve exact baseline contexts, not just identifier counts. Moving an existing
        # name into a new URL/path is therefore a new exposure.
        def contexts(body):
            out=[]
            for m in PRIVATE_REF.finditer(body):
                left=max(0,m.start()-120); right=min(len(body),m.end()+120)
                ctx=re.sub(r"\\s+"," ",body[left:right]).strip().lower()
                out.append((m.group(0).lower(),ctx))
            return out
        current=contexts(text)
        if current:
            prior=[]
            if base_ref and rel in base_files:
                try:
                    old=subprocess.check_output(["git","show",f"{base_ref}:{rel}"],cwd=ROOT,text=True,errors="ignore")
                    prior=contexts(old)
                except Exception: pass
            remaining=list(prior)
            for leak,ctx in current:
                item=(leak,ctx)
                if item in remaining:
                    remaining.remove(item)
                else:
                    errors.append(f"{rel}: private implementation repository reference appears in new context: {leak}")

required={"index.html","about/index.html","portfolio/index.html","security/index.html",
 "storefront/index.html","guard/index.html","console/index.html","forge/index.html",
 "assurance/index.html","terms/index.html","privacy/index.html"}
for rel in sorted(required-set(pages)): errors.append(f"{rel}: required public surface removed")

# Content-preservation contract: required pages may grow, but hardening may not silently
# replace them with materially smaller shells. Compare normalized visible-text volume to base.
TAG=re.compile(r"<[^>]+>")
SPACE=re.compile(r"\s+")
def visible_len(text):
    return len(SPACE.sub(" ",TAG.sub(" ",text)).strip())
if base_ref:
    for rel in sorted(required & set(pages) & base_files):
        try:
            old=subprocess.check_output(["git","show",f"{base_ref}:{rel}"],cwd=ROOT,text=True,errors="ignore")
            old_len=visible_len(old); new_len=visible_len((ROOT/rel).read_text("utf-8",errors="ignore"))
            # A 20% tolerance permits normal editing while rejecting stripped/empty shells.
            if old_len>=200 and new_len < int(old_len*0.80):
                errors.append(f"{rel}: visible content reduced below preservation floor ({new_len}/{old_len})")
        except Exception as exc:
            errors.append(f"{rel}: unable to verify content-preservation baseline: {exc}")

for rel in ("console/demo/index.html","assurance/demo/index.html","assurance/portal/index.html"):
    p=ROOT/rel
    if not p.exists(): errors.append(f"{rel}: bounded public demo surface removed"); continue
    t=p.read_text("utf-8",errors="ignore").lower()
    if not any(word in t for word in ("synthetic","sanitized")):
        errors.append(f"{rel}: demo no longer declares synthetic/sanitized boundary")

if errors:
    print("Extraction Resistance Gate: FAIL")
    for e in errors: print(f" - {e}")
    sys.exit(1)
print(f"Extraction Resistance Gate: PASS ({len(pages)} HTML pages inventoried; existing visible content preserved)")

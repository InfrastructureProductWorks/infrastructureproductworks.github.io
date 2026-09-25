#!/usr/bin/env python3
"""Fail closed on accidental reconstruction-enabling public artifacts.

This gate is intentionally content-preserving: it does not judge or rewrite visible
portfolio copy. It blocks implementation leakage and records a stable inventory of
public-facing pages so hardening cannot quietly remove the showcase.
"""
from pathlib import Path
import re, sys

ROOT=Path(__file__).resolve().parents[1]
SKIP={".git","node_modules"}
TEXT_EXT={".html",".js",".json",".md",".svg",".css",".yml",".yaml",".txt"}
# Artifacts that turn a portfolio into a machine-readable implementation spec.
FORBIDDEN_NAMES={
 "openapi.json","openapi.yaml","openapi.yml","swagger.json","swagger.yaml","swagger.yml",
 ".env",".env.local",".env.production","terraform.tfstate","terraform.tfstate.backup",
}
FORBIDDEN_SUFFIXES=(".map",".tfstate")
SECRET_PATTERNS=[
 ("private key", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----")),
 ("GitHub token", re.compile(r"\bgh[pousr]_[A-Za-z0-9_]{30,}\b")),
 ("AWS access key", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
]
# Internal implementation/repository references should not leak into browser assets.
PRIVATE_REF=re.compile(r"(?:github\.com|raw\.githubusercontent\.com)/InfrastructureProductWorks/(?:iaap-guard|iaap-forge|iaap-console|ai-powered-infrastructure-as-a-product|backstage-infrastructure-product-storefront-poc|multicloud-foundation-poc-integration)(?:[/'\"]|$)",re.I)

errors=[]
pages=[]
for p in ROOT.rglob("*"):
    if not p.is_file() or any(part in SKIP for part in p.parts):
        continue
    rel=p.relative_to(ROOT).as_posix()
    low=p.name.lower()
    if low in FORBIDDEN_NAMES or any(low.endswith(s) for s in FORBIDDEN_SUFFIXES):
        errors.append(f"{rel}: forbidden implementation artifact")
    if p.suffix.lower()==".html":
        pages.append(rel)
    if p.suffix.lower() not in TEXT_EXT or p.stat().st_size>2_000_000:
        continue
    text=p.read_text("utf-8",errors="ignore")
    for label,rx in SECRET_PATTERNS:
        if rx.search(text): errors.append(f"{rel}: possible {label}")
    if p.suffix.lower() in {".html",".js",".json",".svg"} and PRIVATE_REF.search(text):
        errors.append(f"{rel}: private implementation repository reference exposed")

# Preserve the current public product/story surface. Additive pages are fine.
required={
 "index.html","about/index.html","portfolio/index.html","security/index.html",
 "storefront/index.html","guard/index.html","console/index.html","forge/index.html",
 "assurance/index.html","terms/index.html","privacy/index.html",
}
missing=sorted(required-set(pages))
if missing:
    errors.extend(f"{p}: required public surface removed" for p in missing)

# Demo boundaries remain explicit rather than silently becoming operational clients.
for rel in ("console/demo/index.html","assurance/demo/index.html","assurance/portal/index.html"):
    p=ROOT/rel
    if not p.exists():
        errors.append(f"{rel}: bounded public demo surface removed")
        continue
    t=p.read_text("utf-8",errors="ignore").lower()
    if not any(word in t for word in ("synthetic","sanitized")):
        errors.append(f"{rel}: demo no longer declares synthetic/sanitized boundary")

if errors:
    print("Extraction Resistance Gate: FAIL")
    for e in errors: print(f" - {e}")
    sys.exit(1)
print(f"Extraction Resistance Gate: PASS ({len(pages)} HTML pages inventoried; visible content preserved)")

#!/usr/bin/env python3
"""Block new browser-facing exposure of private/internal implementation repositories."""
from collections import Counter
from pathlib import Path
from urllib.parse import unquote
import html, os, re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
SKIP={".git","node_modules"}

# Build sensitive identifiers without spelling them as contiguous literals in this
# public validator, so the validator itself does not need a self-exemption.
PRIVATE_NAMES=(
    "backstage-infrastructure-product-"+"storefront-poc",
    "iaap-"+"forge",
    "iaap-"+"console",
    "iaap-"+"assurance",
    "crossplane-multicloud-seed-"+"poc",
    "multicloud-foundation-poc-"+"integration",
)
PRIVATE_REF=re.compile(
    r"(?<![A-Za-z0-9_.-])(?:InfrastructureProductWorks/)?(?:"
    +"|".join(re.escape(x) for x in PRIVATE_NAMES)
    +r")(?![A-Za-z0-9_.-])",
    re.I,
)
JS_HEX=re.compile(r"\\x([0-9a-fA-F]{2})")
JS_UNICODE=re.compile(r"\\u([0-9a-fA-F]{4})")

def normalize_browser_text(body):
    current=body
    for _ in range(8):
        prior=current
        current=html.unescape(current)
        current=unquote(current)
        current=JS_HEX.sub(lambda m: chr(int(m.group(1),16)),current)
        current=JS_UNICODE.sub(lambda m: chr(int(m.group(1),16)),current)
        if current==prior:
            break
    return current

def baseline_ref():
    candidate=os.environ.get("PRIVATE_REF_BASE_SHA","").strip()
    if candidate and subprocess.run(
        ["git","cat-file","-e",candidate+"^{commit}"],cwd=ROOT,
        stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL
    ).returncode==0:
        return candidate
    return None

def baseline_files(ref):
    try:
        out=subprocess.check_output(["git","ls-tree","-r","--name-only",ref],cwd=ROOT,text=True)
        return set(out.splitlines())
    except Exception:
        return set()

def read_baseline(ref,rel):
    try:
        return subprocess.check_output(
            ["git","show",f"{ref}:{rel}"],cwd=ROOT,text=True,errors="strict"
        )
    except Exception:
        return None

def read_text_file(path):
    raw=path.read_bytes()
    if b"\x00" in raw:
        return None
    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError:
        return None

def contexts(body):
    normalized=normalize_browser_text(body)
    found=[]
    for m in PRIVATE_REF.finditer(normalized):
        left=max(0,m.start()-160)
        right=min(len(normalized),m.end()+160)
        ctx=re.sub(r"\s+"," ",normalized[left:right]).strip().lower()
        found.append((m.group(0).lower(),ctx))
    return Counter(found)

base=baseline_ref()
if os.environ.get("GITHUB_ACTIONS","").lower()=="true" and not base:
    print("Private Implementation Reference Gate: FAIL")
    print(" - immutable comparison baseline could not be resolved")
    sys.exit(1)

base_files=baseline_files(base) if base else set()
errors=[]

for p in ROOT.rglob("*"):
    if not p.is_file() or any(part in SKIP for part in p.parts):
        continue
    rel=p.relative_to(ROOT).as_posix()
    current_text=read_text_file(p)
    if current_text is None:
        continue

    current=contexts(current_text)
    if not current:
        continue

    prior=Counter()
    if base and rel in base_files:
        old=read_baseline(base,rel)
        if old is not None:
            prior=contexts(old)

    extra=current-prior
    for (identifier,ctx),count in extra.items():
        for _ in range(count):
            errors.append(
                f"{rel}: new or relocated private/internal implementation reference: {identifier}"
            )

if errors:
    print("Private Implementation Reference Gate: FAIL")
    for e in sorted(errors):
        print(f" - {e}")
    sys.exit(1)

print("Private Implementation Reference Gate: PASS")

#!/usr/bin/env python3
"""Block new browser-facing exposure of private/internal implementation repositories."""
from collections import Counter
from pathlib import Path
import posixpath
from urllib.parse import unquote
import html, os, re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
SKIP={".git"}

# Build sensitive identifiers without spelling them as contiguous literals in this
# public validator, so the validator itself does not need a self-exemption.
PRIVATE_FRAGMENTS=(
    ("backstage-infrastructure-product-","storefront-poc"),
    ("iaap-","forge"),
    ("iaap-","console"),
    ("iaap-","assurance"),
    ("iaap-","guard-core"),
    ("composite-ai-infrastructure-","product-poc"),
    ("multicloud-","foundation-product-poc"),
    ("crossplane-multicloud-seed-","poc"),
    ("multicloud-foundation-poc-","integration"),
)
PUBLIC_SLUGS={"infrastructureproductworks.github.io","ai-powered-infrastructure-as-a-product","iaap-guard","enterprise-azure-governance",".github"}
OWNED_COORDINATE=re.compile(r"(?:InfrastructureProductWorks|SAABOLImpactVenture)/([A-Za-z0-9_.-]+(?:/[A-Za-z0-9_.-]+)*)",re.I)
PRIVATE_NAMES=tuple("".join(parts) for parts in PRIVATE_FRAGMENTS)
PRIVATE_REF=re.compile(
    r"(?<![A-Za-z0-9_.-])(?:InfrastructureProductWorks/)?(?:"
    +"|".join(re.escape(x) for x in PRIVATE_NAMES)
    +r")(?![A-Za-z0-9_-])",
    re.I,
)
JS_HEX=re.compile(r"\\x([0-9a-fA-F]{2})")
JS_UNICODE=re.compile(r"\\u([0-9a-fA-F]{4})")
PDF_SUFFIXES={".pdf"}
JS_CONCAT=re.compile(r"""(["'])([^"'\\\r\n]*)\1\s*\+\s*(["'])([^"'\\\r\n]*)\3""")

def normalize_browser_text(body):
    current=body
    for _ in range(8):
        prior=current
        current=html.unescape(current)
        current=unquote(current)
        current=JS_HEX.sub(lambda m: chr(int(m.group(1),16)),current)
        current=JS_UNICODE.sub(lambda m: chr(int(m.group(1),16)),current)
        current=JS_CONCAT.sub(lambda m: m.group(1)+m.group(2)+m.group(4)+m.group(1),current)
        current=current.replace("\\", "/")
        current=re.sub(r"/+", "/", current)
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

PRIVATE_PATH_REF=re.compile("|".join(re.escape(name) for name in PRIVATE_NAMES),re.I)

def path_reference_counts(path):
    # Public paths expose identifiers even with prefixes, compound extensions,
    # or archive-like suffixes. Match known names throughout the normalized path.
    normalized=normalize_browser_text(path)
    return Counter(m.group(0).lower() for m in PRIVATE_PATH_REF.finditer(normalized))

def reference_counts(body):
    normalized=normalize_browser_text(body)
    matches=Counter(m.group(0).lower() for m in PRIVATE_REF.finditer(normalized))
    matches.update(m.group(0).lower() for m in OWNED_COORDINATE.finditer(normalized) if posixpath.normpath(m.group(1)).split("/")[0].lower().removesuffix(".git") not in PUBLIC_SLUGS)
    return matches

base=baseline_ref()
if os.environ.get("GITHUB_ACTIONS","").lower()=="true" and not base:
    print("Private Implementation Reference Gate: FAIL")
    print(" - immutable comparison baseline could not be resolved")
    sys.exit(1)

base_files=baseline_files(base) if base else set()
errors=[]

for p in ROOT.rglob("*"):
    if any(part in SKIP for part in p.parts):
        continue
    if p.is_symlink():
        errors.append("Symbolic-link path: symbolic links are not publishable")
        continue
    if not p.is_file():continue
    rel=p.relative_to(ROOT).as_posix()
    # Public pathnames are exposed independently of the file body or format.
    path_current=path_reference_counts(rel)
    path_prior=path_reference_counts(rel) if rel in base_files else Counter()
    for identifier,count in (path_current).items():
        for _ in range(count):
            errors.append(f"{rel}: new private/internal implementation reference in published path: {identifier}")
    if p.suffix.lower() in PDF_SUFFIXES and rel in base_files:
        try:
            current_blob=subprocess.check_output(["git","hash-object",str(p)],cwd=ROOT,text=True).strip()
            baseline_blob=subprocess.check_output(["git","rev-parse",f"{base}:{rel}"],cwd=ROOT,text=True).strip()
            if current_blob!=baseline_blob:
                errors.append(f"{rel}: baseline PDF changed; PDF references are immutable in Increment 2")
        except Exception as exc:
            errors.append(f"{rel}: unable to verify baseline PDF immutability: {exc}")
        continue

    current_text=read_text_file(p)
    if current_text is None:
        continue

    if rel=="scripts/audit_private_references.py":
        continue

    current=reference_counts(current_text)
    if not current:
        continue

    prior=Counter()
    if base and rel in base_files:
        old=read_baseline(base,rel)
        if old is not None:
            prior=reference_counts(old)

    extra=current
    for identifier,count in extra.items():
        for _ in range(count):
            errors.append(
                f"{rel}: new private/internal implementation reference: {identifier}"
            )

if errors:
    print("Private Implementation Reference Gate: FAIL")
    for e in sorted(errors):
        print(f" - {e}")
    sys.exit(1)

print("Private Implementation Reference Gate: PASS")

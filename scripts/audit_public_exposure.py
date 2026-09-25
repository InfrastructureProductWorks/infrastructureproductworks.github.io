#!/usr/bin/env python3
"""Fail closed on new reconstruction-enabling public artifacts without stripping content."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote
import html, os, re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
SKIP={".git","node_modules"}
PUBLISHED_TEXT_EXT={".html",".htm",".js",".mjs",".cjs",".json",".svg",".css",".xml",".txt",".md",".webmanifest",".yaml",".yml"}
FORBIDDEN_NAMES={"openapi.json","openapi.yaml","openapi.yml","swagger.json","swagger.yaml","swagger.yml",
 ".env",".env.local",".env.production","terraform.tfstate","terraform.tfstate.backup"}
FORBIDDEN_SUFFIXES=(".map",".tfstate",".tfstate.backup")
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

JS_HEX=re.compile(r"\\x([0-9a-fA-F]{2})")
JS_UNICODE=re.compile(r"\\u([0-9a-fA-F]{4})")
def normalize_published_text(body, suffix):
    # Normalize browser-resolved encodings to a fixed point so composed escaping
    # (e.g. JS escape -> percent escape -> repository name) cannot bypass matching.
    current=body
    for _ in range(6):
        prior=current
        if suffix in {".html",".htm",".svg",".xml"}:
            current=html.unescape(current)
        current=unquote(current)
        current=JS_HEX.sub(lambda m: chr(int(m.group(1),16)),current)
        current=JS_UNICODE.sub(lambda m: chr(int(m.group(1),16)),current)
        if current==prior:
            break
    return current

OPENAPI_MARKERS=[
    re.compile(r'(?im)^\s*openapi\s*[:=]\s*["\']?3(?:\.\d+){1,2}'),
    re.compile(r'(?im)^\s*swagger\s*[:=]\s*["\']?2\.0'),
]
def looks_textual(raw):
    if not raw: return True
    sample=raw[:65536]
    if b"\x00" in sample: return False
    try:
        sample.decode("utf-8")
        return True
    except UnicodeDecodeError:
        return False

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
if os.environ.get("GITHUB_ACTIONS","").lower()=="true" and not base_ref:
    errors.append("unable to resolve immutable comparison baseline in CI")
for p in ROOT.rglob("*"):
    if not p.is_file() or any(part in SKIP for part in p.parts): continue
    rel=p.relative_to(ROOT).as_posix(); low=p.name.lower()
    if low in FORBIDDEN_NAMES or low in {".env",".envrc"} or low.startswith(".env.") or low in KEY_NAMES or any(low.endswith(sfx) for sfx in FORBIDDEN_SUFFIXES):
        errors.append(f"{rel}: forbidden implementation/credential artifact")
    if p.suffix.lower() in KEY_SUFFIXES:
        errors.append(f"{rel}: credential-bearing file type is not publishable")
    if p.suffix.lower() in {".html",".htm"}: pages.append(rel)

    # Secret signatures are byte-scanned regardless of extension or file size.
    overlap=b""
    first_sample=b""
    with p.open("rb") as fh:
        while True:
            chunk=fh.read(1024*1024)
            if not chunk: break
            if not first_sample: first_sample=chunk[:65536]
            scan=overlap+chunk
            for label,rx in SECRET_PATTERNS:
                if rx.search(scan):
                    errors.append(f"{rel}: possible {label}")
            overlap=scan[-512:]

    textual=(p.suffix.lower() in PUBLISHED_TEXT_EXT) or looks_textual(first_sample)
    if textual:
        text=normalize_published_text(p.read_text("utf-8",errors="ignore"),p.suffix.lower())
        if any(rx.search(text) for rx in OPENAPI_MARKERS):
            errors.append(f"{rel}: machine-readable OpenAPI/Swagger specification exposed")
        # Preserve exact baseline contexts, not just identifier counts. Moving an existing
        # name into a new URL/path is therefore a new exposure.
        def contexts(body):
            out=[]
            for m in PRIVATE_REF.finditer(body):
                left=max(0,m.start()-120); right=min(len(body),m.end()+120)
                ctx=re.sub(r"\s+"," ",body[left:right]).strip().lower()
                out.append((m.group(0).lower(),ctx))
            return out
        current=contexts(text)
        if current:
            prior=[]
            if base_ref and rel in base_files:
                try:
                    old=subprocess.check_output(["git","show",f"{base_ref}:{rel}"],cwd=ROOT,text=True,errors="ignore")
                    prior=contexts(normalize_published_text(old,p.suffix.lower()))
                except Exception: pass
            remaining=list(prior)
            for leak,ctx in current:
                item=(leak,ctx)
                if item in remaining:
                    remaining.remove(item)
                else:
                    errors.append(f"{rel}: private implementation repository reference appears in new context: {leak}")

# Preserve every HTML surface that existed at the immutable baseline, not a hand-written subset.
baseline_html={rel for rel in base_files if rel.lower().endswith((".html",".htm"))} if base_ref else set()
current_html=set(pages)
for rel in sorted(baseline_html-current_html):
    errors.append(f"{rel}: established public HTML surface removed")

SPACE=re.compile(r"\s+")
class VisibleTextParser(HTMLParser):
    NON_RENDERED={"script","style","template","head","noscript"}
    VOID={"area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"}
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.hidden_depth=0
        self.stack=[]
        self.parts=[]
    def _hidden_here(self,tag,attrs):
        attrs=dict(attrs)
        style=re.sub(r"\s+","",attrs.get("style","")).lower()
        return (self.hidden_depth>0 or tag.lower() in self.NON_RENDERED or "hidden" in attrs or
                attrs.get("aria-hidden","").lower()=="true" or "display:none" in style or
                "visibility:hidden" in style)
    def handle_starttag(self,tag,attrs):
        hidden=self._hidden_here(tag,attrs)
        if tag.lower() not in self.VOID:
            self.stack.append(hidden)
            if hidden: self.hidden_depth+=1
    def handle_startendtag(self,tag,attrs):
        pass
    def handle_endtag(self,tag):
        if self.stack:
            hidden=self.stack.pop()
            if hidden: self.hidden_depth=max(0,self.hidden_depth-1)
    def handle_data(self,data):
        if self.hidden_depth==0:
            self.parts.append(data)
def visible_len(text):
    parser=VisibleTextParser()
    try: parser.feed(text)
    except Exception: return 0
    return len(SPACE.sub(" "," ".join(parser.parts)).strip())

if base_ref:
    for rel in sorted(baseline_html & current_html):
        try:
            old=subprocess.check_output(["git","show",f"{base_ref}:{rel}"],cwd=ROOT,text=True,errors="ignore")
            old_len=visible_len(old); new_len=visible_len((ROOT/rel).read_text("utf-8",errors="ignore"))
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

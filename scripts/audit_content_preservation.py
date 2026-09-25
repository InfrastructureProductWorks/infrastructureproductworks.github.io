#!/usr/bin/env python3
"""Preserve established public content, diagrams, and demo boundaries without freezing normal edits."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import html, os, re, subprocess, sys
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parents[1]
SKIP={".git","node_modules"}
SPACE=re.compile(r"\s+")
WORD=re.compile(r"[A-Za-z0-9][A-Za-z0-9'’-]*")
STYLE_BLOCK=re.compile(r"(?is)<style\b[^>]*>(.*?)</style>")
GLOBAL_HIDE=re.compile(
    r"(?is)(?:^|[},\s])(?:html|body|main|body\s*>\s*main|#content|\.site|\.page)\s*\{[^}]*?"
    r"(?:display\s*:\s*none\b|visibility\s*:\s*hidden\b|opacity\s*:\s*0(?:\D|$))"
)

class ReferenceParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.media=set()
        self.stylesheets=set()
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag.lower() in {"img","source","video","audio","iframe","object"}:
            value=attrs.get("src") or attrs.get("poster") or attrs.get("data")
            if value: self.media.add(value)
        if tag.lower()=="link":
            rel=attrs.get("rel","").lower().split()
            href=attrs.get("href")
            if "stylesheet" in rel and href:
                self.stylesheets.add(href)

class VisibleParser(HTMLParser):
    NON_RENDERED={"script","style","template","head","noscript"}
    VOID={"area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"}
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.hidden_depth=0
        self.stack=[]
        self.parts=[]
    def _hidden(self,tag,attrs):
        attrs=dict(attrs)
        style=re.sub(r"\s+","",attrs.get("style","")).lower()
        return (
            self.hidden_depth>0 or tag.lower() in self.NON_RENDERED or
            "hidden" in attrs or attrs.get("aria-hidden","").lower()=="true" or
            "display:none" in style or "visibility:hidden" in style or
            re.search(r"(?:^|;)opacity:0(?:;|$)",style) is not None
        )
    def handle_starttag(self,tag,attrs):
        hidden=self._hidden(tag,attrs)
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

def baseline_ref():
    candidate=os.environ.get("PRESERVATION_BASE_SHA","").strip()
    if candidate and subprocess.run(
        ["git","cat-file","-e",candidate+"^{commit}"],cwd=ROOT,
        stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL
    ).returncode==0:
        return candidate
    return None

def files_at(ref):
    try:
        out=subprocess.check_output(["git","ls-tree","-r","--name-only",ref],cwd=ROOT,text=True)
        return set(out.splitlines())
    except Exception:
        return set()

def show(ref,rel):
    try:
        return subprocess.check_output(["git","show",f"{ref}:{rel}"],cwd=ROOT,text=True,errors="strict")
    except Exception:
        return None

def visible_text(body):
    parser=VisibleParser()
    try: parser.feed(body)
    except Exception: return ""
    return SPACE.sub(" "," ".join(parser.parts)).strip()

def word_counts(text):
    return Counter(w.lower() for w in WORD.findall(text))

def parsed_refs(body):
    parser=ReferenceParser()
    try: parser.feed(body)
    except Exception: return set(),set()
    def clean(values):
        refs=set()
        for value in values:
            value=html.unescape(value).strip()
            parsed=urlparse(value)
            if parsed.scheme or value.startswith("//") or value.startswith("data:"):
                continue
            value=value.split("#",1)[0].split("?",1)[0]
            if value: refs.add(value)
        return refs
    return clean(parser.media),clean(parser.stylesheets)

def media_refs(body):
    return parsed_refs(body)[0]

def css_bodies_for_html(rel,body,ref=None):
    css=[]
    css.extend(STYLE_BLOCK.findall(body))
    base=(ROOT/rel).parent
    for href in parsed_refs(body)[1]:
        parsed=urlparse(href)
        if parsed.scheme or href.startswith("//"):
            continue
        clean=href.split("#",1)[0].split("?",1)[0]
        if not clean: continue
        path=(Path(clean.lstrip("/")) if clean.startswith("/") else (base/clean).relative_to(ROOT))
        try:
            text=show(ref,path.as_posix()) if ref else (ROOT/path).read_text("utf-8")
            if text is not None: css.append(text)
        except Exception:
            pass
    return css

base=baseline_ref()
if os.environ.get("GITHUB_ACTIONS","").lower()=="true" and not base:
    print("Public Content Preservation Gate: FAIL")
    print(" - immutable comparison baseline could not be resolved")
    sys.exit(1)

base_files=files_at(base) if base else set()
base_html={p for p in base_files if p.lower().endswith((".html",".htm"))}
current_html={p.relative_to(ROOT).as_posix() for p in ROOT.rglob("*") if p.is_file() and p.suffix.lower() in {".html",".htm"}}
errors=[]

for rel in sorted(base_html-current_html):
    errors.append(f"{rel}: established public page removed")

for rel in sorted(base_html & current_html):
    old=show(base,rel)
    if old is None:
        errors.append(f"{rel}: baseline page unreadable")
        continue
    new=(ROOT/rel).read_text("utf-8",errors="strict")

    old_text=visible_text(old)
    new_text=visible_text(new)
    if len(old_text)>=200 and len(new_text)<int(len(old_text)*0.80):
        errors.append(f"{rel}: visible text reduced below 80% preservation floor")

    old_words=word_counts(old_text)
    new_words=word_counts(new_text)
    retained=sum(min(count,new_words[word]) for word,count in old_words.items())
    total=sum(old_words.values())
    if total>=50 and retained/total<0.75:
        errors.append(f"{rel}: less than 75% of baseline visible-word content retained")

    old_media=media_refs(old)
    new_media=media_refs(new)
    removed=old_media-new_media
    for ref in sorted(removed):
        errors.append(f"{rel}: baseline media/diagram reference removed: {ref}")

    old_css="\n".join(css_bodies_for_html(rel,old,base))
    new_css="\n".join(css_bodies_for_html(rel,new,None))
    if not GLOBAL_HIDE.search(old_css) and GLOBAL_HIDE.search(new_css):
        errors.append(f"{rel}: new global stylesheet rule hides the public page")

# Demo identity/boundary markers are deliberately explicit and small.
DEMO_MARKERS={
    "console/demo/index.html":("synthetic",),
    "assets/console-demo.js":("awaiting_human_review",),
    "assurance/demo/index.html":("synthetic",),
    "assurance/portal/index.html":("sanitized","synthetic"),
}
for rel,markers in DEMO_MARKERS.items():
    p=ROOT/rel
    if not p.exists():
        errors.append(f"{rel}: required public demo boundary surface missing")
        continue
    body=p.read_text("utf-8",errors="ignore").lower()
    for marker in markers:
        if marker not in body:
            errors.append(f"{rel}: required demo-boundary marker missing: {marker}")

if errors:
    print("Public Content Preservation Gate: FAIL")
    for e in sorted(set(errors)):
        print(f" - {e}")
    sys.exit(1)

print("Public Content Preservation Gate: PASS")

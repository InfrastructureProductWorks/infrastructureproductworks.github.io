#!/usr/bin/env python3
"""Block new browser-facing exposure of private/internal implementation repositories."""
from collections import Counter
from pathlib import Path
from urllib.parse import unquote
import html, os, re, subprocess, sys, unicodedata
from html.parser import HTMLParser

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
PUBLIC_REPOSITORIES={'infrastructureproductworks/ai-powered-infrastructure-as-a-product', 'infrastructureproductworks/iaap-guard', 'infrastructureproductworks/infrastructureproductworks.github.io'}
OWNED_COORDINATE=re.compile('(InfrastructureProductWorks|SAABOLImpactVenture)/([A-Za-z0-9_.-]+(?:/[A-Za-z0-9_.-]+)*)',re.I)
GITHUB_COORDINATE=re.compile(r'(?<![A-Za-z0-9_.-])(?:(?:www\.)?github\.dev\.?(?::[0-9]*)?/|vscode\.dev\.?(?::[0-9]*)?/github/|api\.github\.com\.?(?::[0-9]*)?/repos/|(?!docs\.github\.com)(?:[A-Za-z0-9-]+\.)*github\.com\.?(?::[0-9]*)?/|raw\.githubusercontent\.com\.?(?::[0-9]*)?/|(?:[A-Za-z0-9_.-]+@)?(?:ssh\.)?github\.com\.?(?::[0-9]*)?[:/])([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+(?:/[A-Za-z0-9_.-]+)*)',re.I)
PUBLIC_UI_COORDINATES={'apps/iaap-guard'}
DEFAULT_IGNORABLE = re.compile(
    r'[\u00ad\u034f\u061c\u115f-\u1160\u17b4-\u17b5\u180b-\u180f'
    r'\u200b-\u200f\u202a-\u202e\u2060-\u206f\u3164\ufe00-\ufe0f'
    r'\ufeff\uffa0\ufff0-\ufff8\U0001bca0-\U0001bca3\U0001d173-\U0001d17a'
    r'\U000e0000-\U000e0fff]')
# Existing browser-source links are exact exceptions, never feed-text routes.
PUBLIC_SOURCE_WEB_PATHS={
    'infrastructureproductworks/ai-powered-infrastructure-as-a-product/blob/main/docs/infrastructure-product-lifecycle.md',
    *('infrastructureproductworks/iaap-guard/blob/main/docs/'+name for name in (
        'adoption-prerequisites.md','github-app-beta.md','known-limits.md','multi-repository-products.md','product.md')),
    'infrastructureproductworks/iaap-guard/security/advisories/new',
    'infrastructureproductworks/iaap-guard/tree/main/schemas',
}
PUBLIC_SOURCE_RAW_PATHS={
    'infrastructureproductworks/infrastructureproductworks.github.io/telemetry/portfolio-live/data/'+name
    for name in ('portfolio-bundle.json','portfolio-dashboard-live.json')
}

def coordinate_matches(text):
    hosted=list(GITHUB_COORDINATE.finditer(text))
    yield from hosted
    for match in OWNED_COORDINATE.finditer(text):
        if not any(host.start()<=match.start()<host.end() for host in hosted):yield match

def coordinate_key(match):
    return (match.group(1)+'/'+match.group(2).split('/')[0]).lower().removesuffix('.git')

def coordinate_allowed(match, approved):
    path=match.group(1)+'/'+match.group(2)
    if any(part in {'.','..'} for part in path.split('/')):
        return False
    key=coordinate_key(match)
    if key in approved:
        suffix=path.lower().split('/')[2:]
        raw=bool(re.match(r'raw\.githubusercontent\.com[.:/]',match.group(0),re.I))
        web=match.group(0).lower().startswith('github.com/')
        raw_exact=match.group(0).lower().startswith('raw.githubusercontent.com/')
        if raw:
            valid=not suffix or len(suffix)==2 and suffix[0]=='main' and re.fullmatch(r'[a-z0-9_-][a-z0-9_.-]*',suffix[1]) or raw_exact and path.lower() in PUBLIC_SOURCE_RAW_PATHS
        else:
            valid=not suffix or len(suffix)==2 and suffix[0] in {'issues','pull'} and re.fullmatch(r'[0-9]+',suffix[1]) or len(suffix)==3 and suffix[:2]==['blob','main'] and re.fullmatch(r'[a-z0-9_-][a-z0-9_.-]*',suffix[2]) or web and path.lower() in PUBLIC_SOURCE_WEB_PATHS
        return bool(valid and source_coordinate_terminated(match))
    if not (match.group(0).lower().startswith(('github.com/','www.github.com/'))
            and path.lower() in PUBLIC_UI_COORDINATES):return False
    return source_coordinate_terminated(match)

def source_coordinate_terminated(match):
    tail=match.string[match.end():]
    if not tail or tail[0].isspace():return True
    before=match.string[:match.start()]
    # A delimiter is valid only when it closes an actual source construct.
    if tail.startswith(')') and re.search(r'\]\((?:https?:/)?$',before,re.I):return True
    if tail.startswith('>') and re.search(r'<(?:https?:/)?$',before,re.I):return True
    quoted=re.search(r"([\"'])(?:https?:/|/)?$",before,re.I)
    return bool(quoted and tail.startswith(quoted.group(1)))


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


def normalize_hostnames(text):
    controls=str.maketrans({'\t':None,'\n':None,'\r':None})
    text=re.sub(r'(?is)(\b(?:href|src|action)\s*=\s*)(["\'])(.*?)\2',lambda m:m.group(1)+m.group(2)+m.group(3).translate(controls)+m.group(2),text)
    text=re.sub(r'\]\(([^)]+)\)',lambda m:']('+m.group(1).translate(controls)+')',text)
    text=text.translate(str.maketrans({'。':'.','．':'.','｡':'.'}))
    def host(match):
        try:normalized=match.group(2).translate(controls).encode('idna').decode('ascii')
        except UnicodeError:return match.group(0)
        return match.group(1)+normalized
    return re.sub(r"((?:[A-Za-z][A-Za-z0-9+.-]*:/+|git@))([^/ :?#\"'()<>\[\]]+)",host,text)

def normalize_browser_text(body, token_scope=False):
    current=body
    for normalization_step in range(9):
        prior=current
        # Preserve numeric entities that HTML would erase before token checks.
        if token_scope:
            erased_entity=False
            def preserve_entity(match):
                nonlocal erased_entity
                digits=match.group(1)
                code=int(digits[1:],16) if digits.lower().startswith('x') else int(digits)
                if not html.unescape(match.group(0)):erased_entity=True
                if code<32 or 127<=code<=159 or not html.unescape(match.group(0)):
                    return chr(code)
                return match.group(0)
            current=re.sub(r'&#(x[0-9a-f]+|[0-9]+);?',preserve_entity,current,flags=re.I)
            if erased_entity and any(coordinate_matches(normalize_browser_text(prior))):
                raise ValueError('Erased entities cannot alter a public coordinate')
        current=html.unescape(current)
        current=unquote(current)
        current=JS_HEX.sub(lambda m: chr(int(m.group(1),16)),current)
        current=JS_UNICODE.sub(lambda m: chr(int(m.group(1),16)),current)
        current=re.sub(r'[\ud800-\udbff][\udc00-\udfff]',lambda m:chr(0x10000+((ord(m.group(0)[0])-0xd800)<<10)+ord(m.group(0)[1])-0xdc00),current)
        current=JS_CONCAT.sub(lambda m: m.group(1)+m.group(2)+m.group(4)+m.group(1),current)
        current=re.sub(r"\\(?!u[0-9a-f]{4}|x[0-9a-f]{2})", "/", current, flags=re.I)
        if token_scope and re.search(r'[\x00-\x1f\x7f-\x9f]',current) and any(coordinate_matches(re.sub(r'[\x00-\x1f\x7f-\x9f]','',current))):
            raise ValueError('Control characters cannot alter a public coordinate')
        if token_scope and any(match.end()<len(current) and current[match.end()].isspace() for match in coordinate_matches(current)):
            raise ValueError('Noncanonical URL token suffix')
        current=re.sub(r"[\x00-\x1f\x7f]", "", current)
        current=re.sub(r"/+", "/", current)
        current=normalize_hostnames(current)
        if current==prior:
            break
        if normalization_step==8:raise ValueError("Publication text exceeds the bounded normalization limit")
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
    if raw.startswith((b'\xff\xfe\x00\x00',b'\x00\x00\xfe\xff')):return raw.decode('utf-32')
    if raw.startswith((b'\xff\xfe',b'\xfe\xff')):return raw.decode('utf-16')
    if b'\x00' in raw:
        if path.suffix.lower() not in {'.png','.jpg','.jpeg','.webp','.gif','.ico','.pdf'}:
            raise ValueError('NUL-bearing text without a supported BOM is not publishable')
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
    matches=Counter(m.group(0).lower() for m in PRIVATE_PATH_REF.finditer(normalized))
    matches.update(reference_counts(normalized))
    return matches

MARKDOWN_ESCAPE=re.compile(r'\\([!-/:-@\[-`{-~])')

def rendered_reference_text(value, labels_only=False):
    # Scan visible source text as well as original URLs: inline tags, comments,
    # Markdown emphasis and invisible formatting cannot split a coordinate.
    class VisibleText(HTMLParser):
        def __init__(self):
            super().__init__(convert_charrefs=False)
            self.parts=[]
        def handle_data(self,data):self.parts.append(data)
        def handle_entityref(self,name):self.parts.append('&'+name+';')
        def handle_charref(self,name):self.parts.append('&#'+name+';')
    parser=VisibleText()
    parser.feed(value)
    parser.close()
    text=''.join(parser.parts)
    for _ in range(9):
        before=text
        text=re.sub(r'\[([^\[\]]*)\]\(([^)]*)\)',lambda m:m.group(1) if labels_only else ' '+m.group(2)+' ',text)
        if labels_only:
            text=re.sub(r'\[([^\[\]]*)\]\[[^\[\]]*\]',lambda m:m.group(1),text)
        if text==before:break
    if labels_only:text=text.replace('[','').replace(']','')
    text=re.sub(r'(?<![A-Za-z0-9_])(__?)(?=\S)(.+?)(?<=\S)\1(?![A-Za-z0-9_])',lambda m:m.group(2),text)
    text=re.sub(r'[*~`]', '', text)
    text=DEFAULT_IGNORABLE.sub('',text)
    return ''.join(char for char in text if unicodedata.category(char)!='Cf')


def reference_counts(body):
    matches=Counter()
    for view in (body,MARKDOWN_ESCAPE.sub(lambda m:m.group(1),body)):
        # Preserve source lexical boundaries before decoding: a percent-encoded
        # quote or parenthesis belongs to the URL and cannot become a free closer.
        tokens=re.findall(r"[^\s\"'<>()[\]]+",view)
        tokens.extend(m.group(2).strip() for m in re.finditer(r"(?is)\b(?:href|src|action)\s*=\s*([\"'])(.*?)\1",view))
        for token in tokens:
            try:normalized_token=normalize_browser_text(token,token_scope=True)
            except ValueError:
                matches.update(['noncanonical URL token suffix'])
                continue
            for match in coordinate_matches(normalized_token):
                if match.end()!=len(normalized_token):
                    matches.update([match.group(0).lower()+': noncanonical URL suffix'])
        normalized=normalize_browser_text(view)
        matches.update(m.group(0).lower() for m in PRIVATE_REF.finditer(normalized))
        matches.update(m.group(0).lower() for m in coordinate_matches(normalized) if not coordinate_allowed(m, PUBLIC_REPOSITORIES))
        for labels_only in (False,True):
            rendered=rendered_reference_text(normalized,labels_only=labels_only)
            matches.update(m.group(0).lower() for m in PRIVATE_REF.finditer(rendered))
            matches.update(m.group(0).lower() for m in coordinate_matches(rendered) if not coordinate_allowed(m,PUBLIC_REPOSITORIES))
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
    if p.name=='.gitmodules':
        errors.append('Submodule coordinates are not publishable')
        continue
    if p.read_bytes().startswith(b'version https://' + b'git-lfs.github.com' + b'/spec/v1'):
        errors.append('Opaque Git LFS pointer is not publishable')
        continue
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

    try:
        current_text=read_text_file(p)
    except (ValueError, UnicodeError) as exc:
        errors.append(f"{rel}: {exc}")
        continue
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

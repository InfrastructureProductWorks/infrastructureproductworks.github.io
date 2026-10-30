#!/usr/bin/env python3
"""Block new browser-facing exposure of private/internal implementation repositories."""
from collections import Counter
from pathlib import Path
from urllib.parse import unquote
import hashlib, html, os, re, subprocess, sys, unicodedata
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
PRIVATE_REF=re.compile("|".join(re.escape(name) for name in PRIVATE_NAMES),re.I)

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

PRIVATE_PATH_REF=PRIVATE_REF

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
    for _ in range(9):
        before=text
        text=re.sub(r'(?<![A-Za-z0-9_])(__?)(?=\S)(.+?)(?<=\S)\1(?![A-Za-z0-9_])',lambda m:m.group(2),text)
        if text==before:break
    else:
        raise ValueError('Unstable nested Markdown emphasis')
    text=re.sub(r'[*~`]', '', text)
    text=DEFAULT_IGNORABLE.sub('',text)
    return ''.join(char for char in text if unicodedata.category(char)!='Cf')


# Existing public protocol/download names are not repository coordinates.
# Match complete values only in their actual public syntax, never arbitrary prose.
PUBLIC_SCHEMA_VALUES=tuple(''.join(parts) for parts in (
    ('iaap-','assurance-browser-record/v1'), ('iaap-','assurance-portal-fixture/v1'),
    ('iaap-','assurance-portal-package/v1'), ('iaap-','assurance-record-catalog/v1'),
    ('iaap-','console-demo-package/v2'),
))
PUBLIC_DOWNLOAD_VALUES=tuple(''.join(parts) for parts in (
    ('iaap-','assurance-request-set.json'), ('iaap-','assurance-synthetic-decision-record.json'),
    ('iaap-','assurance-verified-request-set.json'), ('iaap-','console-order-482-synthetic-review.json'),
))
PUBLIC_DOWNLOAD_TEMPLATE=''.join(('iaap-','console-${activeOrder.id.toLowerCase()}-synthetic-review.json'))
PUBLIC_PREVIEW_URL='https://'+''.join(('iaap-','forge-preview.onrender.com/'))

# Reviewed immutable source bytes; never regenerate these pins as a gate repair.
# Any change requires explicit review of the full source and exact public spans.
REVIEWED_PUBLIC_CONTRACT_SOURCES={'assets/assurance-demo.js': '220862a6ea2117b86d0941ec9200f3e4d1c6e608c2152b3f19bb1d7e3b61d3fe',
 'assets/assurance-leadership.js': 'df0e1b14899652ef73a897544b786cf160bc284af3bfe111eb7d70a7ae5cd948',
 'assets/assurance-portal.js': 'd8d85684ef194571b3b5fece1e6e70667c6c417e222aba0ce9d6c0efd54e4235',
 'assets/assurance-record-view.js': '64a6e31f678ca840583c91e35ab9c6171b944e2719d012963b4b00f3acdc99b3',
 'assets/assurance-records.json': '326a9310fee5872132deb0cd1e8a43e324fb3123e9762faf02b420f0b1603ff1',
 'assets/console-demo.js': '91a0a4f1d54fd220a0f9c32be06c7cc2031dc3c616e48a83818ca0b01e56b636',
 'docs/assurance-record-projection.md': '4c558e8e2428ca8176c9924476042ec99a52c5f7f88453ccce925b0f6d699b80',
 'forge/index.html': 'b9920d73b4f75e30bf7d3a1e6abc6dffb3ddbda30dcff368a732c34a9c470eb5',
 'guides/assurance/index.html': 'e10280d15e14df1401f3149ec4d62ee9bd2cdbbc010d03211bee87dd9ce91728',
 'guides/console/index.html': '015f6fa67c0b8b83f71ca20480dfc7d7692bce7da5181e8d9ac878c5ebdf8de6',
 'guides/content/assurance.md': '91a04f01170d3e7e8cd2fe1b7a7a6c0a37af13876302f79f3d769180c69d6ac8',
 'guides/content/console.md': 'd2303ed58fe03ec3e85caf2ccddb703d8bed59f9c1355c2e71139fd22ba684a0',
 'guides/content/forge.md': 'd008beb179526c02053fcf9c7f5e3ce4c461a5d502fca3c8052708f6c471b47b',
 'guides/forge/index.html': '954c2e5bc54c27e5aeb96481bd83c1167c851322a1b6d7d6ff6b39ec7f002185',
 'guides/index.html': '0f22463527d31c74110d46836a166e27de98f93d8775e3e40cb73d005d883cd1',
 'index.html': '1712d0d3c72d3e5d74eae26cf6a37546a9fd858efbc94fd9c9edaf1e3ae67072',
 'scripts/audit_public_projections.py': '48074bf8eacc7dee551c4b183c941b5c351b7f95a797e7dc7b0b61f12fa694e7',
 'scripts/build_assurance_records.cjs': '4fbc46b0778cf60db1e55981e3c8b4c19d061e9ada9aeb3edf1ebb5f668f6551',
 'scripts/build_guides.py': '23b04383db47e411ff3bed95e70fcdb8c57997366a218dcba33806aeba3b0a05'}

def public_name_scan_text(text):
    spans=[]
    tags=[match.span() for match in re.finditer(r"""<[A-Za-z/!](?:[^<>"']|"[^"]*"|'[^']*')*>""",text)]
    def collect(pattern, visible=False, attribute=False):
        for match in re.finditer(pattern,text,re.M):
            start,end=match.span('public')
            prefix=normalize_browser_text(text[:match.start()])
            if re.search(r'[+/]\s*$',prefix):continue
            # A protocol-looking string inside another URL or HTML attribute
            # is not the public schema/download contract.
            if not attribute and any(a<=start<b for a,b in tags):continue
            token_prefix=re.split(r'\s',text[:start])[-1]
            if not attribute and re.search(r'[A-Za-z][A-Za-z0-9+.-]*:/',token_prefix):continue
            if visible:
                # Preserve whitespace while checking browser-visible neighbors.
                def edge(value):
                    value=normalize_browser_text(value.replace('\n',' ').replace('\r',' ').replace('\t',' '))
                    return rendered_reference_text(value,labels_only=True)
                before=edge(text[:match.start()]);after=edge(text[match.end():])
                if re.search(r'''[+=({/\"']\s*$''',before):continue
                if re.match(r'''\s*(?:[+\[\"']|/\*|/|\.[A-Za-z_$])''',after):continue
                if before and re.search(r'[A-Za-z0-9_.+={(/-]$',before):continue
                if re.match(r'(?:[A-Za-z0-9_+\[(/-]|\.[A-Za-z0-9_.-])',after):continue
            spans.append((start,end))
    schemas='(?:'+'|'.join(map(re.escape,PUBLIC_SCHEMA_VALUES))+')'
    downloads='(?:'+'|'.join(map(re.escape,PUBLIC_DOWNLOAD_VALUES))+')'
    end_value=r'(?=\s*(?:[,;)}?:]|&&|\Z))'
    # Property values must occur in an object, not schema-shaped arbitrary prose.
    collect(r"""[{,]\s*(?:schemaVersion|["']schemaVersion["'])[ \t]*:[ \t]*(?P<quote>["'])(?P<public>"""+schemas+r""")(?P=quote)"""+end_value)
    # Existing consumers compare schemas in JS expressions or Python if tests.
    collect(r"""(?:\bconst[ \t]+records[ \t]*=[ \t]*data\?\.schemaVersion|^[ \t]*data\?\.schemaVersion|^[ \t]*if[ \t]+(?:record|assurance)\.get\(["']schemaVersion["']\))[ \t]*(?:===|!=)[ \t]*(?P<quote>["'])(?P<public>"""+schemas+r""")(?P=quote)"""+end_value)
    collect(r"""\blink\.download[ \t]*=[ \t]*(?P<quote>["'])(?P<public>"""+downloads+r""")(?P=quote)(?=\s*(?:;|\Z))""")
    collect(r'\blink\.download[ \t]*=[ \t]*`(?P<public>'+re.escape(PUBLIC_DOWNLOAD_TEMPLATE)+r')`(?=\s*(?:;|\Z))')
    for allowed in (schemas,downloads):
        collect(r'`(?P<public>'+allowed+r')`',visible=True)
        collect(r'<code>(?P<public>'+allowed+r')</code>',visible=True)
    preview=re.escape(PUBLIC_PREVIEW_URL)
    collect(r"""\bhref=(?P<quote>["'])(?P<public>"""+preview+r""")(?P=quote)(?=[ \t]*(?:[A-Za-z-]+[ \t]*=|/?>))""",attribute=True)
    collect(r"""(?P<quote>["'])(?P<public>"""+preview+r""")(?P=quote)(?=\s*(?:[,;)}]|\Z))""",attribute=True)
    collect(r'\]\((?P<public>'+preview+r')\)',attribute=True)
    chars=list(text)
    for start,end in spans:chars[start:end]=' '*(end-start)
    return ''.join(chars)


def reference_counts(body, source_path=None, source_bytes=None):
    approved=REVIEWED_PUBLIC_CONTRACT_SOURCES.get(source_path)
    allow_contracts=bool(approved and source_bytes is not None
        and hashlib.sha256(source_bytes).hexdigest()==approved
        and source_bytes.decode('utf-8',errors='strict')==body)
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
        name_normalized=normalize_browser_text(public_name_scan_text(view) if allow_contracts else view)
        matches.update(m.group(0).lower() for m in PRIVATE_REF.finditer(name_normalized))
        matches.update(m.group(0).lower() for m in coordinate_matches(normalized) if not coordinate_allowed(m, PUBLIC_REPOSITORIES))
        for labels_only in (False,True):
            rendered=rendered_reference_text(normalized,labels_only=labels_only)
            name_rendered=rendered_reference_text(name_normalized,labels_only=labels_only)
            matches.update(m.group(0).lower() for m in PRIVATE_REF.finditer(name_rendered))
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

    current=reference_counts(current_text,source_path=rel,source_bytes=p.read_bytes())
    if not current:
        continue

    prior=Counter()
    if base and rel in base_files:
        old=read_baseline(base,rel)
        if old is not None:
            prior=reference_counts(old,source_path=rel,source_bytes=old.encode("utf-8"))

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

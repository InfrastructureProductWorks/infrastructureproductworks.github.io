#!/usr/bin/env python3
"""Fail closed on credentials and non-site artifacts in the public repository."""
from pathlib import Path
import io, json, os, re, subprocess, sys, zipfile, html
from urllib.parse import unquote

ROOT=Path(__file__).resolve().parents[1]
SKIP={".git"}

# New files are default-denied unless they are ordinary public-site/source-governance
# formats. Existing baseline paths remain permitted so this gate never strips the site.
ALLOWED_NEW_SUFFIXES={
    ".html",".htm",".css",".js",".mjs",".cjs",".json",".svg",
    ".png",".jpg",".jpeg",".webp",".gif",".ico",".webmanifest",
    ".txt",".md",".xml",".yml",".yaml",".py",
}
ALLOWED_NEW_NAMES={"CNAME","LICENSE","LICENSE.md","README","README.md"}
TEXT_SUFFIXES={".html",".htm",".css",".js",".mjs",".cjs",".json",".svg",".webmanifest",".txt",".md",".xml",".yml",".yaml",".py"}
TEXT_NAMES={"CNAME","LICENSE","LICENSE.md","README","README.md"}

FORBIDDEN_NAMES={
    "openapi.json","openapi.yaml","openapi.yml",
    "swagger.json","swagger.yaml","swagger.yml",
    ".env","terraform.tfstate","terraform.tfstate.backup",
}
FORBIDDEN_SUFFIXES=(
    ".map",".tfstate",".tfstate.backup",
    ".zip",".tar",".tgz",".tar.gz",".gz",
    ".bz2",".tar.bz2",".tbz",".tbz2",
    ".xz",".tar.xz",".txz",
    ".zst",".tar.zst",".7z",".rar",
)
KEY_NAMES={"id_rsa","id_dsa","id_ecdsa","id_ed25519"}
KEY_SUFFIXES={".pem",".key",".p12",".pfx",".ppk",".jks",".keystore"}

SECRET_PATTERNS=[
    ("private key",re.compile(rb"-----BEGIN (?:(?:RSA|EC|OPENSSH|DSA) |ENCRYPTED )?PRIVATE KEY-----")),
    ("OpenPGP private key",re.compile(rb"-----BEGIN PGP " + rb"PRIVATE KEY BLOCK-----")),
    ("GitHub token",re.compile(rb"\bgh[pousr]_[A-Za-z0-9_]{30,}\b")),
    ("GitHub fine-grained token",re.compile(rb"\bgithub_pat_[A-Za-z0-9_]{30,}\b")),
    ("OpenAI API key",re.compile(rb"(?<![A-Za-z0-9_-])sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}(?![A-Za-z0-9_-])")),
    ("Google API key",re.compile(rb"(?<![A-Za-z0-9_-])AIza[A-Za-z0-9_-]{35}(?![A-Za-z0-9_-])")),
    ("AWS access key",re.compile(rb"\b(?:AKIA|ASIA)[0-9A-Z]{16}\b")),
    ("PuTTY private key",re.compile(rb"(?im)^PuTTY-User-Key-File-[0-9]+:")),
    ("inline source map",re.compile(rb"sourceMappingURL\s*=\s*data:application/json(?:;charset=[^;,\s]+)?(?:;base64)?,",re.I)),
]

JSON_ESCAPE=re.compile(rb'\\(?:u([0-9a-fA-F]{4})|(["\\/bfnrt]))')
ESCAPE_VALUES={b'"':b'"',b"\\":b"\\",b"/":b"/",b"b":b"\b",b"f":b"\f",b"n":b"\n",b"r":b"\r",b"t":b"\t"}

def credential_views(raw):
    """Scan raw and bounded JSON-escaped representations without printing values."""
    yield raw
    current=raw
    for _ in range(8):
        def decode(match):
            if match.group(1):
                return chr(int(match.group(1),16)).encode("utf-8",errors="replace")
            return ESCAPE_VALUES[match.group(2)]
        decoded=JSON_ESCAPE.sub(decode,current)
        if decoded==current:
            return
        yield decoded
        current=decoded

def baseline_paths():
    ref=os.environ.get("EXTRACTION_BASE_SHA","").strip()
    if not ref:
        return set()
    try:
        out=subprocess.check_output(["git","ls-tree","-r","--name-only",ref],cwd=ROOT,text=True)
        return set(out.splitlines())
    except Exception:
        return set()

BASELINE=baseline_paths()
if os.environ.get("GITHUB_ACTIONS","").lower()=="true" and not BASELINE:
    print("Public Credential & Artifact Gate: FAIL")
    print(" - immutable baseline could not be resolved")
    sys.exit(1)

def valid_allowed_binary(suffix, head):
    if suffix==".pdf": return head.startswith(b"%PDF-")
    if suffix==".png": return head.startswith(b"\x89PNG\r\n\x1a\n")
    if suffix in {".jpg",".jpeg"}: return head.startswith(b"\xff\xd8\xff")
    if suffix==".gif": return head.startswith((b"GIF87a",b"GIF89a"))
    if suffix==".webp": return len(head)>=12 and head[:4]==b"RIFF" and head[8:12]==b"WEBP"
    if suffix==".ico": return head.startswith(b"\x00\x00\x01\x00")
    return True

def looks_like_source_map_object(obj):
    if not isinstance(obj,dict) or obj.get("version")!=3:
        return False
    if isinstance(obj.get("sources"),list) and ("mappings" in obj or "sourcesContent" in obj):
        return True
    sections=obj.get("sections")
    if isinstance(sections,list):
        for section in sections:
            if not isinstance(section,dict):
                continue
            offset=section.get("offset")
            if not (isinstance(offset,dict) and isinstance(offset.get("line"),int) and isinstance(offset.get("column"),int)):
                continue
            if isinstance(section.get("url"),str) and section.get("url"):
                return True
            if looks_like_source_map_object(section.get("map")):
                return True
    return False

def looks_like_terraform_state_object(obj):
    if not isinstance(obj,dict):
        return False
    return (
        isinstance(obj.get("terraform_version"),str)
        and isinstance(obj.get("lineage"),str)
        and isinstance(obj.get("resources"),list)
        and ("serial" in obj or "outputs" in obj)
    )

def looks_like_terraform_state_json(raw):
    try:
        obj=json.loads(raw.decode("utf-8"))
    except Exception:
        return False
    return looks_like_terraform_state_object(obj)

def looks_like_source_map_json(raw):
    try:
        obj=json.loads(raw.decode("utf-8"))
    except Exception:
        return False
    return looks_like_source_map_object(obj)

def embedded_container(raw):
    # Treat as an embedded ZIP only if the central directory can actually be
    # opened and enumerated. This catches appended ZIP polyglots without
    # false-positive classification on EOCD-like byte sequences.
    try:
        with zipfile.ZipFile(io.BytesIO(raw)) as zf:
            zf.infolist()
        return True
    except (zipfile.BadZipFile, OSError, ValueError):
        return False

def recognized_container(head):
    return (
        head.startswith((b"PK\x03\x04",b"PK\x05\x06",b"PK\x07\x08")) or
        head.startswith(b"\x1f\x8b") or head.startswith(b"BZh") or
        head.startswith(b"\xfd7zXZ\x00") or head.startswith(b"7z\xbc\xaf\x27\x1c") or
        head.startswith((b"Rar!\x1a\x07\x00",b"Rar!\x1a\x07\x01\x00")) or
        head.startswith(b"\x28\xb5\x2f\xfd") or
        (len(head)>=265 and head[257:262]==b"ustar")
    )

errors=[]
for p in ROOT.rglob("*"):
    if any(part in SKIP for part in p.parts):
        continue
    if p.is_symlink():
        errors.append("Symbolic-link path: symbolic links are not publishable")
        continue
    if not p.is_file():
        continue

    rel=p.relative_to(ROOT).as_posix()
    normalized_path=rel
    for _ in range(8):
        decoded_path=unquote(html.unescape(normalized_path))
        if decoded_path==normalized_path:
            break
        normalized_path=decoded_path
    path_labels={label for view in credential_views(normalized_path.encode("utf-8"))
                 for label,rx in SECRET_PATTERNS if rx.search(view)}
    display_rel="<credential-bearing path>" if path_labels else rel
    for label in path_labels:
        errors.append(f"{display_rel}: possible {label} in published path")
    low=p.name.lower()
    suffix=p.suffix.lower()

    # The key simplification: a newly introduced artifact must look like a site/source
    # file. Unknown binary/package formats do not get published and then analyzed.
    if rel not in BASELINE and suffix not in ALLOWED_NEW_SUFFIXES and p.name not in ALLOWED_NEW_NAMES:
        errors.append(f"{display_rel}: new non-site artifact type is not publishable")

    if (
        low in FORBIDDEN_NAMES or low in {".env",".envrc"} or low.startswith(".env.")
        or low in KEY_NAMES or any(low.endswith(sfx) for sfx in FORBIDDEN_SUFFIXES)
        or suffix in KEY_SUFFIXES
    ):
        errors.append(f"{display_rel}: forbidden credential/implementation artifact")

    first_chunk=b""
    with p.open("rb") as fh:
        first_chunk=fh.read(1024*1024)
        if recognized_container(first_chunk[:1024]):
            errors.append(f"{display_rel}: archive/container content is not publishable regardless of filename")
        if suffix in {".pdf",".png",".jpg",".jpeg",".gif",".webp",".ico"}:
            raw_binary=p.read_bytes()
            if not valid_allowed_binary(suffix,raw_binary[:32]):
                errors.append(f"{display_rel}: invalid or empty binary content for allowed site asset type")
            if embedded_container(raw_binary):
                errors.append(f"{display_rel}: embedded archive/container content is not publishable in a binary site asset")
        is_text_source=(suffix in TEXT_SUFFIXES or p.name in TEXT_NAMES)
        if is_text_source:
            try:
                raw=p.read_bytes()
                if b"\x00" in raw:
                    errors.append(f"{display_rel}: binary content masquerading as an allowed text/source type")
                else:
                    raw.decode("utf-8")
                if looks_like_source_map_json(raw):
                    errors.append(f"{display_rel}: standalone source-map document is not publishable")
                if looks_like_terraform_state_json(raw):
                    errors.append(f"{display_rel}: Terraform state content is not publishable")
            except UnicodeDecodeError:
                errors.append(f"{display_rel}: non-UTF-8 content masquerading as an allowed text/source type")
            except Exception as exc:
                errors.append(f"{display_rel}: unable to validate structured text content: {exc}")
        # Full-file views preserve encoded credential prefixes across arbitrary
        # read boundaries. Text and binary validation already materializes files.
        raw_for_credentials=p.read_bytes()
        for view in credential_views(raw_for_credentials):
            for label,rx in SECRET_PATTERNS:
                if rx.search(view):
                    errors.append(f"{display_rel}: possible {label}")

if errors:
    print("Public Credential & Artifact Gate: FAIL")
    for e in sorted(set(errors)):
        print(f" - {e}")
    sys.exit(1)

print("Public Credential & Artifact Gate: PASS")

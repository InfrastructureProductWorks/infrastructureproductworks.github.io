#!/usr/bin/env python3
"""Fail closed on credential and reconstruction-artifact leakage in the public site."""
from pathlib import Path
import re, sys

ROOT=Path(__file__).resolve().parents[1]
SKIP={".git","node_modules"}

ALLOWED_TEXT_SUFFIXES={".html",".js",".cjs",".css",".json",".md",".py",".yml",".webmanifest",".svg"}
ALLOWED_BINARY_SUFFIXES={".png",".jpg",".jpeg",".webp",".pdf",".ico"}
ALLOWED_EXTENSIONLESS={"CNAME"}

BINARY_MAGIC={
    ".png":lambda b:b.startswith(b"\x89PNG\r\n\x1a\n"),
    ".jpg":lambda b:b.startswith(b"\xff\xd8\xff"),
    ".jpeg":lambda b:b.startswith(b"\xff\xd8\xff"),
    ".webp":lambda b:len(b)>=12 and b.startswith(b"RIFF") and b[8:12]==b"WEBP",
    ".pdf":lambda b:b.startswith(b"%PDF-"),
    ".ico":lambda b:b.startswith(b"\x00\x00\x01\x00"),
}

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
    ".zst",".tar.zst",
    ".7z",".rar"
)
KEY_NAMES={"id_rsa","id_dsa","id_ecdsa","id_ed25519"}
KEY_SUFFIXES={".pem",".key",".p12",".pfx",".ppk",".jks",".keystore"}

SECRET_PATTERNS=[
    ("private key",re.compile(rb"-----BEGIN (?:(?:RSA|EC|OPENSSH|DSA) |ENCRYPTED )?PRIVATE KEY-----")),
    ("OpenPGP private key",re.compile(rb"-----BEGIN PGP " + rb"PRIVATE KEY BLOCK-----")),
    ("GitHub token",re.compile(rb"\bgh[pousr]_[A-Za-z0-9_]{30,}\b")),
    ("GitHub fine-grained token",re.compile(rb"\bgithub_pat_[A-Za-z0-9_]{30,}\b")),
    ("AWS access key",re.compile(rb"\b(?:AKIA|ASIA)[0-9A-Z]{16}\b")),
    ("PuTTY private key",re.compile(rb"(?im)^PuTTY-User-Key-File-[0-9]+:")), 
    ("inline source map",re.compile(rb"sourceMappingURL\s*=\s*data:application/json(?:;charset=[^;,\s]+)?(?:;base64)?,",re.I)),
]

ARCHIVE_MAGIC=[
    ("ZIP",lambda b:b.startswith(b"PK\x03\x04") or b.startswith(b"PK\x05\x06") or b.startswith(b"PK\x07\x08")),
    ("GZIP",lambda b:b.startswith(b"\x1f\x8b")),
    ("BZIP2",lambda b:b.startswith(b"BZh")),
    ("XZ",lambda b:b.startswith(b"\xfd7zXZ\x00")),
    ("7Z",lambda b:b.startswith(b"7z\xbc\xaf\x27\x1c")),
    ("RAR",lambda b:b.startswith(b"Rar!\x1a\x07\x00") or b.startswith(b"Rar!\x1a\x07\x01\x00")),
    ("ZSTD",lambda b:b.startswith(b"\x28\xb5\x2f\xfd")),
]

errors=[]
for p in ROOT.rglob("*"):
    if not p.is_file() or any(part in SKIP for part in p.parts):
        continue
    rel=p.relative_to(ROOT).as_posix()
    low=p.name.lower()
    suffix=p.suffix.lower()

    allowed=(suffix in ALLOWED_TEXT_SUFFIXES or suffix in ALLOWED_BINARY_SUFFIXES or rel in ALLOWED_EXTENSIONLESS)
    if not allowed:
        errors.append(f"{rel}: file class is not approved for publication")

    if (
        low in FORBIDDEN_NAMES
        or low in {".env",".envrc"}
        or low.startswith(".env.")
        or low in KEY_NAMES
        or any(low.endswith(sfx) for sfx in FORBIDDEN_SUFFIXES)
        or p.suffix.lower() in KEY_SUFFIXES
    ):
        errors.append(f"{rel}: forbidden credential/implementation artifact")

    overlap=b""
    first_chunk=True
    with p.open("rb") as fh:
        while True:
            chunk=fh.read(1024*1024)
            if not chunk:
                break
            if first_chunk:
                for label,detector in ARCHIVE_MAGIC:
                    if detector(chunk):
                        errors.append(f"{rel}: recognized {label} archive/container is not publishable")
                if suffix in ALLOWED_TEXT_SUFFIXES or rel in ALLOWED_EXTENSIONLESS:
                    if b"\x00" in chunk:
                        errors.append(f"{rel}: approved text file contains binary NUL bytes")
                    try:
                        chunk.decode("utf-8")
                    except UnicodeDecodeError:
                        errors.append(f"{rel}: approved text file is not valid UTF-8")
                if suffix in ALLOWED_BINARY_SUFFIXES:
                    detector=BINARY_MAGIC.get(suffix)
                    if detector is None or not detector(chunk):
                        errors.append(f"{rel}: binary content does not match approved {suffix} file type")
                first_chunk=False
            scan=overlap+chunk
            for label,rx in SECRET_PATTERNS:
                if rx.search(scan):
                    errors.append(f"{rel}: possible {label}")
            overlap=scan[-512:]

if errors:
    print("Public Credential & Artifact Gate: FAIL")
    for e in errors:
        print(f" - {e}")
    sys.exit(1)

print("Public Credential & Artifact Gate: PASS")

#!/usr/bin/env python3
"""Fail when public page header navigation drifts from the homepage contract."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
CANONICAL_PATH = ROOT / "index.html"

HEADER_RE = re.compile(r"<header\b[^>]*>(.*?)</header>", re.I | re.S)
NAV_RE = re.compile(r"<nav\b[^>]*>.*?</nav>", re.I | re.S)

def site_nav(path: Path):
    text = path.read_text(encoding="utf-8")
    header = HEADER_RE.search(text)
    if not header:
        return None
    nav = NAV_RE.search(header.group(0))
    return re.sub(r"\s+", " ", nav.group(0)).strip() if nav else None

canonical = site_nav(CANONICAL_PATH)
if not canonical:
    raise SystemExit("Homepage is missing header navigation.")

required = (
    '<summary>Products</summary>',
    'href="/northstar-signal/"',
    'DECIDE · ALIGN',
    '>Northstar Signal</a>',
    '<details class="mobile-nav">',
    'href="/storefront/"',
    'href="/guard/"',
    'href="/forge/"',
    'href="/console/"',
    'href="/assurance/"',
    'href="/crossplane/"',
    'href="/operating-model/"',
    'href="/guides/"',
)
missing = [token for token in required if token not in canonical]
if missing:
    raise SystemExit("Homepage navigation contract is incomplete: " + ", ".join(missing))

failures = []
checked = 0
for path in sorted(ROOT.rglob("index.html")):
    rel = path.relative_to(ROOT)
    text = path.read_text(encoding="utf-8")
    if "<header" not in text.lower():
        continue
    header = site_header(path)
    checked += 1
    if header is None:
        failures.append(f"{rel}: missing site header")
    elif header != canonical:
        failures.append(f"{rel}: desktop/mobile header navigation differs from index.html")

if failures:
    print("Navigation consistency audit failed:", file=sys.stderr)
    for failure in failures:
        print(f" - {failure}", file=sys.stderr)
    sys.exit(1)

print(f"Desktop/mobile navigation consistency audit passed for {checked} public pages.")

#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DESKTOP_OLD = '<nav><a href="/">Home</a>'
DESKTOP_NEW = '<nav><a href="/">Home</a><a href="/portfolio/">Portfolio Status</a>'
MOBILE_OLD = '<div class="nav-menu"><a href="/">Home</a>'
MOBILE_NEW = '<div class="nav-menu"><a href="/">Home</a><a href="/portfolio/">Portfolio Status</a>'

changed = []
for path in sorted(ROOT.rglob('*.html')):
    rel = path.relative_to(ROOT).as_posix()
    if rel == 'portfolio/index.html':
        continue
    text = path.read_text(encoding='utf-8')
    original = text
    if DESKTOP_OLD in text and '<nav><a href="/">Home</a><a href="/portfolio/">Portfolio Status</a>' not in text:
        text = text.replace(DESKTOP_OLD, DESKTOP_NEW, 1)
    if MOBILE_OLD in text and '<div class="nav-menu"><a href="/">Home</a><a href="/portfolio/">Portfolio Status</a>' not in text:
        text = text.replace(MOBILE_OLD, MOBILE_NEW, 1)
    if text != original:
        path.write_text(text, encoding='utf-8')
        changed.append(rel)

print(f'Updated {len(changed)} HTML files')
for rel in changed:
    print(rel)

# Remove this one-shot updater and its workflow so the final PR contains only site changes.
for rel in ('scripts/add_portfolio_nav.py', '.github/workflows/portfolio-navigation-autofix.yml'):
    target = ROOT / rel
    if target.exists():
        target.unlink()

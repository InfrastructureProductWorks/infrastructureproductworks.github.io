#!/usr/bin/env python3
"""Validate intentionally published search-facing IPW pages and discovery files."""
from pathlib import Path
import json
import re
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://infrastructureproductworks.com"
ROUTES = ["/","/about/","/agentic-interoperability/","/assurance/","/composite-ai/","/console/","/crossplane/","/docs/guard/","/forge/","/guard/","/insights/","/insights/ai-amplified-technical-leader/","/insights/building-ipw/","/insights/platform-director/","/northstar-signal/","/operating-model/","/portfolio/","/security/","/storefront/","/work/"]
# The homepage and Forge page are covered by byte-pinned security contracts.
# They remain in the sitemap; changing their HTML needs independent contract review.
PROTECTED_CONTRACT_PAGES = {"index.html", "forge/index.html"}
errors = []
ns = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
try:
    root = ET.parse(ROOT / "sitemap.xml").getroot()
    actual = [node.text for node in root.findall(f"{ns}url/{ns}loc")]
except (ET.ParseError, OSError) as exc:
    actual = []
    errors.append(f"Invalid sitemap: {exc}")
expected = [ORIGIN + route for route in ROUTES]
if actual != expected or len(set(actual)) != len(actual):
    errors.append("Sitemap differs from the approved search inventory.")
manifest = json.loads((ROOT / "config/public-surface-manifest.json").read_text(encoding="utf-8"))
declared = set(manifest["pages"])
for route in ROUTES:
    path = "index.html" if route == "/" else route.strip("/") + "/index.html"
    if path not in declared:
        errors.append(f"{path}: missing from public-surface manifest")
    html = (ROOT / path).read_text(encoding="utf-8")
    head = re.search(r"<head[^>]*>(.*?)</head>", html, re.I | re.S)
    if not head:
        errors.append(f"{path}: missing HTML head")
        continue
    markup = head.group(0)
    if path in PROTECTED_CONTRACT_PAGES:
        if not re.search(r"<title>[^<]+</title>", markup, re.I):
            errors.append(f"{path}: protected page missing title")
        if path == "index.html" and not re.search(r'<meta name="description" content="[^"]+"', markup, re.I):
            errors.append(f"{path}: protected homepage missing description")
        continue
    canonicals = re.findall(r'<link rel="canonical" href="([^"]+)"', markup, re.I)
    if canonicals != [ORIGIN + route]:
        errors.append(f"{path}: missing, incorrect, or duplicate canonical URL")
    descriptions = re.findall(r'<meta name="description" content="([^"]+)"', markup, re.I)
    if len(descriptions) != 1 or not 50 <= len(descriptions[0]) <= 210:
        errors.append(f"{path}: missing, duplicated, or implausible meta description")
    scripts = re.findall(r'<script type="application/ld[+]json">(.*?)</script>', markup, re.I | re.S)
    if len(scripts) != 1:
        errors.append(f"{path}: expected exactly one structured-data block")
    else:
        try:
            data = json.loads(scripts[0])
            if data.get("@context") != "https://schema.org":
                errors.append(f"{path}: unexpected JSON-LD context")
            if not (data.get("@type") or data.get("@graph")):
                errors.append(f"{path}: missing JSON-LD type/graph")
        except (ValueError, TypeError):
            errors.append(f"{path}: invalid JSON-LD")
if "Sitemap: " + ORIGIN + "/sitemap.xml" not in (ROOT / "robots.txt").read_text():
    errors.append("robots.txt lacks the sitemap directive")
if errors:
    for issue in errors:
        print("SEO audit FAIL: " + issue, file=sys.stderr)
    sys.exit(1)
print(f"SEO audit PASS: {len(ROUTES)} sitemap pages, {len(ROUTES) - len(PROTECTED_CONTRACT_PAGES)} metadata pages, {len(PROTECTED_CONTRACT_PAGES)} protected pages.")

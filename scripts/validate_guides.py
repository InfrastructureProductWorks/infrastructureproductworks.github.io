#!/usr/bin/env python3
"""Check guide routes, fragment targets, public links, and demo entry points."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.ids, self.links, self.h1s = set(), [], 0
        self.feed(path.read_text())

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if 'id' in attrs:
            assert attrs['id'] not in self.ids, f'Duplicate id: {attrs["id"]}'
            self.ids.add(attrs['id'])
        if tag == 'h1':
            self.h1s += 1
        for attr in ('href', 'src'):
            if attr in attrs:
                self.links.append(attrs[attr])

pages = {path:Page(path) for path in sorted((ROOT/'guides').glob('**/index.html'))}
assert len(pages) == 6, 'Expected a hub and five app guides'
for path, page in pages.items():
    assert page.h1s == 1, f'Expected one page title: {path}'
    for link in page.links:
        url = urlsplit(link)
        if url.netloc == 'github.com':
            public_repo = '/InfrastructureProductWorks/iaap-guard'
            assert url.path in ('/apps/iaap-guard', public_repo) or url.path.startswith(public_repo + '/'), f'Unverified public repository link: {link}'
        if url.scheme or url.netloc:
            continue
        target = path if not url.path else ROOT/url.path.lstrip('/')
        if target.is_dir():
            target /= 'index.html'
        assert target.is_file(), f'Missing target from {path}: {link}'
        if url.fragment:
            parsed = pages.get(target) or Page(target)
            assert url.fragment in parsed.ids, f'Missing fragment from {path}: {link}'

entries = {
    'index.html':'/guides/',
    'storefront/index.html':'/guides/storefront/',
    'guard/index.html':'/guides/guard/',
    'docs/guard/index.html':'/guides/guard/',
    'forge/index.html':'/guides/forge/',
    'console/index.html':'/guides/console/',
    'console/demo/index.html':'/guides/console/',
    'assurance/index.html':'/guides/assurance/',
    'assurance/demo/index.html':'/guides/assurance/',
    'assurance/portal/index.html':'/guides/assurance/',
}
for path, expected in entries.items():
    assert expected in Page(ROOT/path).links, f'Missing guide entry point: {path}'
print('Six guides, internal routes and anchors, public repository links, and ten entry points verified.')

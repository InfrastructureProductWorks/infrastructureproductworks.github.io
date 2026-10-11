#!/usr/bin/env python3
"""Verify locked planning assets and optional cross-repository byte parity."""
import argparse
import hashlib
import json
import re
from urllib.parse import urlparse, parse_qs
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / ('ui/northstar-signal' if (ROOT / 'ui/northstar-signal').is_dir() else 'assets')

def check_page(root, assets, lock):
    application = assets.name != 'assets'
    page = root / ('ui/northstar-signal/index.html' if application else 'northstar-signal/demo/index.html')
    html = page.read_text()
    urls = re.findall(r'<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"', html)
    positions = {}
    for name in lock['assets']:
        matches = [url for url in urls if Path(urlparse(url).path).name == name]
        if len(matches) != 1:
            raise ValueError('Missing/duplicate funding HTML bundle: ' + name)
        parsed = urlparse(matches[0])
        resolved = (root / parsed.path.lstrip('/') if parsed.path.startswith('/') else page.parent / parsed.path).resolve()
        if resolved != (assets / name).resolve():
            raise ValueError('Funding HTML bundle resolves to the wrong asset: ' + name)
        content = (assets / name).read_bytes()
        blob = hashlib.sha1(b'blob ' + str(len(content)).encode() + b'\0' + content).hexdigest()
        if parse_qs(parsed.query).get('v') != [blob]:
            raise ValueError('Stale funding HTML cache reference: ' + name)
        positions[name] = html.index(matches[0])
    boot = 'app.js' if application else 'northstar-signal-demo.js'
    boot_urls = [url for url in urls if Path(urlparse(url).path).name == boot]
    if len(boot_urls) != 1 or not (positions['funding-fixture.js'] < positions['funding-workflow.js'] < positions['funding-dashboard.js'] < html.index(boot_urls[0])):
        raise ValueError('Funding HTML bundles must load before dashboard/bootstrap')


def check(peer=None):
    lock = json.loads((ASSETS / 'funding-contract.lock.json').read_text())
    if lock['contract'] != 'northstar-funding-planning/v1' or lock['syntheticOnly'] is not True:
        raise ValueError('Funding contract/authority changed')
    expected = {'funding-dashboard.js', 'funding-dashboard.css', 'funding-fixture.js', 'funding-workflow.js'}
    if set(lock['assets']) != expected:
        raise ValueError('Missing/extra shared asset')
    for name, digest in lock['assets'].items():
        if hashlib.sha256((ASSETS / name).read_bytes()).hexdigest() != digest:
            raise ValueError('Funding asset drift: ' + name)
    test = ROOT / 'tests/funding/semantic.cjs'
    if hashlib.sha256(test.read_bytes()).hexdigest() != lock['semanticTestSha256']:
        raise ValueError('Funding semantic test drift')
    browser = ROOT / 'tests/funding/browser.cjs'
    if hashlib.sha256(browser.read_bytes()).hexdigest() != lock['browserTestSha256']:
        raise ValueError('Funding browser test drift')
    check_page(ROOT, ASSETS, lock)
    if peer:
        peer = Path(peer)
        other = peer / ('ui/northstar-signal' if (peer / 'ui/northstar-signal').is_dir() else 'assets')
        for name in expected | {'funding-contract.lock.json'}:
            if (ASSETS / name).read_bytes() != (other / name).read_bytes():
                raise ValueError('Cross-repository dashboard drift: ' + name)
        check_page(peer, other, lock)
        for relative in ['tests/funding/semantic.cjs', 'tests/funding/browser.cjs', 'scripts/check_funding_parity.py']:
            if (ROOT / relative).read_bytes() != (peer / relative).read_bytes():
                raise ValueError('Cross-repository validation drift: ' + relative)
    print('Funding planning contract and shared assets verified' + (' across repositories.' if peer else '.'))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--peer')
    check(parser.parse_args().peer)

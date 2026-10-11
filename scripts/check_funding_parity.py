#!/usr/bin/env python3
"""Verify locked planning assets and optional cross-repository byte parity."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / ('ui/northstar-signal' if (ROOT / 'ui/northstar-signal').is_dir() else 'assets')

def check(peer=None):
    lock = json.loads((ASSETS / 'funding-contract.lock.json').read_text())
    if lock['contract'] != 'northstar-funding-planning/v1' or lock['syntheticOnly'] is not True:
        raise ValueError('Funding contract/authority changed')
    expected = {'funding-dashboard.js', 'funding-dashboard.css', 'funding-fixture.js'}
    if set(lock['assets']) != expected:
        raise ValueError('Missing/extra shared asset')
    for name, digest in lock['assets'].items():
        if hashlib.sha256((ASSETS / name).read_bytes()).hexdigest() != digest:
            raise ValueError('Funding asset drift: ' + name)
    test = ROOT / 'tests/funding/semantic.cjs'
    if hashlib.sha256(test.read_bytes()).hexdigest() != lock['semanticTestSha256']:
        raise ValueError('Funding semantic test drift')
    if peer:
        peer = Path(peer)
        other = peer / ('ui/northstar-signal' if (peer / 'ui/northstar-signal').is_dir() else 'assets')
        for name in expected | {'funding-contract.lock.json'}:
            if (ASSETS / name).read_bytes() != (other / name).read_bytes():
                raise ValueError('Cross-repository dashboard drift: ' + name)
        for relative in ['tests/funding/semantic.cjs', 'scripts/check_funding_parity.py']:
            if (ROOT / relative).read_bytes() != (peer / relative).read_bytes():
                raise ValueError('Cross-repository validation drift: ' + relative)
    print('Funding planning contract and shared assets verified' + (' across repositories.' if peer else '.'))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--peer')
    check(parser.parse_args().peer)

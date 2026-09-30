#!/usr/bin/env python3
"""Keep product language consistent across published text and browser assets."""
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
TERMS = re.compile(r"(?:recur" r"sive[\s_-]*(?:lineage|geometry|assurance)|frac" r"tal)", re.I)
SUFFIXES = {".html", ".htm", ".md", ".js", ".mjs", ".cjs", ".css", ".svg", ".json", ".txt", ".xml"}

def main():
    paths = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT).decode().split("\0")
    errors = []
    for name in filter(None, paths):
        path = ROOT / name
        if not path.is_file() or path.suffix.lower() not in SUFFIXES:
            continue
        if TERMS.search(name) or TERMS.search(path.read_text(encoding="utf-8")):
            errors.append(name)
    if errors:
        raise SystemExit("Public product language: FAIL\n" + "\n".join(errors))
    print("Public product language: PASS")

if __name__ == "__main__":
    main()

# Public Extraction Resistance Boundary

Infrastructure Product Works is intentionally demonstrable without publishing the implementation recipe.

## Release rule

Public hardening is **content preserving**. Existing portfolio pages, product explanations, diagrams, demo instructions, and substantive visible copy must not be removed merely to reduce automated extraction. Security fixes should address the exposure mechanism first.

The public site may explain capabilities, outcomes, architecture concepts, synthetic scenarios, and bounded demonstrations. It must not publish secrets, source maps, state files, private implementation-repository references, or machine-readable operational API specifications that materially collapse the work required to reconstruct private product internals.

Interactive demonstrations remain synthetic or sanitized projections. They are not operational product clients and do not establish production authority.

## Automated gate

`scripts/audit_public_exposure.py` runs in pull requests and on protected-main verification. It:

- rejects common secret material and reconstruction-enabling implementation artifacts;
- rejects browser-facing references to private IPW implementation repositories;
- verifies the established public product/story pages remain present;
- verifies bounded demo surfaces continue to identify themselves as synthetic or sanitized.

The gate is deliberately additive: new public pages are allowed. It does not score, rewrite, hide, or delete visible portfolio content.

## Defense in depth

This repository is public by design. Anything committed here must be treated as disclosed. Rate limiting, bot management, server-side projection APIs, and private-core enforcement belong at hosting/application boundaries where available; they are not simulated by this static-site repository.

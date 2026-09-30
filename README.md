# infrastructureproductworks.github.io

Repository links on this public website must point only to repositories confirmed public. Do not link to private or internal repositories, including their files, issues, pull requests, releases, or raw-content URLs. Use the on-site product guidance where implementation sources are restricted. Verify repository visibility before adding or changing a repository link.

## Application user guides

Use benefit-focused wording across public pages, guides, diagrams, accessibility labels, and browser assets. Northstar's relationship view is **End-to-End Traceability**; Assurance's relationship view is **Connected Assurance**. Keep unnecessary implementation detail in restricted engineering documentation. Run `python3 scripts/audit_public_language.py` before publishing. This wording convention does not change record schemas, authorization checks, or evidence semantics.

The `/guides/` hub links to six complete application guides. Edit the public Markdown in `guides/content/`, then run `python3 scripts/build_guides.py` and `python3 scripts/validate_guides.py`. Commit the source and generated HTML together. CI checks that they remain synchronized and that guide links and section targets resolve.

Keep role responsibilities distinct from implemented access controls and authoring features. When a demo changes, walk the affected procedure and update its instructions and validation date. Console and Assurance include an expandable walkthrough; product pages link to the full guide next to the demo launch control. Northstar Signal includes OKR composition, bounded authorization, evidence lineage, backlog handoff, and benefit measurement. Storefront and Forge launch on their existing external hosts.

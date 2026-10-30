# infrastructureproductworks.github.io

Repository links on this public website must point only to repositories confirmed public. Do not link to private or internal repositories, including their files, issues, pull requests, releases, or raw-content URLs. Use the on-site product guidance where implementation sources are restricted. Verify repository visibility before adding or changing a repository link.

## Application user guides

Use benefit-focused wording across public pages, guides, diagrams, accessibility labels, and browser assets. Northstar's relationship view is **End-to-End Traceability**; Assurance's relationship view is **Connected Assurance**. Keep unnecessary implementation detail in restricted engineering documentation. Run `python3 scripts/audit_public_language.py` before publishing. This wording convention does not change record schemas, authorization checks, or evidence semantics.

The `/guides/` hub links to six complete application guides. Edit the public Markdown in `guides/content/`, then run `python3 scripts/build_guides.py` and `python3 scripts/validate_guides.py`. Commit the source and generated HTML together. CI checks that they remain synchronized and that guide links and section targets resolve.

Keep role responsibilities distinct from implemented access controls and authoring features. When a demo changes, walk the affected procedure and update its instructions and validation date. Console and Assurance include an expandable walkthrough; product pages link to the full guide next to the demo launch control. Northstar Signal includes OKR composition, bounded authorization, evidence lineage, backlog handoff, and benefit measurement. Storefront and Forge launch on their existing external hosts.

## Infrastructure product lifecycle

The canonical documentation-first model is the public thesis [Infrastructure Product Lifecycle](https://github.com/InfrastructureProductWorks/ai-powered-infrastructure-as-a-product/blob/main/docs/INFRASTRUCTURE-PRODUCT-LIFECYCLE.md). Keep `/operating-model/#product-lifecycle`, the product-page role summaries, `/portfolio/#lifecycle-roadmap`, and the six `guides/content/` lifecycle sections consistent with that model; rebuild guide HTML after source changes.

Lifecycle requirements are a design reference, separate from the live portfolio telemetry bundle. Do not mark lifecycle stages operational, invent delivery progress, or substitute design acceptance for implementation evidence. Preserve the distinction between product definitions/versions and customer instances, with separate investment, publication, execution, destructive-action, and retention authorities.

## Search discoverability

Search discovery is intentionally limited to the public marketing, architecture, and insights pages enumerated in `sitemap.xml` and `scripts/validate_seo.py`. Run `python3 scripts/validate_seo.py` before proposing website changes. Keep canonical URLs, descriptions, and truthful structured metadata aligned on editable public pages. Homepage and Forge are included in the sitemap but are byte-pinned public contracts: their markup must not be rewritten or re-pinned solely for SEO without a complete independent security-contract review. Do not publish private implementation information, customer records, fictitious customer outcomes, or unsupported compliance claims in order to rank. Demo, legal, redirect, and support utility routes are intentionally excluded from the sitemap; this does not remove or disallow them.

## Website privacy and access review

The [Cloudflare privacy and launch review](docs/cloudflare-privacy-launch-review.md) records the dated configuration observations, processing/retention gaps and remaining browser acceptance checks. Public marketing and guides are separate from the email-gated demo paths. The website privacy notice explains that distinction and Cloudflare Web Analytics. This record does not activate inquiry intake, optional tracking, external log exports or production capabilities.

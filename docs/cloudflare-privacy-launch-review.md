# Cloudflare privacy and launch review

Configuration observed October 30, 2026; refreshed after the founder confirmed Zero Trust Free and the matching www demo paths were added. This is a sanitized configuration review, not a legal opinion, production readiness certificate, complete data inventory or proof of visitor behavior. No visitor records, credentials, account identifiers or raw configuration exports are published here.

## Verified configuration

| Area | Observed state | Boundary |
| --- | --- | --- |
| Website delivery | GitHub Pages origin; apex and www records proxied through Cloudflare | Other hosts require their own review. |
| Transport | Full (strict) TLS, HTTPS redirect enabled, minimum TLS 1.2, TLS 1.3 enabled | Configuration evidence does not replace a browser check. |
| Demo gate | One Access application covers `/northstar-signal/demo`, `/guard/demo`, `/console/demo`, `/assurance/demo`, `/assurance/portal` | All five paths are configured on both apex and www hostnames (ten unique destinations). Existing email-PIN policy retained; configured session 24 hours. Root marketing pages and guides are outside this application. |
| Website analytics | Cloudflare Web Analytics enabled with automatic installation | Not a finding that all website processing is anonymous or cookie-free. |
| Third-party tools | Zaraz configuration contains no tools | Does not inventory scripts embedded in source or external applications. No optional tools were activated by this review. |
| Log exports | Account and zone Logpush lists returned no jobs | Does not mean Cloudflare retains no logs or that other export mechanisms are absent. |
| Request protection | Existing scraper challenge, request-rate rule and North America-only block remain enabled | Geography is not a legal compliance or residency guarantee. |

## Processing and retention register

| Processing | Purpose | Current handling evidence | Remaining verification |
| --- | --- | --- | --- |
| Cloudflare Access email and connection records | Send email codes, authenticate demo access, investigate misuse | Same email-PIN policy; 24-hour application session; no Logpush jobs observed | Founder confirmed Zero Trust Free. Provider documentation lists 24-hour Access log retention and 18-month admin log retention. Confirm actual record lifecycle, operator access and provider-specific identity/deletion handling; these periods are not a universal deletion guarantee. |
| Website security/request metadata | Delivery and abuse prevention | Proxied hostname, HTTPS and existing request protections | Establish provider retention and any separate operational copies; do not promise IP anonymity or automatic erasure. |
| Web Analytics | Aggregate usage/performance | Service enabled; provider documents no cookies/local storage for analytics measurement | Verify actual browser requests, settings and applicable privacy requirements before making stronger statements or adding new tools. |
| Optional inquiry | Inquiry review and response | Existing purpose/version checks and default-disabled admission gate retained in source | Retention, private destination, deployed flag, human owner, deletion/backup handling and authorized synthetic receipt remain the existing intake activation prerequisites. This review does not activate intake. |
| Browser demo state and exports | Synthetic evaluation | Existing fictional-data and local-state instructions retained | Verify each application's storage, network behavior and export handling against its actual deployed release. |

Do not reuse demo email identities for marketing on the strength of sign-in. Do not describe email verification as acceptance of terms or proof of employer identity. Never retain OTPs or authorization cookie values in an audit receipt. Retention decisions must distinguish provider records, IPW exports, private issue content, notifications and backup expiry. A privacy-request response must identify the records actually found, available controls, completion evidence and any documented exception; do not promise deletion beyond verified provider capability.

## Follow-up evidence and limits

- The founder confirmed Zero Trust Free. Cloudflare's current log table lists Access login logs at 24 hours and admin logs at 18 months. This combines owner confirmation with provider documentation, not an independently read billing receipt or measured expiry test. The OAuth connection cannot read the billing subscription endpoint; a zone log-retention flag read was also unauthorized despite logs scopes. Do not repeatedly reconnect or extend privileges merely to make that query pass.
- Cloudflare native request tracing was run with origin responses skipped. A North America simulation did not match the geographic block; a Europe simulation matched it and returned simulated HTTP 403. Those traces did not reproduce a real browser visit or identify the rule that rejected the earlier browser. Enabled AI-assistant blocking can also affect automated inspection. No live geography, fingerprint or security workaround was used.
- Read-only Render inventory in the previously confirmed workspace shows that the linked Forge and Storefront previews are web services with provider subdomains enabled. Other preview/connected variants also exist. Anonymous GET checks of the two currently linked preview landing pages returned HTTP 200 with HTML and no login redirect. This establishes that those landing pages are directly readable without the website email gate; it does not establish the behavior of privileged routes, every variant or customer-data access. A website Access rule does not cover those provider hostnames. Review all active variants, not only the two current website links, before claiming complete demo gating.
- [Retention and privacy-request handling](privacy-request-handling.md) defines the inventory, authority, execution receipt and verification procedure. No visitor identity, log or production record was deleted to test it. The procedure is ready for use; provider-specific erasure and full launch acceptance remain unverified.

## Evidence still required before launch acceptance

- From an allowed location and a clean, unauthenticated browser, check `/`, product overviews, guides, `/privacy/` and `/terms/` without a demo login. Check all five protected routes with no trailing slash, trailing slash and direct `index.html`; expect the Access sign-in gate. Validate expiry and sign-out without recording any code or cookie.
- Check the www hostname, GitHub Pages hostname, separate Render previews and directly addressable assets. The Access application now lists all five paths on apex and www, verified by independent configuration readback. Canonical redirects, other origins and actual visitor enforcement have not been demonstrated by this review. A public repository remains public; the gate is not source secrecy. Do not broaden public exposure or claim confidential demo delivery.
- The review browser received a blocked-request response. North America-only geography and scripted-client challenges are possible contributors; the response did not establish which rule caused it. Do not disable protection or spoof geography/client identity to manufacture a passing test.
- Inspect browser network/storage before consent, after rejection, after acceptance and after withdrawal if optional tools are proposed. A banner alone is not enforcement. Zaraz governs only configured tools; source-loaded scripts need separate control. Keep optional tools off until their purpose, provider, consent/opt-out behavior and handling are accepted.
- Before enabling inquiry intake, check receiver-side validation, duplicate handling, rate limits, private-cache behavior, human acknowledgment and the deployed admission flag under its existing release workflow. Cloudflare on the marketing hostname does not automatically protect a Render receiver.
- Reconcile the privacy notice with the exact deployed configuration; confirm that privacy and use notices are reachable before data submission. Record truthful results, source revision, date and limits without contact payloads or private operational coordinates.

## Change and review procedure

1. Read the current configuration and the accepted scope before changes. Keep a restricted rollback record; publish only a sanitized summary.
2. Change source through a protected pull request. Preserve existing notices, synthetic procedures, consent boundaries and default-disabled intake. Update generated guides with their Markdown sources.
3. Run navigation, guide parity, public language, preservation, exposure and manifest gates. Inspect complete changed text and links; any immutable-source pin update requires deliberate review of the new source and the unchanged public protocol exceptions, not automatic regeneration to suppress a finding.
4. Run exact-head CI, resolve review findings, obtain a fresh automated review, verify base drift and protections, then merge using an allowed method. Verify exact-main checks and deployment separately.
5. Any future analytics activation, provider export, retention change or access expansion needs its own concrete scope and authorization. This document neither enables those features nor approves a new legal commitment.

## Provider references

- [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/)
- [Access authorization cookies](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/)
- [Zero Trust log retention](https://developers.cloudflare.com/cloudflare-one/insights/logs/)
- [Zaraz consent management](https://developers.cloudflare.com/zaraz/consent-management/)
- [Application paths](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/)

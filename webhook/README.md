# GitHub Marketplace webhook + website support intake

Minimal public receiver for GitHub Marketplace events and the Infrastructure Product Works website support form.

## Runtime

- Node.js 20+
- Start: `node server.js`
- Health: `GET /health`
- Marketplace webhook: `POST /api/github/marketplace`
- Website support intake: `POST /api/support`

## Marketplace secret

Set `GITHUB_MARKETPLACE_WEBHOOK_SECRET` in the hosting platform's protected environment settings. Never commit its value.

Marketplace requests verify `X-Hub-Signature-256` using HMAC-SHA256 before acceptance. The receiver records only event/action/delivery metadata and performs no billing, provisioning, approval, deployment, or privileged infrastructure action.

Marketplace uploads use a separate 25 MiB body limit and the ten-second application body deadline. Oversized requests return 413 and stalled requests return 408 before acceptance; incomplete uploads are rejected, and disconnect errors do not terminate the receiver. Failure responses finish before the partial connection closes. Signature verification still uses the exact received bytes. The inquiry endpoint retains its smaller 32 KiB limit.

## Support intake

The website support form submits only to the server-side `/api/support` endpoint. GitHub credentials are never exposed to browser JavaScript.

Required for issue creation:

- `SUPPORT_GITHUB_TOKEN`: server-side credential with the minimum repository issue-write permission required for the configured target.
- `SUPPORT_GITHUB_REPO`: required private `owner/repository` target for support issues. There is intentionally no public-repository default.

The endpoint:

- accepts only the production Infrastructure Product Works website origins;
- validates allowed products and request types;
- bounds every text field;
- applies a basic per-IP rate limit;
- includes a honeypot path for low-cost bot rejection;
- returns a customer reference while withholding the internal GitHub issue URL;
- refuses normal intake when the server-side issue credential or explicit private target repository is not configured;
- does not accept security vulnerabilities or sensitive customer material.

Security-sensitive reports remain on the separate security-reporting path and must never be converted into ordinary public support issues.


## Immediate owner notification

Set `SUPPORT_GITHUB_ASSIGNEE` to the GitHub username that should own new website support issues.

After a private support issue is created, the backend attempts to assign that issue to the configured owner. Assignment is best-effort: an assignment failure is logged but never changes the customer submission result or prevents issue creation.

GitHub can deliver assignment notifications through the web notifications inbox, GitHub Mobile, and email according to the assignee's GitHub notification settings.

## Inquiry contract and local validation

`inquiry-contract.js` defines the bounded products and request types. Check the static form with `node scripts/build_inquiry_contract.mjs` from the repository root; regenerate it with `--write` after a deliberate contract change. CI checks both product and type fields.

Older `Product question`, `Bug` and `Feature request` values map to the corresponding portfolio question, public demo issue and feedback categories. `Installation` is rejected: this channel does not provide installation or production support. Unknown categories and malformed JSON shapes fail validation.

Run `npm test --prefix webhook` from the root. All downstream requests in these tests are mocked; tests create no real issues or notifications and require no credentials. Loopback HTTP tests cover the six categories in both form and JSON encodings, private-target refusal, receipts, duplicates, failure handling and signed Marketplace compatibility.

## Receipt and retry limits

Inquiry uploads have a ten-second application body deadline and a 32 KiB limit. Incomplete JSON uploads return 408, oversized uploads return 413, and form submissions receive the equivalent failed-submission redirect. The response completes before the partial connection closes. These failures never call the downstream issue transport.

Each GitHub operation has a five-second application deadline, including response-body parsing. Requests do not follow redirects and issue creation is never automatically retried. A timeout or invalid response after attempting issue creation produces `submission_outcome_unknown` and a reference for operator follow-up; a remote write might already have occurred. Do not automatically resubmit an uncertain attempt.

Identical normalized payloads share one in-flight/result receipt within a single running process for ten minutes after completion, using an ephemeral HMAC key rather than plaintext cache keys. The cache holds at most 1,000 entries and refuses new unique submissions when full. It is not durable idempotency across restarts, replicas or cache expiry. Operators must reconcile uncertain references before retrying outside this window. Rate-limit state is also bounded per process; edge/proxy and distributed abuse controls need separate deployment review.

Issue creation success does not prove a human saw the inquiry. Assignment is attempted separately; `support-owner-routing` records `assigned`, `assignment_unconfirmed` or `unconfigured` without contact payloads. Notification settings, human acknowledgment, repository access, retention and deletion require operator verification. Do not treat the browser's URL-driven status text as an authenticated receipt.

## Release acceptance

Before promotion, establish the actual hosting workspace, service source/revision, private target and access policy, retention/deletion handling, human response owner, and current privacy notice. Validate a separately authorized synthetic inquiry and owner acknowledgment. This change does not enable live analytics, promise response times, create a retention policy or authorize deployment.



## Inquiry privacy and operator gate

Intake is disabled by default. Only set `SUPPORT_INQUIRY_ENABLED=true` after the operator has approved the deployed notice, private target/access, service providers, retention/deletion procedure, privacy-request route and synthetic acceptance exercise. This setting is a technical admission gate, not proof of legal review or authorization by itself. Marketplace processing is separate and is not enabled by this flag.

The form presents an unchecked purpose-specific request to process the inquiry and a current notice version. The core intake rejects missing/negative/malformed choices or stale notice versions before any downstream request. JSON uses `inquiryProcessing: true` or `"requested"`; form submissions use `inquiryProcessing=requested`; both require `privacyNoticeVersion=inquiry-2026-10-29`. This is not marketing opt-in, acceptance of commercial terms or a declaration that consent is the legal basis for every processing activity.

The private issue retains purpose, notice version and server receipt time alongside the inquiry. This is an assertion submitted by a requester, not authenticated identity or an immutable legal attestation. Routine logs omit inquiry content. Operator-approved retention and deletion must cover issue content, provider records and backups as applicable; the in-memory retry cache is not that procedure. Do not enable optional telemetry, advertising, marketing reuse or AI training on the basis of an inquiry request.

## Literal inquiry records

New issues use `literal-json/v1` for submitted fields. Only the eight declared inquiry fields are serialized in a JSON code block, with backticks escaped as JSON Unicode sequences so submitted text cannot terminate the fence. Markdown images, HTML and links remain literal display data. Existing issues are not rewritten. Operators and future privacy/export tooling must treat both old free-text records and this explicit format as untrusted data, preserve purpose/reference/notice/time metadata, and never execute submitted instructions. This is rendering containment, not content approval, identity verification or a claim that GitHub/provider behavior has been audited end to end.

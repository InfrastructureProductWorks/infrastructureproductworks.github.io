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


## Immediate email notification

The backend can send a best-effort email alert after a private GitHub support issue is created. Notification failure never changes the customer submission result and never prevents issue creation.

Configure these protected environment variables on the Render service:

- `SUPPORT_NOTIFY_TO`: mailbox that receives the alert.
- `SUPPORT_NOTIFY_FROM`: optional From address; defaults to `SUPPORT_SMTP_USER`.
- `SUPPORT_SMTP_HOST`: SMTP server hostname.
- `SUPPORT_SMTP_PORT`: SMTP port; defaults to `465`.
- `SUPPORT_SMTP_SECURE`: defaults to `true`; set to `false` for STARTTLS-style ports such as 587.
- `SUPPORT_SMTP_USER`: SMTP account username.
- `SUPPORT_SMTP_PASS`: SMTP password or provider-issued app password.

The email contains only the support reference, product, request type, title and private issue link. Customer contact information and the full request remain only in the private GitHub issue.

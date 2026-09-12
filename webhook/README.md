# GitHub Marketplace webhook receiver

Minimal Public Beta receiver for GitHub Marketplace events.

## Runtime
- Node.js 20+
- Start: `node server.js`
- Health: `GET /health`
- Payload: `POST /api/github/marketplace`
- Content type: `application/json`

## Required secret
Set `GITHUB_MARKETPLACE_WEBHOOK_SECRET` in the hosting platform's protected environment settings. Never commit its value.

The receiver verifies `X-Hub-Signature-256` using HMAC-SHA256 before accepting a payload. It records only event/action/delivery metadata in runtime logs and performs no billing, provisioning, approval, deployment, or privileged infrastructure action.
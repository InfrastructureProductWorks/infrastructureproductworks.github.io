# Website privacy-request and retention procedure

Scope: IPW website demo access and optional portfolio inquiries. Established October 30, 2026. This procedure supports operational handling; it does not determine which law applies, impose an invented response deadline, authorize a legal hold, or prove that provider erasure has occurred. No live data deletion or new collection is activated by publishing it.

## Responsibility and intake

The IPW founder is the accountable website operator until a replacement is explicitly designated. Receive privacy requests through the contact published in `/privacy/`. Record a minimal restricted case reference, received date, requested action, affected service and current status. Do not put personal case details in this public repository or public pull-request comments. Restrict case access to the assigned operator and authorized reviewers.

Verify that the requester is entitled to the requested information using a proportionate method tied to the original contact or record. Do not request identity documents, passwords, OTPs, authorization cookies or unrelated personal information by default. A demo mailbox code is not proof of employment, organization authority or ownership of every record with similar text. Do not disclose whether another person's record exists while resolving identity uncertainty.

Before deciding the request, identify applicable obligations, response timing, any necessary verification and any lawful preservation exception. Record the responsible determination and its reason. Do not silently invent a universal deadline or refuse a request merely because this procedure has not specified one. A preservation exception must be scoped to the records and reason involved, reviewed when it ends, and must not become indefinite retention by default.

## Record classes and handling boundaries

| Record class | Current evidence | Handling rule |
| --- | --- | --- |
| Access login logs | Owner-confirmed Zero Trust Free; provider documents 24-hour retention | Treat this as the provider's documented period for that log class, not tested expiry or universal erasure. Avoid creating a new exported copy merely to answer a request. |
| Admin activity logs | Provider documents 18-month retention | Separate security/account change evidence from visitor login logs. Minimize case identifiers in administrative actions. |
| Access user identity and sessions | Identity and session resources are distinct from login logs | Determine current identity state and available provider actions without assuming a log TTL deletes the identity. Session revocation is access control, not erasure. |
| Authentication tokens/claims received by demo hosts | Access tokens can carry email and session details to the hosting service | Inventory application/hosting logs, traces, error tools, exports and downstream copies separately from Cloudflare login records. The origin verifier's in-memory handling does not establish provider retention, erasure or absence of other copies. Never copy a live token into a case or public receipt; use only separately authorized synthetic probes. |
| Other Cloudflare security, analytics and provider records | No single verified deletion period across services | Identify the exact dataset, applicable provider terms and actual available controls; do not apply the Access log period to it. |
| IPW copies or exports | No account/zone Logpush jobs were observed in the configuration audit | Check for other copies, downloads and downstream stores; absence of Logpush is not absence of all copies. |
| Optional inquiry private issue, notifications and provider records | Intake is default-disabled in source; activation prerequisites remain separate | Verify the deployed flag before accepting live use. If records exist, inventory content, attachments, comments, notifications and downstream copies separately. In-memory retry expiry is not remote issue deletion. |
| Demo imports and exports on a visitor's device | Existing guides describe bounded local/synthetic workflows | Verify actual application behavior and explain which local files or browser state remain under the visitor's control. Do not claim IPW can remotely erase a downloaded file. |
| Backups and caches | No universal purge guarantee verified | Establish expiry and restoration behavior. Prevent deleted records from silently returning after restoration where a relevant copy is under IPW control; document provider limits. |

Sources: [Zero Trust log retention](https://developers.cloudflare.com/cloudflare-one/insights/logs/), [Access session management](https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/session-management/). Recheck plan and provider documentation when the plan or service changes. Website delivery plans and the demo session timeout do not establish the Zero Trust plan.

## Execute a request

1. Identify the exact target record, tenant/account, service and environment. Use read-only discovery with the least data needed; keep raw identities and cookies out of diagnostics and public evidence.
2. Inventory each applicable record class above. Record `found`, `not found within searched scope`, `not accessible`, or `not yet checked`; these outcomes are not interchangeable. Lack of access is not proof of deletion.
3. Record the action authorized for each target and any preservation exception. Obtain any required target-specific authorization before irreversible deletion. Do not delete a whole dataset, account, security history or unrelated user's record to satisfy one request. Do not disable safeguards, extend retention or create new exports for convenience.
4. Use only the provider-supported operation appropriate to that record class. Capture the operation/reference and result without copying unnecessary payloads. A request accepted by an API is `submitted`, not `verified complete`; track asynchronous work to its terminal state.
5. Verify with the strongest supported evidence: authoritative operation status, readback/search within its documented scope, available retention evidence and checks of IPW-controlled copies. Record `provider limitation` or `verification blocked` when needed. Never infer physical erasure, backup deletion or historical log removal from deleting a user identity or revoking a session.
6. Reconcile partial success and uncertain results before retrying. Use provider guidance or a support case when a required action is unavailable. Do not improvise a destructive workaround or claim that routine session expiry completes a deletion request.
7. Respond through the verified requester channel with the exact scope completed, records retained and the reason, provider limits, any outstanding work and applicable follow-up route. Sending such a response is a separate person-directed action; retain the approved response and transmission receipt privately.
8. Close only when each scoped item has an evidenced disposition and the requester communication is recorded. Minimize the case record itself and assign a reviewed retention disposition. A closed case may state a documented limitation; it must not claim unperformed deletion.

## Minimal restricted execution receipt

Use this structure in the restricted case system, never with real personal data in this public repository:

- Case reference, received date, assigned operator and verification method/result.
- Requested action and exact target scope; reference to the authority and any scoped preservation decision.
- Per record class: search scope, observation time, result and intended action.
- Per action: provider operation reference, submitted/completed status, verification method/result and known limits.
- Copies, caches and backup disposition; unresolved items, next owner and next review date.
- Requester-response approval, sent receipt and case disposition; retention decision for this receipt.

## Safe rehearsal and acceptance

Rehearse first using fictional case references and a mocked inventory. Include: identity mismatch, no record in a bounded search, provider read denial, session-only revocation, identity deletion with historical logs remaining, asynchronous deletion pending, partial downstream cleanup and a scoped preservation exception. Each rehearsal must preserve the appropriate unresolved state and avoid a false completion claim.

A live rehearsal requires a separately authorized synthetic identity, specified services, bounded retention, exact deletion targets and a private evidence destination. Do not use a real visitor record as a test fixture. Source review of this procedure does not constitute a live rehearsal, verified provider deletion, accepted inquiry activation or legal compliance certification.

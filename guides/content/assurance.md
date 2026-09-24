# IaaP Assurance User Guide

End to end instructions for Sentry Shield custody and Portal

Infrastructure Product Works | Version 1.1 | September 24, 2026

Use this guide to inspect a predeployment decision, evaluate bounded runtime authority, replay protected-data custody outcomes, export a runtime record, and read the sanitized Portal. All examples in these interfaces are synthetic.

## 1 Open Assurance and understand the views

Open the [Assurance demo](https://infrastructureproductworks.com/assurance/demo/). It uses preloaded fixtures and requires no credentials, customer records, or uploaded Authority Package.

| View | Current capability |
| --- | --- |
| Sentry · Predeployment | Proposed operating-profile preview using the protected-storage policy example. |
| Shield · Runtime | Interactive browser simulation of bounded Gate 5 runtime reconciliation. |
| Protected Data Custody | Replay of fixed Gate 6 custody proof outcomes. |
| Assurance Portal | Separate sanitized fixture presentation of authority, evidence, review, and service posture. |

The demo opens in Shield. The displayed validity times use a fixed fixture clock. A historical timestamp shown as active at fixture time is not live authorization today.

## 2 Complete the Sentry predeployment exercise

1. Select **Sentry · Predeployment**.
2. Select **Policy Violation**.
3. Inspect the normalized storage candidate. It has public access enabled and an open critical finding.
4. Read the candidate and finding digests, the control reference, and the proposed correction to `/attributes/public_access`.
5. Confirm **DENY** with reason `PROTECTED_STORAGE_PUBLIC_ACCESS`.
6. Select **Bounded Correction**. The fixture now represents public access set to false and the finding resolved after a synthetic rescan.
7. Confirm **ALLOW** with reason `BOUNDED_CORRECTION_VERIFIED`.
8. Read **Preview Provenance**, including the profile status and proof basis.

The expected learning outcome is the complete deny, correct, rescan, and reevaluate sequence. Choosing Bounded Correction selects the corrected fixture; it does not modify a real resource. Sentry remains a proposed operating-profile preview, even when this example returns ALLOW.

## 3 Complete the Shield runtime exercise

1. Select **Shield · Runtime**, then **Valid Authority**.
2. Review the **Authority Package**: authority ID, requester, purpose, validity window, fixture clock, package digests, and the two distinct approvers.
3. Review **Requested Action**. The example changes `public_access` from true to false on one synthetic storage resource.
4. Check the desired and observed state digests and the one-resource blast radius.
5. Review all deterministic checks: package binding, time window, identity and purpose, exact scope, distinct approvers, state digests, managed field, rollback, and notification.
6. Select **Run Assurance Gate** if you want to rerun the active scenario. Selecting a scenario also reevaluates it.
7. Confirm **ALLOW → APPLIED** with reason `RECONCILIATION_APPLIED`.
8. Read **Evidence Handoff Preview** and match its request, resource, decision, and record digest to the active scenario.

APPLIED refers to the synthetic example. The browser does not call a cloud provider or apply a production change.

## 4 Test the runtime exception paths

Choose each condition and wait for the result to update. Read the failed check and reason code before moving to the next example.

| Control | Expected behavior |
| --- | --- |
| Expire Authority | Deny the request because the fixture time is beyond the validity window. |
| Broaden Scope | Deny an attempt to exceed the permitted resource scope. |
| Remove Approver | Deny because the required distinct-approver threshold is no longer met. |
| Change Digest | Deny because the presented state digest does not match the fixed state. |
| Fail Verification | Allow the bounded attempt, then show ROLLED BACK when verification fails and rollback succeeds. |
| Valid Authority | Return to the baseline allowed and applied synthetic example. |

For **Fail Verification**, expect reason `VERIFICATION_FAILED_ROLLBACK_SUCCEEDED`. Distinguish the initial authorization decision from the final action result: ALLOW can accompany ROLLED BACK.

These controls let you understand a failure. They do not give a user a way to remove required approvers, extend real authority, or override a policy denial.

## 5 Understand independent requests

In the Shield view, the three request cards are evaluated independently:

| Request | Result |
| --- | --- |
| ORDER-482 | Valid authority; ALLOW and APPLIED. |
| ORDER-483 | Expired authority; DENY and NO ACTION. |
| ORDER-484 | Missing required approver; DENY and REVIEW REQUIRED. |

One allowed request does not authorize another request. These cards are fixed demonstrations, not selectable live orders. The scenario controls beneath them operate the separate detailed runtime example; they do not turn the cards into an operational queue.

The same order numbers may appear in Console. Matching labels do not establish a connected transaction between these public demos.

## 6 Export the runtime decision record

1. In **Shield · Runtime**, select the scenario whose result you need to retain.
2. Confirm evaluation has completed and read the final decision and action outcome.
3. Select **Export Record Preview**.
4. Save `iaap-assurance-synthetic-decision-record.json`. Rename a retained copy with the scenario name if comparing several runs.
5. Inspect the downloaded record's request, resource, decision, outcome, reason, and digest fields against the screen.

Export belongs to the detailed active runtime scenario, not all three request cards. It is a synthetic record preview. Downloading it does not put evidence in an independent custodian's durable store.

Sentry and the custody replay do not expose that Shield record-export control. Do not describe a Shield export as proof from another view.

## 7 Complete the custody exercise

1. Select **Protected Data Custody** and **Authorized Access**.
2. Inspect the READ request, object, parent, purpose, subject, recipient, destination, retention floor, request digest, and delegated authority digest.
3. Confirm **ALLOW** with reason **AUTHORIZED**, along with the displayed attenuation and custody checks.
4. Select **Authorized Transfer**. Inspect the child object's parent reference and inherited restrictions. Confirm the fixed transfer outcome is allowed.
5. Select **Broaden Delegation**. Confirm attenuation fails and the result is **DENY**, reason `DELEGATION_BROADENED`.
6. Select **Suppress Audit**. Confirm **DENY**, reason `AUDIT_SUPPRESSION_ATTEMPT`, and that the attempted suppression is represented in the audit path.
7. Review the engine, policy, and adapter identities under **Provenance**.

These steps replay accepted fixed examples. They do not read or transfer real protected data. Verified labels refer to the synthetic proof, not the present condition of a production service.

## 8 Read the Assurance Portal

Open [Assurance Portal](https://infrastructureproductworks.com/assurance/portal/).

1. Wait for the published request records to verify. The summary counts only the loaded requests.
2. Choose **Management and leadership**, **Security and operations**, or **Governance and evidence**. These choices change the explanation and emphasis; they do not grant access or approval authority.
3. Use **Show requests** to find items needing attention, waiting for approval, stopped before action, applied in the simulation, or rolled back. Summary totals continue to cover the full loaded set.
4. Read the request, decision, action, reason, next step, and responsible role. Individual assignments are not recorded.
5. Open **Decision record and source evidence** to inspect the exact request, fingerprints, original record, and pinned source revision.
6. In the Assurance demo, select **Export requests for Portal** to download the three independent request records. Use **Import demo records** in the Portal to load that file. You can also import a single record exported from the active Shield scenario, including rollback.
7. An import replaces the loaded snapshot only after every record passes verification. A changed record, unknown source, duplicate request, conflicting result, or oversized file is rejected; the previous verified set remains visible. Only the published synthetic source catalog is supported.
8. Use **Export loaded records** to retain the verified source records, or **Load published examples** to restore the three-request snapshot. The browser does not upload imported files or persist the loaded set across reloads.
9. Below the request snapshot, inspect the separate historical service proofs. Select **Runtime Reconciliation Proof** or **Protected Storage Predeployment Proof** to read their fixed authority summaries and timelines.

**Request to decision** is the interval between the recorded request timestamp and evaluation timestamp. **Time since decision** is measured at the fixed snapshot time. Neither measures delivery time, review waiting time, or present queue age. The examples cannot establish an improvement in delivery speed.

**NOT OBSERVED** means the Portal has no service-health observation. **NOT MODELED** means a value such as cost is not modeled. Neither means healthy, zero cost, or failed. **SEPARATE PROOF** and **SEPARATE PROOFS VERIFIED** do not claim a continuous transaction across Gates 3, 5, and 6.

Historical service review counts remain separate from the loaded request summary. Request IDs are local to the Assurance demonstration; similar IDs in Console do not establish a shared transaction. A matching fingerprint proves record integrity within the pinned synthetic catalog, not a production signature, live authority, or independent custody.

## 9 Troubleshooting and completion

**The result did not change.** Confirm the intended view and scenario are selected. In Shield, use Run Assurance Gate after checking the active scenario label.

**The dates appear expired.** Compare the validity window with the displayed fixture clock. The demonstration intentionally uses recorded times.

**A downloaded record seems wrong.** Return to Shield, select the required scenario, wait for its result, and export again. Preserve each scenario's file under a distinct name.

**Cryptography or evaluation is unavailable.** Use the HTTPS page in a current browser. Retain the error for the product owner if it persists; do not treat an incomplete view as a successful evaluation.

You have completed the current Assurance workflow when you can explain the Sentry correction, the Shield allowed and denied paths, the rollback result, the four custody cases, the exported runtime record, and the Portal's observation limits.

An operational Console-to-human-to-Assurance path still requires an authenticated, scoped Authority Package and a separately accepted runtime integration. A Console note or export does not create that authority.

## References

- [Assurance demo](https://infrastructureproductworks.com/assurance/demo/)
- [Assurance Portal](https://infrastructureproductworks.com/assurance/portal/)
- [Assurance product overview](https://infrastructureproductworks.com/assurance/)


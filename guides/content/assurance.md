# IaaP Assurance User Guide

End to end instructions for Sentry Shield custody and Portal

Infrastructure Product Works | Version 1.2 | September 24, 2026

Use this guide to inspect a predeployment decision, evaluate bounded runtime authority, replay protected-data custody outcomes, and follow exported decisions into the Portal. The Portal includes instructions for Management and leadership, Security and operations, and Governance and evidence. All examples in these interfaces are synthetic.

## 1 Open Assurance and understand the views

Open the [Assurance demo](https://infrastructureproductworks.com/assurance/demo/). It uses preloaded fixtures and requires no credentials, customer records, or uploaded Authority Package.

| View | Current capability |
| --- | --- |
| Sentry · Predeployment | Proposed operating-profile preview using the protected-storage policy example. |
| Shield · Runtime | Interactive browser simulation of bounded Gate 5 runtime reconciliation. |
| Protected Data Custody | Replay of fixed Gate 6 custody proof outcomes. |
| Assurance Portal | Verified demo request records with audience views, filters, local import/export, and separate historical service proofs. |

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

Read **In plain language**, **What happened**, **Why**, and **Next step** alongside each card's original result, reason code, and record fingerprint. A request waiting for approval has made no change. An applied synthetic change does not establish that an infrastructure order has been delivered.

Use **Export requests for Portal** to retain all three independent records. This differs from **Export Record Preview**, which retains the one active Shield scenario. Section 9 walks through both paths into the Portal.

The same order numbers may appear in Console. Matching labels do not establish a connected transaction between these public demos.

## 6 Export the runtime decision record

1. In **Shield · Runtime**, select the scenario whose result you need to retain.
2. Confirm evaluation has completed and read the final decision and action outcome.
3. Select **Export Record Preview**.
4. Save `iaap-assurance-synthetic-decision-record.json`. Rename a retained copy with the scenario name if comparing several runs.
5. Inspect the downloaded record's request, resource, decision, outcome, reason, and digest fields against the screen.

Export belongs to the detailed active runtime scenario, not all three request cards. It is a synthetic record preview. Downloading it does not put evidence in an independent custodian's durable store.

You can import this unchanged file into the Portal to read the same decision through each audience view. The Portal also accepts the separate three-request bundle; see section 9.

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

1. Start at **What happened, what needs attention, and why.** Wait for the status to confirm **3 records verified**. Read the scope and recorded snapshot time.
2. Check the published totals: **Requests loaded: 3**, **Synthetic change verified: 1**, **Waiting for approval: 1**, **Stopped before action: 1**, and **Rolled back: 0**. These totals change when a different verified file is imported.
3. In **View for**, choose your audience. Follow the procedure below for that view.
4. In **Show requests**, choose **Needs attention**. The published set shows ORDER-483 and ORDER-484 while the summary totals remain for all three loaded requests. Choose **All requests** to restore all cards.
5. Read the requested change, what happened, why, next step, and responsible role. Open **Decision record and source evidence** when you need the original decision and its source.

The three audience choices change presentation. They are available without a role-specific sign-in and do not assign work, grant access, or create approval authority.

### Management and leadership

1. Choose **Management and leadership** and review the counts for the full loaded snapshot.
2. Filter to **Needs attention**. Identify which request stopped and which needs an independent approver.
3. Read **Next step** and **Responsible role** for each. Explain what needs to happen next without treating the displayed role as an assignment to a named person.
4. Return to **All requests** and read **Delivery** on the applied request. It remains **Not observed** even though the synthetic change was verified.
5. Read the timing definitions below before quoting the median or elapsed intervals.

**Finished output:** a plain-language account of the loaded requests, the items needing attention, and the missing delivery information. Any real follow-up or assignment takes place in the accountable operating process outside this demo.

### Security and operations

1. Choose **Security and operations**. Use **Stopped before action** to inspect ORDER-483, then **Waiting for approval** to inspect ORDER-484.
2. Read **Resource** and **Action performed**, then compare the explanation with the original decision, action outcome, and reason code under **Decision record and source evidence**.
3. For expired authority, confirm no action occurred and the requester needs fresh authority. For missing approvals, confirm no action occurred and an **Authorized independent approver** is the next responsible role.
4. Complete the rollback import exercise in section 9. Choose **Rolled back** and confirm the next role is **Service operator** and the original result is **ALLOW · ROLLED BACK**.
5. Retain the loaded records and identify the exact request and unresolved issue for follow-up. The Portal has no approve, retry, repair, or execute control.

**Finished output:** an explanation tied to the request, resource, reason, action outcome, and next responsible role. A stopped request and a rolled-back attempt require different follow-up.

### Governance and evidence

1. Choose **Governance and evidence**, then **All requests**.
2. Read **Evidence** on each card. Verification covers record integrity and membership in the published synthetic catalog; independent custody is not established by the page.
3. Open **Decision record and source evidence**. Compare the request, complete record fingerprint, authority fingerprint, evaluation time, source revision, source path, and original JSON.
4. Use **Export loaded records** to retain the full verified set. A display filter does not limit the export to visible cards.
5. Reimport that export as described in section 9 and compare request identities, original results, and record fingerprints.

**Finished output:** the verified synthetic source records and an explanation of their provenance and limits. A matching fingerprint does not establish a production signature, live authority, or independent retained custody.

### Understand responsibility and timing

| Example | Responsible role shown | What the next step means |
| --- | --- | --- |
| ORDER-482, synthetic change applied | No action required | No further review is needed for this fixture result; delivery is still unobserved. |
| ORDER-483, authority expired | Requester | Obtain fresh authority before submitting again. |
| ORDER-484, required approval missing | Authorized independent approver | Review through the authorized process before a new evaluation. |
| Imported Fail Verification result | Service operator | Investigate the failed verification before another attempt. |

Individual assignments are not recorded. Selecting an audience does not make the current user the responsible role.

**Request to decision** is the interval between the recorded request timestamp and evaluation timestamp. **Median request to decision** uses every loaded request, including stopped requests; the published three-request set shows **5 min**. **Time since decision** is measured at the fixed snapshot time. These values do not measure delivery time, review waiting time, or present queue age. The examples cannot establish an improvement in delivery speed.

## 9 Transfer records from the demo to the Portal

### Import the three independent requests

1. Open the Assurance demo and select **Shield · Runtime**. Wait for the three request cards to finish evaluating.
2. Select **Export requests for Portal**. Save `iaap-assurance-request-set.json` unchanged.
3. Open the Assurance Portal. After its published records verify, use **Import demo records (JSON, up to 100 KB)** to select that file.
4. Wait for **Imported file: 3 records verified**. Compare ORDER-482, ORDER-483, and ORDER-484 with their original demo results.
5. Try an audience view and a request filter. Confirm that the original decisions stay the same and summary totals still describe all three loaded requests.
6. Select **Export loaded records**. Save `iaap-assurance-verified-request-set.json`. This retains the complete loaded set with the original record identities and fingerprints.
7. Import that exported file again. Confirm three verified records and the same request results and fingerprints.

### Import a single rollback result

1. Return to **Shield · Runtime**, choose **Fail Verification**, and wait for **ALLOW · ROLLED BACK** with reason `VERIFICATION_FAILED_ROLLBACK_SUCCEEDED`.
2. Select **Export Record Preview** and save `iaap-assurance-synthetic-decision-record.json`.
3. Import that file into the Portal. A successful import replaces the three-request snapshot with **1** loaded record and **1** rolled-back result; it does not append a fourth request.
4. Choose **Security and operations** and **Rolled back**. Read the failed-verification explanation, the **Service operator** role, and the original decision record. If a previous filter hides the card, choose **All requests** or **Rolled back**.
5. Select **Load published examples** and then **All requests** to restore the original three-request view.

The bundle export always contains the three independent request cards. Changing the detailed Shield scenario affects its single-record export, not that bundle.

### Know what import verification accepts

The Portal accepts an unchanged demo decision record or a supported request bundle containing **1–50 records**, within **100 KB**. Every record must belong to the published synthetic source catalog and retain its verified contents and fingerprint. The limit does not mean that arbitrary new requests or production records can be imported.

Changed records, unknown sources, unsupported formats, duplicate requests, conflicting results for one request, and oversized files are rejected. Even a changed record with a recomputed fingerprint is not a new trusted decision. The previous verified set stays visible until the entire replacement passes.

Files are checked locally in the browser. Import does not upload the file, authorize an action, or save the snapshot across reloads. Reloading starts with the published examples. Retain an export if you need to revisit a supported snapshot.

## 10 Inspect the separate historical service proofs

Below the request snapshot, select **Runtime Reconciliation Proof**, then **Protected Storage Predeployment Proof**. Read each fixed authority summary, timeline, evidence coverage, and historical review state.

**NOT OBSERVED** means the Portal has no service-health observation. **NOT MODELED** means a value such as cost is not modeled. Neither means healthy, zero cost, or failed. **SEPARATE PROOF** and **SEPARATE PROOFS VERIFIED** do not claim a continuous transaction across Gates 3, 5, and 6.

Historical service review counts remain separate from the loaded request summary. Importing a request file does not update these historical proofs. Request IDs are local to the Assurance demonstration; similar IDs in Console do not establish a shared transaction.

## 11 Troubleshooting and completion

**The result did not change.** Confirm the intended view and scenario are selected. In Shield, use Run Assurance Gate after checking the active scenario label.

**The dates appear expired.** Compare the validity window with the displayed fixture clock. The demonstration intentionally uses recorded times.

**A downloaded record seems wrong.** Return to Shield, select the required scenario, wait for its result, and export again. Preserve each scenario's file under a distinct name.

**The Portal shows no matching requests.** Choose **All requests**. A filter remains selected when you import or restore a different snapshot. Zero visible cards does not mean zero loaded records.

**Import was rejected.** Read the status message and use an unchanged export from the Assurance demo. Keep within 100 KB and one supported result per request. The last verified set remains displayed; its presence does not mean the rejected file was accepted.

**The counts did not shrink when I filtered.** Summary totals and Export loaded records cover the full loaded set. Filters change only the visible cards.

**The Portal changed after a reload.** Imported snapshots are temporary. Import your retained export again, or use the published examples.

**Explanation unavailable appears.** Do not infer success from a missing explanation. Inspect the technical result and retain the issue for the product owner; unsupported or contradictory result combinations have no verified translation.

**Cryptography or evaluation is unavailable.** Use the HTTPS page in a current browser. Retain the error for the product owner if it persists; do not treat an incomplete view as a successful evaluation.

You have completed the current Assurance workflow when you can explain the Sentry correction, Shield allowed and denied paths, rollback, and four custody cases; use all three Portal audience views; export and reimport the three-request set; inspect a single rollback record; and distinguish recorded decision timing from delivery, live queue age, and the separate historical service proofs.

An operational Console-to-human-to-Assurance path still requires an authenticated, scoped Authority Package and a separately accepted runtime integration. A Console note or export does not create that authority.

## References

- [Assurance demo](https://infrastructureproductworks.com/assurance/demo/)
- [Assurance Portal](https://infrastructureproductworks.com/assurance/portal/)
- [Assurance product overview](https://infrastructureproductworks.com/assurance/)

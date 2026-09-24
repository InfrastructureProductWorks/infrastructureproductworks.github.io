# IaaP Console User Guide

End to end instructions for the evidence review workbench

Infrastructure Product Works | Version 1.1 | September 24, 2026

Use this guide to select a request, review its evidence, record a local review note, export the summary, and recover from an evidence integrity failure. The public workbench contains three independent synthetic developer orders.

Architecture, Security, Platform, Product, and Audit review the same record for different purposes. Section 10 gives each audience a review procedure and expected handoff. These responsibilities do not require a role selector in the demo and do not create approval permissions.

## 1 Open the workbench

Open the [Console demo](https://infrastructureproductworks.com/console/demo/) in a current browser with JavaScript and browser cryptography available. No installation, sign-in, cloud account, or uploaded evidence package is required for this demonstration.

The workbench verifies a package in your browser before presenting it as verified. These are preloaded synthetic packages. The page does not fetch live developer orders from Storefront, accept an arbitrary customer package, or send an approved action to Assurance.

Notes and altered demo state are temporary. Export what you need before closing or reloading the page. Use fictional review notes only.

## 2 Select the correct request

1. Locate the three order buttons above **Evidence Review Workspace**.
2. Select the required order and confirm its order ID, requester, title, and package identity.
3. Wait for verification to finish. Do not interpret **Verification pending** as approval or rejection.
4. Read both the integrity message and the decision state.

| Order | Demonstrated path |
| --- | --- |
| ORDER-482 | Managed Interconnect change with findings requiring human review. |
| ORDER-483 | Routine Application Network order with complete checks and authorized handoff pending. |
| ORDER-484 | Routine Managed Interconnect change with complete checks and authorized handoff pending. |

The order selector changes the active request. The **Review Queue** navigation control returns to the overview of the active request; it does not submit or approve it.

Some secondary product, planning, and evidence text is reused across the current synthetic fixtures. If an order title and secondary context differ, do not interpret that as verified applicability to a real application. Identify the fixture discrepancy in your evaluation notes. This is particularly relevant to the Application Network example.

## 3 Review the package from start to finish

Follow the views in this order for a first review. Either the left navigation or the uppercase view controls can open the corresponding section.

| View | Review task |
| --- | --- |
| OVERVIEW or Review Queue | Read the request purpose, Guard summary, evidence state, and review readiness. |
| FINDINGS or Guard Findings | Read each finding, requirement, status, and supporting context. Identify items marked REVIEW. |
| PRODUCT or Product Context | Confirm the proposed outcome, consumer choices, and platform-owned decisions. |
| PLANNING or Planning Trace | Follow the displayed objective, epic, and feature relationships. |
| TRACEABILITY | Inspect the source revision and producer evidence relationships. |
| EVIDENCE or Evidence Library | Inspect evidence references, requirement IDs, source revisions, package, assessment, profile, and scope. |
| DECISION or Decision State | Read the current stop or handoff state and the authority boundary. |

For ORDER-482, the fixture shows DNS ownership and cost-owner acknowledgment as review items. Identify which accountable domain owner would need to address each point. Console presents the context; it does not perform that person's decision.

A verified digest means the package matches its pinned content. It does not independently prove that a finding is correct, that a profile has been approved for your organization, or that a request may execute.

## 4 Record a review note

1. Confirm you are on the intended order and its evidence is verified.
2. Enter a fictional note in **REVIEW NOTE**. For example: “Confirm DNS ownership and the planning estimate with the accountable domain owners.”
3. Select **Record Review Note**.
4. Confirm the message says the note was recorded locally and that no decision or approval was recorded.
5. If you edit the text afterward, select **Record Review Note** again before exporting.

Typing changes the draft. Export uses the recorded note, so edited draft text is not included until you record it again. A note does not change a Guard verdict, approve a proposal, or remove the human review stop.

## 5 Handle several requests

Select another order using its order button. Its package verification, draft note, recorded note, tamper state, and export belong to that order. Return to the first order to continue its review.

Routine requests can reach **VALIDATED · HANDOFF PENDING** without waiting for an unrelated request's review. The exception remains at **AWAITING HUMAN REVIEW**. The handoff-pending label describes the next authorized boundary; it does not mean the public demo delivered the request or ran infrastructure.

The current three-order demonstration is session behavior. It does not establish authenticated collaboration, durable multi-user queues, reviewer assignments, notifications, or measured throughput.

## 6 Export the review summary

1. Select the order you intend to export.
2. Confirm the package verification state and record the final version of any note.
3. Select **Export Review Summary**.
4. Save the JSON download. The filename includes the order ID, for example `iaap-console-order-482-synthetic-review.json`.
5. Check that the file contains the expected order ID, requester, package ID, assessment ID, verification state, expected and actual digests, decision state, reviewer note, and authority record.

Keep the file associated with the relevant order. A summary export contains review metadata and the recorded note. It does not contain a complete operational assessment package, every underlying evidence file, or an authenticated approval.

The export control can also capture rejected evidence state. In that case, preserve the REJECTED result for troubleshooting and do not present it as verified review evidence.

## 7 Exercise and recover from an integrity failure

1. On a verified synthetic order, record a short test note.
2. Select **Tamper Evidence**. The demonstration changes an evidence reference for the active order.
3. Confirm **EVIDENCE REJECTED** and **DIGEST MISMATCH · FAIL CLOSED**. The altered artifact is visible in the evidence view.
4. Confirm the previously recorded note is invalidated. The message is expected when an existing recorded note is cleared because its package changed.
5. Optionally export this rejected summary as failure evidence.
6. Select **Restore Verified Package** and wait for integrity verification to pass.
7. Read the restored package again. Record a new note if needed, then export the verified summary.

Restoring the package does not restore the earlier recorded note as a valid review. Text that remains in the input box is not proof that it has been recorded for export. Check the note status explicitly.

If no note had been recorded, the page should say that no review note is recorded rather than claim it invalidated one. Tampering with one order does not change the other orders' packages.

## 8 Troubleshooting

**The page stays at verification pending.** Give the cryptographic check time to finish. If it does not, reload the HTTPS page in a current browser after retaining any output already needed. Browser cryptography must be available.

**A note is missing from export.** Select the correct order, check the note status, and record the final text again. A draft, an invalidated note, and a note belonging to another order are different states.

**Package state changed appears.** Treat the note as invalidated. Restore or obtain the intended verified package, review it again, and record a new note.

**The request is validated but has not progressed.** Handoff pending is the current stop for the routine synthetic path. There is no connected approval or execution action to run from this page.

**The package remains rejected after restore.** Preserve the order ID, displayed digests, and failure summary for the product owner. Do not modify the expected digest to make the evidence pass.

## 9 Completion and scope

You have completed the Console demo workflow when you can select the correct order, explain its findings and decision state, trace the evidence, record the intended note, and retain the correct per-order summary. Follow your accountable review process outside this demo for any real decision.

The customer-hosted Console codebase also contains separately versioned projections for planning, evidence, catalog, operations, access visibility, retention previews, health, and outcomes. Those deployment-specific modules are not all exposed by this public workbench. Use the accepted distribution's instructions and profile when evaluating them; the controls in this guide describe the public workbench.

## 10 Role specific review procedures

Choose the procedure that matches your responsibility. All reviewers first select the exact order and verify its package using sections 2 and 3. If verification fails, preserve the failure and follow section 7 before continuing. Reviewers use the same evidence; the public workbench does not provide separate authenticated role workspaces, role assignment, or a shared review record.

The procedures below translate the documented review audiences into tasks using the existing screens. They do not imply that the application enforces those job responsibilities.

### Security reviewer

1. Open **FINDINGS** and identify security requirements, control-related findings, and any item requiring review. In ORDER-482, inspect SEC-014, **Encryption and workload identity remain mandatory**.
2. Open **EVIDENCE** and match the requirement to its evidence reference, source revision, assessment, profile, and scope. In the fixture, EVD-102 references SEC-014 and `security-envelope.synthetic.json`. This is an evidence reference, not a claim that the underlying operational file was downloaded or assessed here.
3. Open **TRACEABILITY** and confirm that the displayed source and package context belong to the selected request. Treat missing, inconsistent, or synthetic-only information as a review limitation.
4. Check **PRODUCT** and **DECISION** for the proposed change and its authority boundary. A PASS finding or the marker **No control weakening detected** does not establish risk acceptance, an exception, or permission to execute.
5. Record a note naming the requirement, evidence reference, unresolved question, and responsible owner. Example: “Security review: SEC-014 maps to EVD-102 in this synthetic package. Confirm the required operational encryption and workload-identity evidence before a real decision.”
6. Export the selected order's summary. Hand the exact package identity, note, and unresolved items to the accountable review process. Any actual security approval or exception remains outside this public workbench.

**Finished output:** a source-bound security review note and summary, with evidence gaps explicitly retained.

### Architecture reviewer

1. Open **PRODUCT** and confirm the intended outcome, consumer choices, and platform-owned decisions.
2. Inspect **FINDINGS** for topology, provider behavior, connectivity, DNS, and compatibility concerns relevant to the request. For ORDER-482, distinguish the passing network finding from the DNS ownership item still marked REVIEW.
3. Follow **TRACEABILITY** and **PLANNING** to the supplied source and work relationships. Do not fill missing architecture or planning relationships by inference.
4. Record the proposed design disposition, open dependencies, and domain owners as review context. Export the summary and pass unresolved Network or DNS questions to the accountable owner through the established process.

**Finished output:** a design review note tied to the exact request, including unresolved architecture dependencies. The note is not an architecture approval.

### Platform reviewer

1. Inspect **PRODUCT** for supported behavior and responsibilities retained by the platform.
2. Use **FINDINGS**, **EVIDENCE**, and **TRACEABILITY** to check the supplied implementation evidence and revision. Flag the fixture context mismatch described in section 2 if encountered.
3. Open **DECISION** and distinguish **AWAITING HUMAN REVIEW** from **VALIDATED · HANDOFF PENDING**. Identify the next responsible owner without treating either label as deployment.
4. Record missing implementation evidence and handoff prerequisites. Export the summary for the platform's change process; this page cannot merge, apply, reconcile, or provision the change.

**Finished output:** an implementation review note and a clear account of what is still needed before an authorized handoff.

### Product reviewer

1. Confirm the order, requester, and consumer outcome in **OVERVIEW** and **PRODUCT**.
2. Follow **PLANNING** to the supplied objective, epic, and feature. Check whether the proposed work supports that outcome; preserve any missing relationships.
3. Inspect **FINDINGS** for owner acknowledgments or cost questions. ORDER-482 includes a planning estimate requiring cost-owner acknowledgment. Use the established process to obtain that owner's input.
4. Record the outcome, open business questions, and responsible owners. Export the summary for the product review process. Console does not commit backlog work, approve spending, or make the owner acknowledgment on another person's behalf.

**Finished output:** a product review note linking the request to the supplied planning context and outstanding business decisions.

### Audit or assessor reviewer

1. Identify the order, package, assessment, profile, and scope in **OVERVIEW** and **EVIDENCE**.
2. Follow **TRACEABILITY** and compare source revisions, evidence references, and displayed digests. Record missing or inconsistent provenance.
3. Inspect **DECISION** and distinguish verified content from human authorization. A recorded local note is not an authenticated approval record.
4. Export the summary and retain its verification state and digests with the review record. Identify any underlying evidence files or accountable decisions still needed. The export contains metadata and the note, not a complete assessor evidence package.

**Finished output:** an evidence inventory and traceability summary that states what was inspected and what remains unavailable.

### Separate role and capability demonstration

The customer-hosted Console validation distribution also contains a display-only access-control projection. Its labels describe sample capability groupings, rather than the five review audiences above.

| Illustrative role | Visibility described in FULL_VISIBILITY |
| --- | --- |
| Portfolio viewer | Guard assessments, planning outputs, and evidence metadata. |
| Human reviewer | The portfolio viewer capabilities plus human-review queues. |
| Operations viewer | Operations posture. |
| Forge viewer | Forge catalog and lifecycle, aggregate outcomes, FoundationTarget visibility, and optional integration posture. |

When evaluating that distribution, verify the selected runtime profile, inspect the listed roles and capabilities, and confirm **DISPLAY_ONLY**, default **DENY**, and **UNASSIGNED** roles. GUARD_ONLY physically excludes Forge and integration capabilities. Authentication, identity-provider connection, role assignment, and access enforcement are not implemented by this projection. It has no assign-role or grant-access procedure and is not a Security login. These controls are not exposed by the public demo described in sections 1 through 9.

## References

- [Console workbench](https://infrastructureproductworks.com/console/demo/)
- [Console product overview](https://infrastructureproductworks.com/console/)

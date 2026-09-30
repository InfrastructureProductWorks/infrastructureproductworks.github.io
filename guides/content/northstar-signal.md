# Northstar Signal User Guide

Infrastructure Product Works | Synthetic evaluation experience

## 1 Start with your cloud platform outcomes
Open the [Northstar Signal synthetic demo](/northstar-signal/demo/). The default Leadership view opens on **Cloud Platform OKRs** so the accountable leader begins with outcomes rather than a product request.

Use only fictional information. The public demo does not connect to enterprise systems, approve funding, provision cloud resources, accept risk, or create production work.

The dashboard can contain multiple approved Objectives. Select an Objective to focus its Key Results, then use the available lineage/drill actions to move into the selected KR, decision/CAR, Epic, evidence, or outcome context. At least one synthetic Objective exposes a current CAR so you can follow a complete golden path.

Review the Objective, each Key Result, its evidence source, and the current status shown by the synthetic fixture. The current public demo does not expose numeric baseline, target, or observed-benefit values. Delivery progress and Key Result status are intentionally separate.

## 2 Draft an OKR from leadership intent
Open **OKR Composer** from the left navigation or the composer action on the leadership dashboard.

Review or replace the plain-language leadership-intent text to explore the authoring surface. In the current public demo, the proposal itself is a fixed synthetic fixture; changing the textarea does not regenerate the Objective or Key Results. The fixture demonstrates the intended Composite AI boundary without calling a live model provider.

Composite AI does **not** decide strategy, approve an OKR, authorize spending, create execution authority, or write to an external system.

## 3 Validate the proposed OKR
Review the deterministic validation results shown outside the model boundary.

Northstar displays deterministic validation against the fixed synthetic proposal. The validation demonstrates checks for outcome orientation, measurable Key Results, time boundary, ownership, evidence source, ambiguity, and activity-versus-outcome separation. It does not prove live validation of newly typed intent.

Resolve structural warnings before treating the draft as leadership-ready. A model-generated draft is not accepted merely because it sounds reasonable.

## 4 Accept, edit, or reject the draft
The accountable leader remains the decision-maker.

Use the demo controls to accept the fixed synthetic proposal or start the composer over. The current demo does not provide free-form editing of the generated Objective or Key Results. Acceptance records the synthetic proposal for the demonstration; it does not create funding, procurement, risk acceptance, or provisioning authority.

## 5 Review the leadership decision
Open **Leadership detail** and **Decision**.

Compare the synthetic Reuse, Build, Phase, Defer, and Redirect paths. Review organizational scope, capability/reuse context, evidence confidence, investment/TCO assumptions, expected benefit, constraints, and the relationship between the proposed capability and the Key Result it is intended to support.

The decision record keeps the outcome attached to the proposed product direction so downstream work cannot silently redefine why the work exists.

## 6 Review the authorization queue
Open **Authorization Queue**.

Each candidate item is reviewed independently. Selecting multiple eligible items creates a review package, not blanket authority. An item that is blocked remains blocked even when it is selected beside eligible items.

Inspect the exact item, decision context, scope, constraints, evidence references, and immutable coordinates before confirming an authorization package.

## 7 Understand what authorization creates
The synthetic authorization ceremony demonstrates how a Capability Authorization Record, or CAR, is bounded.

Authorization is tied to the exact reviewed item and its decision context. The record preserves the authorized scope, constraints, evidence references, accountable human confirmation, and immutable identifiers needed to detect substitution or cross-context reuse.

Changing the item, expanding its scope, substituting a proposal, or reusing authorization in another context requires a new valid decision path. A CAR does not grant general platform, funding, procurement, risk-acceptance, or cloud-execution authority.

## 8 Inspect evidence and lineage
Open **Evidence** and use the authorization-trail controls where available. Then open **End-to-End Traceability** to inspect the selected strategy-to-Assurance path.

Follow the synthetic lineage from Objective and Key Result through decision evidence, authorization, backlog handoff, delivery evidence, and benefit feedback. The demo keeps these records distinct so one stage cannot overwrite the meaning of another.

Use the evidence view to answer: what was proposed, what evidence supported it, what was actually authorized, what work inherited that authorization, and what later evidence measured the result?

In **End-to-End Traceability**, choose the Objective you want to inspect, select its Key Result, and drill into the nodes that have actual bindings. You can move between leadership, management, authorization, evidence, backlog, and outcome context without changing which source owns an already accepted artifact.

A useful check is to browse one Objective after accepting an Epic from another. The accepted Epic should remain attached to its original Objective/KR and must not appear as evidence for the Objective you merely browsed. Return to the original Objective and Northstar should recover the accepted Epic from its saved source binding.

In **End-to-End Traceability**, review the current selected Objective/KR path and its candidate/bound tuple. **Current lineage** shows only bindings that actually exist. The synthetic **Wrong KR replay**, **Stale revision**, and **Authority expansion** controls mutate the candidate tuple so you can see Northstar fail closed. Choose **Current lineage** afterward to reset the demonstration.

Direction matters: authority and constraints propagate downward toward delivery; evidence and observations return upward. A current CAR and accepted Epic can make a path **READY FOR ASSURANCE**, but Northstar does not display Assurance evidence as verified until an actual Assurance evidence record is bound. Product context likewise remains **NOT BOUND** until a source-owned product record exists.

## 9 Compose management Epics from authorized KRs
Switch to **Management** and open **Management Composer**.

Enter management intent in the text box. Describe the Epic outcome, sequencing, dependencies, or decomposition you want Composite AI to propose. The synthetic demo uses that exact text as part of the proposal binding; changing the intent invalidates stale proposal and acceptance state. The current public demo uses bounded synthetic proposal fixtures and does not call a live model provider.

Select one or more **currently authorized KRs**. The list is the current CAR-backed management pool; it is not limited to whichever Objective/KR you happened to browse most recently. Each selected KR keeps its own Objective, Key Result, decision, CAR, package digest, evidence digest, authorized outcome, and authorized scope. Selecting multiple KRs does not merge the CARs or widen authority.

Choose **Propose Epics with Composite AI**. For a single selected KR, the proposal must stay within that KR's authorized outcome and scope. For multiple selected KRs, the demo can propose one cross-KR Epic, but deterministic validation requires every source binding to remain independently attributable.

Review the deterministic validation results before accepting an Epic. In the current synthetic demo the checks cover source lineage, scope binding, reuse/equivalence, evidence requirements, and authority expansion. Management remains accountable for accepting the proposal.

If management intent, the selected KR set, or any actual source CAR/package/evidence binding changes, Northstar invalidates the stale proposal or acceptance. Reauthorizing a source therefore requires fresh management acceptance before a handoff can continue. Authorizing an unrelated Objective/KR does not invalidate an Epic whose saved sources did not change. Changing an unrelated page-context authorization does not invalidate an Epic that is not sourced from it.

## 10 Review the bounded backlog handoff
After management accepts an Epic, open **Backlog handoff**.

Review the handoff package before confirming it. The package is reconstructed from the accepted Epic's saved source bindings, not from whichever Objective/KR is currently open elsewhere in the demo. For multi-KR composition, verify that every source retains its independent **Objective → KR → Decision → CAR** lineage. The handoff can carry one management Epic while preserving multiple independent authorization records; it does not create new authority beyond the selected source scopes.

Choose the synthetic execution target to inspect the adapter boundary. The demo can represent Jira, Azure DevOps, or GitHub Issues as bounded targets, but it does not write to those systems.

A current CAR alone does not create backlog authority. Northstar requires current source bindings, explicit management acceptance, and the separate handoff package before the execution boundary is represented as ready.

The demo shows a bounded Epic-level handoff. It does not write to Jira, Azure DevOps, ServiceNow, GitHub, or another external backlog. Future adapters may carry the handoff into those systems without allowing the backlog to rewrite upstream strategy or authorization.

## 11 Follow delivery without confusing activity with benefit
Switch to **Delivery** and move the scenario to **Delivery Complete**.

Delivery can complete the authorized work and produce delivery evidence. That state does not automatically mark the Key Result achieved.

Northstar deliberately prevents ticket completion, deployment completion, or product release from masquerading as outcome attainment.

## 12 Measure the benefit
Move the scenario to **Benefit Measured** and open **Benefit feedback**.

Review the status-only benefit feedback shown by the current synthetic fixture. The demo does not expose numeric baseline, target, or observed-benefit values, so it does not support a quantitative before-and-after comparison yet. Its purpose here is to demonstrate that benefit feedback remains separate from backlog completion.

This demonstrates the intended loop from leadership intent toward outcome evidence while preserving the distinction between decision, authorization, execution, and benefit status.

## 13 Understand the current strategy path
The current Northstar experience intentionally keeps the visible strategy path direct:

**Objective → Key Result → Decision / CAR → Epic → Delivery / Evidence → Outcome**

A separate Strategic Outcomes workspace is not part of the current demo journey. That concept may be revisited as a future capability, but users should not expect an extra Strategic Outcomes navigation layer between OKRs and decisions today.

## 14 Know where the demo stops
The public Northstar Signal experience is documentation-first and synthetic.

It does not use live enterprise data, live Composite AI providers, production credentials, personnel decisions, funding authority, procurement authority, risk acceptance, external-system writeback, cloud execution, or provisioning.

The demo proves the interaction model and bounded contracts. Any future live adapter or execution path must preserve those authority boundaries rather than bypass them.

## 15 Troubleshooting
If the demo appears to be on the wrong step, return to **Cloud Platform OKRs**, choose the Leadership role, and select **Decision Review**.

If the OKR Composer is not visible, use the left navigation and choose **OKR Composer**.

For management decomposition, choose **Management Composer**. The next step depends on the selected KR's authorization state:

- If the KR has an **eligible decision that is still pending authorization**, complete that exact authorization package first, then return to Management Composer.
- If the KR has **no authorization decision**, return to Leadership/Decision context or select a different KR that already has a valid authorization path. Northstar cannot create an executable Epic package from an undefined authorization.
- If the decision is a locked **Reuse Existing** or **Deferred** fixture, treat it as non-authorizable in the current demo. Do not look for an authorization-continuation button; select an eligible authorized KR if management decomposition is needed.
- If one or more source KRs already have current CARs, Management Composer automatically lists every current CAR-backed KR available to the management scope, regardless of which KR is selected elsewhere in the demo. Enter management intent, select one or more authorized KRs, choose **Propose Epics with Composite AI**, review deterministic validation, and explicitly accept the proposed Epic before moving to **Backlog handoff**. Composite AI drafts only from the exact selected authorization set.

If the intent text or selected source set changes, Northstar removes stale proposal/acceptance state. If an actual source CAR/package/evidence binding changes, management must regenerate or reaccept the proposal. A change to an unrelated authorization does not invalidate an Epic that is not sourced from it.

Selecting a blocked or non-authorizable item beside eligible items never makes it eligible and never widens another CAR.

If a link or control does not behave as described, return to the [Northstar Signal product page](/northstar-signal/) and reopen the synthetic demo.
# Northstar Signal User Guide

Infrastructure Product Works | Synthetic evaluation experience

## 1 Start with your cloud platform outcomes
Open the [Northstar Signal synthetic demo](/northstar-signal/demo/). The default Leadership view opens on **Cloud Platform OKRs** so the accountable leader begins with outcomes rather than a product request.

Use only fictional information. The public demo does not connect to enterprise systems, approve funding, provision cloud resources, accept risk, or create production work.

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

Compare the synthetic Reuse, Build, and Defer paths. Review evidence confidence, mission consequence, investment context, constraints, and the relationship between the proposed capability and the Key Result it is intended to support.

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
Open **Evidence** and use the authorization-trail controls where available.

Follow the synthetic lineage from Objective and Key Result through decision evidence, authorization, backlog handoff, delivery evidence, and benefit feedback. The demo keeps these records distinct so one stage cannot overwrite the meaning of another.

Use the evidence view to answer: what was proposed, what evidence supported it, what was actually authorized, what work inherited that authorization, and what later evidence measured the result?

## 9 Review the management handoff
Switch to **Management** or open **Backlog handoff**.

Management translates the authorized outcome into executable work while preserving the upstream Objective, Key Result, CAR constraints, dependencies, evidence requirements, and accountability.

The demo shows a bounded Epic-level handoff. It does not write to Jira, Azure DevOps, ServiceNow, or another external backlog. Future adapters may carry the handoff into those systems without allowing the backlog to rewrite the upstream authorization.

## 10 Follow delivery without confusing activity with benefit
Switch to **Delivery** and move the scenario to **Delivery Complete**.

Delivery can complete the authorized work and produce delivery evidence. That state does not automatically mark the Key Result achieved.

Northstar deliberately prevents ticket completion, deployment completion, or product release from masquerading as outcome attainment.

## 11 Measure the benefit
Move the scenario to **Benefit Measured** and open **Benefit feedback**.

Review the status-only benefit feedback shown by the current synthetic fixture. The demo does not expose numeric baseline, target, or observed-benefit values, so it does not support a quantitative before-and-after comparison yet. Its purpose here is to demonstrate that benefit feedback remains separate from backlog completion.

This demonstrates the intended loop from leadership intent toward outcome evidence while preserving the distinction between decision, authorization, execution, and benefit status.

## 12 Know where the demo stops
The public Northstar Signal experience is documentation-first and synthetic.

It does not use live enterprise data, live Composite AI providers, production credentials, personnel decisions, funding authority, procurement authority, risk acceptance, external-system writeback, cloud execution, or provisioning.

The demo proves the interaction model and bounded contracts. Any future live adapter or execution path must preserve those authority boundaries rather than bypass them.

## 13 Troubleshooting
If the demo appears to be on the wrong step, return to **Cloud Platform OKRs**, choose the Leadership role, and select **Decision Review**.

If the OKR Composer is not visible, use the left navigation and choose **OKR Composer**. For management decomposition, choose **Management Composer** in the role controls or left navigation. The Management Composer automatically lists every current CAR-backed Key Result available to the management scope, regardless of which Key Result is currently selected elsewhere in the demo. Select one or more authorized KRs and provide management intent; Composite AI drafts only from that exact selected authorization set. If no current CAR-backed KR is available, the Composer remains visible but fails closed: it offers no Epic proposal, no management acceptance, and no BHP. Complete the exact authorization package, return to Management Composer, generate the bounded Composite AI Epic proposals, review deterministic CAR/reuse validation, and explicitly accept the selected Epic. If the current CAR/package digest changes, that management acceptance is invalid and must be performed again. If an authorization item cannot be confirmed, inspect whether that item is intentionally blocked; selecting it with other items does not make it eligible.

If a link or control does not behave as described, return to the [Northstar Signal product page](/northstar-signal/) and reopen the synthetic demo.
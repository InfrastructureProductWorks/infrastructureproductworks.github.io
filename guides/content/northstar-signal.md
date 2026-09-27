# Northstar Signal User Guide

Infrastructure Product Works | Synthetic evaluation experience

## 1 Start with your division outcomes
Open the [Northstar Signal synthetic demo](/northstar-signal/demo/). The default Leadership view opens on **My Division OKRs** so the accountable leader begins with outcomes rather than a product request.

Use only fictional information. The public demo does not connect to enterprise systems, approve funding, provision cloud resources, accept risk, or create production work.

Review the Objective, each Key Result, its baseline and target, the evidence source, and the current measurement state. Delivery progress and Key Result attainment are intentionally separate.

## 2 Draft an OKR from leadership intent
Open **OKR Composer** from the left navigation or the composer action on the leadership dashboard.

Enter or review plain-language leadership intent. Composite AI demonstrates bounded authoring: it can propose an Objective, candidate Key Results, measurable targets, and evidence-source candidates.

Composite AI does **not** decide strategy, approve an OKR, authorize spending, create execution authority, or write to an external system.

## 3 Validate the proposed OKR
Review the deterministic validation results shown outside the model boundary.

Northstar checks whether the draft has an outcome-oriented Objective, measurable Key Results, baseline and target values, a time boundary, accountable ownership, an evidence source, and separation between activity and outcome.

Resolve structural warnings before treating the draft as leadership-ready. A model-generated draft is not accepted merely because it sounds reasonable.

## 4 Accept, edit, or reject the draft
The accountable leader remains the decision-maker.

Use the demo controls to accept the structurally valid proposal, continue editing it, or leave it unaccepted. Acceptance establishes the synthetic leadership intent used by the rest of the demo; it does not create funding, procurement, risk acceptance, or provisioning authority.

## 5 Review the leadership decision
Open **Leadership detail** and **Decision**.

Compare the synthetic reuse, build, phase, defer, or redirect paths. Review evidence confidence, mission consequence, investment context, constraints, and the relationship between the proposed capability and the Key Result it is intended to support.

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

Compare authoritative outcome evidence with the Key Result baseline and target. The measurement source, not backlog status, determines whether the intended benefit has been observed.

This closes the synthetic loop from leadership intent to measurable result while preserving the distinction between decision, authorization, execution, and outcome evidence.

## 12 Know where the demo stops
The public Northstar Signal experience is documentation-first and synthetic.

It does not use live enterprise data, live Composite AI providers, production credentials, personnel decisions, funding authority, procurement authority, risk acceptance, external-system writeback, cloud execution, or provisioning.

The demo proves the interaction model and bounded contracts. Any future live adapter or execution path must preserve those authority boundaries rather than bypass them.

## 13 Troubleshooting
If the demo appears to be on the wrong step, return to **My Division OKRs**, choose the Leadership role, and select **Decision Review**.

If the OKR Composer is not visible, use the left navigation and choose **OKR Composer**. If an authorization item cannot be confirmed, inspect whether that item is intentionally blocked; selecting it with other items does not make it eligible.

If a link or control does not behave as described, return to the [Northstar Signal product page](/northstar-signal/) and reopen the synthetic demo.
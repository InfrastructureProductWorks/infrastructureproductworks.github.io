# Northstar Signal User Guide

Infrastructure Product Works | Synthetic evaluation experience

## Find your way around

On desktop, use the grouped left sidebar: **Strategy**, **Decisions**, and **Delivery & evidence**. The selected destination has a visible accent. On smaller screens the same destinations appear in one horizontally scrollable strip; keyboard users can Tab to every destination.

Open **Demo settings** above the workspace to change the fictional **Leadership**, **Management Composer**, or **Delivery** perspective, or choose **Decision Review**, **Delivery Complete**, or **Benefit Measured**. These controls begin collapsed. Current perspective and scenario stay visible in the workspace header. Changing perspective grants no authority.

In **Funding & Capacity**, the prominent **Open simulated funding workspace** action opens funding entry. **Draft investment proposal** and **Product cost lab** remain available as quieter actions alongside it. Open **Compare funding scenarios** for the approved plan, reduction, deferral and management capacity options. Funding workspace sections use understated navigation with an active underline. Under **Decision history**, open **Workspace options** to find **Reset funding workspace**.


## 1 Start with your cloud platform outcomes
Open the [Northstar Signal synthetic demo](/northstar-signal/demo/). The default Leadership view opens on **Cloud Platform OKRs** so the accountable leader begins with outcomes rather than a product request.

Use only fictional information. The public demo does not connect to enterprise systems, approve funding, provision cloud resources, accept risk, or create production work.

Start with the Leadership attention card, which surfaces the current decision, why it needs review, and whether downstream benefit is proven. The **Review decision** control opens the decision record; it does not approve or authorize anything. Three compact measures summarize Objectives, Key Results, and items needing a decision. Benefit evidence remains visible in the attention card and the related Key Result.

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

The funding-proposal walkthrough can use the explicitly selected OpenAI service with fictional planning data. Other composers use synthetic fixtures. The demo does not use live enterprise finance data, make personnel decisions, grant funding or procurement authority, accept risk, write to external delivery systems, execute cloud changes, or provision resources.

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
## Funding and Capacity dashboard

Validated: October 11, 2026. This is a synthetic planning reference; live financial feeds and funding approvals remain planned.

1. Open **Funding & Capacity** in the demo navigation. The portfolio view shows its own organization, division, period, currency, source, observation date and model revision.
2. Review the funding envelope, allocations and unallocated balance. The forecast funding gap remains **Unavailable** when any investment lacks actual spending or a remaining forecast. The coverage count tells you how many forecasts are known.
3. Select an Objective or **Review** in the decision queue to inspect its Key Results, Epics, estimate basis, source and aggregate capacity in FTE quarters. Spending does not establish a measured benefit.
4. Select **10% less funding** to reduce only the envelope. Existing allocations, spending, commitments and delivery estimates stay the same.
5. Select **Defer EP-FUND-DISCOVERY** to remove the named Epic’s $80,000 uncommitted estimate and one FTE quarter. Open O9 to see the consequence: KR9.3 discovery moves to the next period.
6. Return to **Approved plan** to compare the baseline. Reopening the view resets its temporary scenario. Financial scenarios do not change authorization, management acceptance, backlog handoff or benefit measurement.

Forecast at completion adds actual spending, outstanding commitments not yet spent, and estimated uncommitted remaining costs. Missing amounts remain unavailable rather than zero. These are illustrative figures, not live financial records. The separate funding workspace below simulates exact-version review. Real funding decisions still require authenticated financial authority and durable services.


## Funding entry, Epic ledger, and simulated review

Validated: October 11, 2026. Use fictional information only. This workspace uses browser memory and fictional actor switching; it does not authenticate financial roles, store a durable ledger, import finance data, approve real funding, or change CAR/Epic acceptance.

### Enter a funding package

1. Open **Funding & Capacity**, then **Open simulated funding workspace**. The reference overview keeps its fixed illustrative values; this workspace has separate rollups based on your saved input.
2. Leave **Simulated funding actor** set to **Alex**, the fictional leader. In **1 · Funding entry**, enter a funding envelope and allocations for O9, O10 and O11 in USD. Use at most two decimal places; no dollar sign or commas. Select **Save funding draft**.
3. Review the proposed Objective allocations and reserves. A negative envelope reserve means allocations exceed funding; a negative Objective reserve means Epic allocations exceed that Objective's allocation. You can save and inspect a deficit, but submission will reject it.
4. The initial package has no effective allocation. Its proposed envelope and allocations become effective together only after independent simulated review.

### Estimate and allocate Epic costs

1. Choose **Morgan**, the fictional management estimator, and **2 · Epic ledger**.
2. Select an existing Epic. Enter its allocation, uncommitted remaining estimate, aggregate capacity in FTE quarters, estimate basis, and Objective cost shares. Shares must total 100%; use zero for an Objective that receives no share. Select **Save Epic estimate**.
3. The shared foundation starts with an 80% O9 / 20% O10 split. Its costs enter the portfolio once, and its Objective shares conserve each cent. KR references identify supported outcomes; they do not create extra copies of a cost.
4. To add work, select **Add a new fictional Epic**. Use a unique ID starting **EP-DEMO-**, then supply the title, allocation, remaining estimate, capacity, shares and basis. Select **Add fictional Epic**.
5. New Epics begin with unavailable actuals and commitments. A blank remaining estimate also means unavailable. The ledger keeps complete forecasts unknown until the required evidence exists; missing data never becomes zero.
6. Actuals and commitments are read-only source examples. Each Epic has one aggregate synthetic cost record in this reference. Production itemized cost lines and financial feeds remain planned.

Saved drafts persist while you navigate this page. Unsaved form values survive actor/step changes within the same revision; a successful mutation clears transient input buffers. Save before submitting a package. Reloading the page or resetting the workspace clears all funding state.

### Submit and independently review

1. Choose Alex or Morgan and **3 · Funding review**. Inspect allocations, coverage, reserves and any gaps. Enter a submission rationale of at least 10 characters, then select **Submit exact package**.
2. Review the displayed package ID, revision, finance-source revision and SHA-256 digest. These identify this exact fictional package; they are not a production approval receipt.
3. Choose **Jordan**, the fictional independent financial reviewer. Enter a decision reason and select **Simulate approval** or **Simulate rejection**. Every contributing author is excluded from independent review. Jordan's fictional envelope limit is $2 million.
4. Approval activates the exact package in this workspace. Rejection retains a decision and activates no proposed allocations. Existing effective allocations remain visible separately from the draft.
5. In **5 · Decision history**, inspect decisions and revision events. History records the exact digest and fictional actor/policy/source bindings, but exists only in this browser page's memory.

To see renewed review, choose Alex or Morgan, return to **Funding review**, and select **Start new revision**, or save a material funding/Epic edit. The prior effective package and approval remain retained. Submit and independently approve the replacement before it supersedes the effective package. A changed pending package cannot reuse its old review.

### Reconcile source examples

1. Choose **Casey**, the fictional finance reconciler, and **4 · Reconciliation**.
2. Select **Load complete finance sample** to supply fixed fictional observations. It fills the evidence Epic's missing actual with $40,000 and explicitly attests zero actuals/commitments for newly added Epics. This is a selected sample, not an inference from missing data or a live import.
3. If a package was awaiting review, changing the source invalidates that review. Return to Alex or Morgan and submit the newly bound revision before Jordan can review it. Historical approved allocations stay effective while the projection reads the current synthetic sample.
4. Select **Add unmatched sample cost** to create a fictional $123.45 suspense record. Complete Objective/portfolio forecasts remain unavailable while that record is unmatched.
5. Choose its observation and an Epic with known actuals, then select **Map unmatched sample**. The cost enters the owning Epic once and leaves suspense. The same source identity cannot be ingested or assigned again.

### Return, reset, and production limits

Select **Back to reference overview** to return to the fixed dashboard. Reopening the workspace retains saved page-memory state. In **Decision history → Workspace options**, **Reset funding workspace** restores the fictional baseline and clears every simulated decision. Reload does the same.

Fictional actor switching, client-side digests and in-memory history do not prove real identity, financial authorization, atomic durable storage or restart recovery. Full itemized ledgers, real finance adapters, refunds/cancellations, multi-period changes, customer access and durable approval services remain planned. Funding review stays separate from CAR authorization and management acceptance throughout the demo.

## Leadership investment and management capacity views

Validated: October 11, 2026. These views illustrate planning responsibilities; choosing a view grants no access or approval rights. Live Composite AI investment advice remains planned; the proposal workflow below uses an offline reference provider.

1. Open **Funding & Capacity**. **Leadership investment view** is the default. Review funding, delivery constraints and the consequences for Objectives and KRs. Management owns the staffing details behind these conclusions.
2. Select O9, then **Management capacity view**. Inspect aggregate required/available capacity and the planning queue. Select **Additional capacity proposal** to apply the fixed fictional option: $80,000 additional forecast cost and one FTE quarter available for the full period. Its skills and availability are assumptions, not verified facts.
3. Notice that O9's aggregate capacity gap closes while its forecast exceeds its allocation by $160,000. Actual spending, commitments and allocations are unchanged. More capacity does not mean sufficient funding or proven delivery confidence.
4. Switch to **Leadership investment view**. The scenario and selected Objective remain selected. Leadership sees the additional investment, affordability and delivery consequence without staffing calculations. To change the capacity proposal, return to management; the fixture is illustrative and cannot hire or assign anyone.
5. Compare **Approved plan**, **10% less funding**, and Epic deferral. Missing financial evidence stays unavailable. These scenarios do not alter the separate simulated funding workspace, CAR or management acceptance.

The proposed real capability will use Composite AI to explain source-bound options after deterministic feasibility checks and evaluation. The current reference does not call a live model, verify shared-team capacity, authenticate roles or approve investment.

## Draft an investment proposal into Funding & Capacity

1. Open **Funding & Capacity**, then **Draft investment proposal**. Choose Alex, the simulated leader.
2. Enter an outcome-oriented investment intent, a funding envelope and relative priorities from 1 to 5 for O9 investment decisions, O10 governed reuse and O11 evidence confidence. Use fictional information only.
3. Choose **Offline reference**, then select **Generate investment proposal**. This offline provider retains your intent but does not interpret it with a model. It preserves existing Epic allocations and known cost floors, then divides remaining funding by your explicit priorities. Changing your envelope or priorities changes the proposed allocation.
4. Review proposed Objective amounts, known funding floor, shortfall, finance coverage, alternatives and the management capacity questions. A budget below known floors blocks import. Missing financial evidence stays unknown. Available people, skills, timing and dependencies require management validation; funding does not prove delivery capacity.
5. Revise an input and regenerate, or select **Discard proposal**. Editing the inputs removes the old proposal so it cannot be imported.
6. Select **Add proposal as draft** to update the envelope and Objective allocations together. Northstar independently evaluates the proposal and source binding first. Epic estimates, actuals, commitments and historical effective approvals are preserved. The resulting draft is explicitly incomplete and grants no spending or staffing authority.
7. Review the amounts under **Funding entry**, the costs with management under **Epic ledger**, and the source-bound proposal under **Decision history**. Imported drafts cannot enter funding review while incomplete. Choose Casey and load the complete fictional finance sample; regenerate or rebalance allocations to cover the known forecasts. Choose Morgan under **Epic ledger**, enter available FTE quarters and evidence for people, skills, timing and dependencies, then select **Record simulated management validation**. This is a fictional attestation, not verified staffing data.
8. Only then can the imported draft be submitted for independent financial review. Any later funding, Epic or finance-source change invalidates the management record and blocks review again. Adding a draft itself never approves it.

**Provider status:** OpenAI is available for a controlled fictional walkthrough and is labeled **acceptance pending**. The deployed provider has passed real generation and independent API evaluation; browser session and draft-import acceptance remain open. The offline reference remains a separate deterministic option, and failed OpenAI requests never use a reference fallback. Service credentials stay on the server. Reloading or resetting clears the fictional workspace.

1. Open **Funding & Capacity → Draft investment proposal** and select **OpenAI · walkthrough · acceptance pending**.
2. Use **Sign in to the investment service** to open the same-site HTTPS login in a new tab. Enter the access password configured in Render there; never enter an API key in Northstar.
3. After **Signed in** appears, return to Northstar. Use fictional intent and leave the sample envelope unchanged for the first test.
4. Choose **Generate investment proposal**. Confirm the result identifies OpenAI, gives a recommendation, Objective rationale and alternatives, and remains **INCOMPLETE** where finance or capacity evidence is missing.
5. Choose **Import into draft**. Northstar independently reevaluates the signed proposal before importing only the envelope and Objective allocations. Epic estimates, financial observations and historical decisions must remain unchanged.
6. Confirm submission stays blocked until the separate finance-reconciliation and management-capacity steps are complete. This walkthrough grants no real spending or staffing authority.

If sign-in is requested, the session is absent or expired. If the service is unavailable or a proposal fails validation, stop and retain the error message; no reference proposal should appear.

## Explore composed product costs and carry an estimate into funding

1. Open the [Storefront Product Cost Lab](https://infrastructureproductworks-storefront-44yf.onrender.com/#product-cost-lab), or in Northstar choose **Funding & Capacity → Product cost lab**. Backstage distribution 0.2.1 links to the same hosted calculator.
2. Choose **Cloud Foundation Environment** or **Data Platform Environment**. Both are fictional demo-1 definitions. Foundation includes a landing zone and workload runtime. Data Platform combines the landing zone with data storage, ingestion, processing and backup. Expand **Product dependencies and estimate assumptions** to see shared dependencies; repeated references do not create extra charges.
3. Choose **Create new foundation** for itemized network, identity and logging costs, or **Reuse existing foundation** and enter its monthly cost pool and this product's percentage. The remainder stays with other owners. Reuse is an allocation of existing cost, not new provider spending; suitability and capacity are assumptions in the demo.
4. Adjust monthly teams, runtime/processing instances, hours, data volume, egress, support, enablement and the independent management capacity assumption. Data Platform can include an optional analytics workspace. Selecting cross-region recovery intentionally exposes a missing sample price: the known subtotal stays visible, the complete total is unavailable and funding import is blocked.
5. Select **Calculate scenario** after changes. Default AWS Cloud Foundation shows **$7,290 quarterly cloud cost** and **$22,290 total funding**. Data Platform with a new foundation shows **$7,560 cloud / $22,560 funding**. Reusing a $300/month foundation at 25% yields **$7,335 cloud / $22,335 funding** for Data Platform. These are fictional USD calculations for October–December 2026, not provider quotes. The same configured product can be compared across fictional AWS, Azure and Google Cloud rates.
6. Select **Download scenario** and load the file in Northstar's lab. The receiver checks the exact v2 contract/fixture and product version, then recalculates the composition. Generic v1 files must be recreated. An incomplete scenario can be downloaded for planning, but cannot enter funding until required costs are known.
7. In Northstar choose **Morgan**, then **Add estimate to Epic ledger**. The complete estimate creates one `EP-DEMO-CLOUD-COST`, initially assigned 100% to O9. Inspect **Retained product estimate** in the ledger for the original components, quantities, rates, dependencies and assumptions. Changing the remaining forecast preserves the original estimate and displays the difference. Duplicate imports are blocked; this bounded demo supports one imported product estimate per workspace.
8. Actuals and commitments begin unavailable. Casey can load the fictional finance sample; leadership can rebalance allocations before independent review. Changes invalidate pending review. An estimate grants no financial approval, staffing feasibility, ordering or provisioning authority.

Data Platform is estimate-only; Azure is comparison-only. The released order contract is unchanged. These fixtures are illustrative compositions, not complete bills of services for real deployments. Tax, discounts, reservations and live billing are excluded. Reload/reset clears scenario and workflow history. Shared assets and validation fixtures keep the public demos and application reference aligned; real application product-definition and pricing adoption remain planned.

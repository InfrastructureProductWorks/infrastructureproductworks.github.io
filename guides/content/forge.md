# IaaP Forge User Guide

End to end instructions for the product proposal workbench

Infrastructure Product Works | Version 1.1 | September 24, 2026

Use this guide to inspect the Cloud Foundation Environment product, enter bounded intent, generate a deterministic proposal, and retain its review evidence. The current published workbench ends at **Awaiting human review**.

Forge's product model also gives domain teams ownership of reusable capabilities. Section 9 explains the responsibilities of Security, Network, FinOps, Identity, Data, SRE, Compliance, and Platform teams and how to prepare their contributions. Domain-profile authoring and release are not available as actions in the current preview.

## 1 Open the workbench

Open the [Forge preview](https://iaap-forge-preview.onrender.com/). Allow the hosting service to finish starting if a startup screen appears. The page should show Cloud Foundation Environment, six workbench tabs, and the **Build a bounded proposal** drawer.

Use fictional values. This public preview has no authenticated tenant workspace or durable proposal history. It does not require a model account, cloud credentials, or access to your repositories.

The current public form supports AWS and Google Cloud for a development foundation. The product's broader architecture includes additional capabilities, but this form exposes only the bounded contract described here.

The initial **Awaiting human review** label is the preview's declared workflow boundary. Before you generate evidence, it is not proof that an order already exists. Open Evidence to see whether the session actually contains a proposal.

## 2 Inspect the product before proposing

Use the tabs in the left navigation. On smaller screens, the tabs become a horizontal list. Keyboard users can move through the tab list with arrow keys; Home and End select the first and last tabs.

| Tab | What to inspect |
| --- | --- |
| Overview | Product intent, supported clouds, required gates, and authority boundary. |
| Contract | Customer inputs, platform defaults, input schema, and submission output. |
| Composition | How customer intent, foundation profile, and proposal evidence relate. |
| Guardrails | Supported cloud, approved region, human review, and unavailable execution. |
| Evidence | Generated state, schema, experience, digest, and authority record. |
| Releases | Current preview contract and the independent authorization required for release. |

Composition and Releases are informational views in this workbench. They do not let you change a live composition or publish a release.

## 3 Prepare a valid proposal

Use the **Build a bounded proposal** drawer.

| Field | Sample value | Accepted shape in this form |
| --- | --- | --- |
| Product name | cloud-foundation-demo | 3 to 63 characters; starts with a lowercase letter; lowercase letters, digits, and hyphens. |
| Owner | platform-team | 3 to 63 characters; starts with a lowercase letter; letters, digits, dots, and hyphens; ends in a letter or digit. |
| Cost center | cc-100 | 3 to 32 letters, digits, underscores, or hyphens. |
| Cloud | AWS | AWS or GCP. |
| Approved region | us-east-1 | Choose from the selected cloud's dropdown. |

The current AWS regions are **us-east-1** and **us-west-2**. The current GCP regions are **us-central1** and **us-east1**. Recheck the region after changing clouds; the previous provider's region may be replaced.

Environment is development, profile is standard-dev, and data classification is internal. Those are product defaults rather than editable choices in this form. Storefront has its own narrower approved-region list; do not assume the two interfaces accept identical inputs.

## 4 Generate and inspect proposal evidence

1. Review the five input fields. The defaults provide a valid first synthetic exercise.
2. Select **Generate proposal evidence** once.
3. Wait while the button is disabled and the status says **Generating deterministic evidence**.
4. On success, the workbench selects **Evidence** and says that proposal evidence was generated for this session.
5. Confirm **State: Awaiting human review**, **Schema: forge-submission/v1**, and **Experience: api**.
6. Copy the evidence digest together with the inputs you used.
7. Confirm the displayed authority values are all false: mayApply, mayApprove, mayChangePolicy, mayGrantPrivilege, and mayMerge.
8. Read Releases to understand the current release boundary, then retain the evidence needed for human review outside this preview.

The input contract is `forge-api-order/v1`. The generated result is a proposal record, not an approved deployment. You should not expect an AWS account, GCP project, environment URL, GitHub PR, or provisioned resource from this exercise.

## 5 Compare a second request

1. Retain the first proposal's name, owner, cost center, cloud, region, digest, schema, and state before generating another.
2. Change the product name, for example to cloud-foundation-gcp-demo.
3. Select GCP and an available region.
4. Generate proposal evidence and wait for the successful response.
5. Associate the newly displayed digest with the second set of inputs.

The published preview inspected on September 24 shows one active result and does not expose a proposal queue or history selector. A later successful submission replaces the visible evidence result. Queue enhancements under review are not part of these published-screen instructions.

If a subsequent request fails, an earlier evidence result may remain visible. Read the latest status message and match evidence to the successful submission you retained. Do not treat a previous result as acceptance of an unsuccessful request.

## 6 Retain the result and reset

The current workbench does not provide an evidence download button. Copy the displayed result and input values into your evaluation notes, or capture the relevant screen using your browser or operating system. Keep each proposal under a distinct name.

For each retained record, include:

- product name, owner, cost center, cloud, and region;
- state, schema, experience, and complete evidence digest;
- the displayed all-false authority record; and
- date and the preview URL used for the exercise.

Use **Reset view** when ready to start over. It restores the form defaults, clears the displayed proposal evidence, cancels a pending request, and returns to Overview. Reloading or closing the page also means you should not rely on session evidence being retained.

Resetting the view does not withdraw, roll back, or delete real infrastructure. No infrastructure was created by this workflow.

## 7 Troubleshooting

**The browser rejects the name or owner.** Use the accepted character and length rules. Spaces and uppercase letters are not valid in the product-name and owner fields.

**The desired provider or region is missing.** Use an offered value. The preview form does not expose Azure or arbitrary regions.

**The button stays disabled.** Wait for the response. If you reset the view, the pending request is canceled and any late response should not become the new visible evidence. Retain earlier results before resetting.

**The request is rejected.** Read the status message, correct the input, and generate again. Check the new response before relying on evidence already visible from a prior request.

**There is no proposal in Evidence.** Generate a valid proposal. The initial review-state label alone is not a submission result.

**The service is unavailable.** Preserve the attempted inputs and error for the product owner. A hosting startup screen is not a Forge validation result.

**You need to pass a Storefront order into Forge.** The public preview has no handoff upload control. A separate accepted handoff consumer validates the Storefront envelope and independent issuance record; do not assume entering similar values here proves that consumer path.

## 8 Complete the review handoff

You have completed the current Forge workbench workflow when you have inspected the product contract, generated a valid proposal, retained the exact input and evidence identity, and confirmed its human review state and lack of execution authority.

Provide the retained record through your established review process. This preview does not authenticate an approver, resolve a review, release a product, or execute the proposal. Future connected and customer-hosted workflows require their own accepted deployment and user instructions.

## 9 Role specific product engineering responsibilities

Forge is intended to let domain teams contribute the capabilities they own to a governed infrastructure product. Those responsibilities extend beyond filling out the public proposal form. The enterprise productization documents define this model; the preview currently exposes product information and bounded proposal generation.

The following procedures distinguish work you can perform in the preview from preparation and review performed through your organization's existing controlled process. There is no Security workspace, profile editor, role assignment, or release approval button in this preview.

### Determine your domain contribution

| Domain | Prepare and review |
| --- | --- |
| Security | Define the security profile's encryption, key management, secrets, workload security, scanning, logging, and evidence requirements. Identify the exact profile version and scope for product review. |
| Network | Define connectivity, routing, DNS ownership, segmentation, and high-availability requirements. Identify compatible product and provider contexts and the evidence needed to support them. |
| FinOps | Define allocation and cost-owner requirements, budget or consumption constraints, and cost evidence. State the assumptions and freshness of any estimate; a cost-center field alone does not satisfy the profile. |
| Identity | Define workload identity, access profiles, and federation requirements. Identify the required evidence and ownership boundary; the preview does not establish identities or grant access. |
| Data | Define classification, residency, retention, and data-service requirements. Check whether the product's fixed internal classification and supported regions meet the proposed use. |
| SRE and Observability | Define availability, observability, recovery, and support expectations. Specify the evidence needed to support the product promise; the preview supplies no live telemetry. |
| Compliance | Define applicable control mappings, required evidence, and regulatory constraints. Preserve the exact requirement and mapping versions needed for review. |
| Platform Engineering | Define the product contract, provider implementation, composition, and lifecycle behavior. Assemble exact domain contributions while preserving each domain's ownership and required review. |

These are responsibilities from the documented product model. They are not permission assignments or claims that all profile types have an implemented editor.

### Follow the domain contribution workflow

1. Identify the product, proposed change, owning domain, accountable steward, and intended scope. Decide whether you are reviewing an existing capability or proposing a new version.
2. Open **Contract**, **Composition**, and **Guardrails** in the preview to understand the current consumer choices, defaults, and bounded product behavior. Record requirements your domain needs that these screens do not establish.
3. Prepare the domain contribution in the organization's controlled authoring process. Include its identifier and version, bounded promise, owner, applicable constraints, compatibility expectations, required evidence, and exact source revision. Do not try to encode a profile into the form's Owner or Cost center fields.
4. Have the platform product team identify the exact component versions proposed for composition and the effects of the change on consuming products. The documented model requires compatibility, impact, and evidence review; the current preview does not run that enterprise profile-authoring workflow.
5. Submit the change and required evidence through the accepted repository and review process. Where an accepted Guard path applies, retain its exact assessment identity and findings. A newly generated Forge proposal is not a substitute for a Guard assessment of the component change.
6. Use the applicable Console review procedure to inspect accepted evidence and record open questions. The public Forge and Console demos do not automatically transmit your profile change between applications.
7. Route the exact change and evidence to the authorized human review and release process. If the profile or composition changes, reassess the affected evidence and decisions. Keep the released version unchanged until the separately authorized adoption process completes.

**Finished output:** a reviewable, versioned domain contribution and its evidence requirements, bound to a specific product change. The preparation workflow ends before any unimplemented authoring, approval, release, or provisioning action.

### Security example

Suppose Security proposes a new version of a reusable baseline to strengthen encryption and workload-identity requirements.

1. Identify the existing baseline version, the proposed version, the exact requirements changing, and the Security steward.
2. Define the required evidence for the changed controls and the products or provider implementations that need review. Treat that impact list as work to establish; the current preview does not discover all affected products.
3. Ask the platform product owner to bind the proposed baseline version to the intended product composition and assess compatibility. A changed shared profile must not silently change released products.
4. Obtain the applicable deterministic checks and retain unresolved findings. Follow the Console Security reviewer procedure for accepted review evidence, including profile, scope, revision, and digest checks.
5. Submit the exact change for the external authorized decision. Keep an outstanding decision or missing evidence visible. Security profile ownership does not grant approval over another domain's component or permission to deploy the finished product.

You can use the preview now to inspect the product's **Guardrails** and generate the sample proposal in sections 3 and 4. That exercise does not create, upload, validate, approve, or release the new Security baseline.

### Product owner handoff

The accountable product owner coordinates the domain contributions around the consumer outcome. Before requesting a release decision, collect the exact proposed component versions, owners, compatibility and impact results, required evidence, unresolved exceptions, and consumer-contract effects through the accepted process.

Retain the external decision with the exact product and evidence subject to which it applies. The **Releases** tab explains the boundary; it does not perform the release. Approved catalog publication and any subsequent Storefront ordering require their own accepted connected workflow.

## References

- [Forge workbench](https://iaap-forge-preview.onrender.com/)
- [Forge product overview](https://infrastructureproductworks.com/forge/)

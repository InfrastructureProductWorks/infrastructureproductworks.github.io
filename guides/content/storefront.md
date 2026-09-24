# IPW Storefront User Guide

End to end instructions for the current evaluation application

Infrastructure Product Works | Version 1.0 | September 24, 2026

Use this guide to choose a product, submit a synthetic order, understand admission results, and inspect the evidence for that order. The current public application ends at governed review. Completing an order does not create infrastructure.

## 1 Getting started

Open [Storefront](https://infrastructureproductworks-storefront-44yf.onrender.com/). If a hosting startup screen appears, allow the application to finish loading. No cloud account or cloud credentials are needed for this evaluation.

Use fictional values throughout. The public preview uses a shared, temporary order ledger. Other visitors may see submitted order metadata while the service is running. The evaluation identity selector and the initials in the header do not authenticate you or provide a private workspace. A service restart can clear the ledger.

Only **Cloud Foundation Environment** is orderable. The current order form supports AWS in us-east-1 and Google Cloud in us-east1. Development environment, standard-dev profile, and internal data classification are platform defaults.

Managed Interconnect, Data Platform Environment, Security Services, and Kubernetes Platform have **Coming Soon** controls. Their catalog cards explain product direction; they cannot be ordered in this preview.

## 2 Find the right product

You can browse directly or start with the Product Advisor.

1. To browse, go to **Catalog** or **Our Product Menu**. Use the provider and product filters or **Search products or orders**. Choose **All** and clear the search to restore the complete menu.
2. For guided selection, enter a fictional request in **What are you trying to accomplish?** For example: “I need a development environment for a fictional internal application.”
3. Select the appropriate **Environment**, **Data**, **Availability**, and **Lifecycle** context. For this exercise, choose Development, Internal, Business hours, and Ongoing.
4. Select **Help me choose**. Read the recommendation, rationale, alternatives, and follow-up questions.
5. If an orderable recommendation fits, use its selection control to continue. You can also choose **Order Now** on the Cloud Foundation Environment card.

The advisor is deterministic in this preview and does not call a live model. Choosing Production in the advisor does not enable a production order.

| Advisor outcome | What to do |
| --- | --- |
| RECOMMENDED | Review the proposed product and confirm that it fits before continuing. |
| OPTIONS_AVAILABLE | Compare the alternatives and make the selection yourself. |
| MORE_INFORMATION_REQUIRED | Add the missing business context and submit the advisor request again. |

## 3 Configure and submit an order

In **Configure your order**, select **Commercial — Entra entitlement mapping** as the evaluation identity. This fixture supplies the expected ownership values. Keep those values for the first exercise.

| Field | Sample value |
| --- | --- |
| Order name | guide-demo-aws |
| Application | Synthetic Guide App |
| Business unit | Digital Products |
| Owning team | payments-team |
| Cost center | 12345 |
| Cloud | Amazon Web Services |
| Approved region | AWS us-east-1 |

1. Enter the sample order and application names. Confirm the business unit, team, and cost center match the selected fixture.
2. Select the cloud. Check the approved region again after changing providers; the available region changes with the provider.
3. Read the acknowledgment about submitting a governed product order for review and leave it checked if you intend to continue.
4. Select **Submit for governed review** once. Wait for the submission message to finish.
5. Confirm **Order admitted for governed review**, an order identifier, and a SHA-256 order digest appear.
6. Find your named order in **Review Queue**. Confirm its application, cloud, region, admission result, and workflow state.

For the sample AWS exercise, the current fixture displayed an estimated maximum of $1,800 per month. This is a synthetic policy estimate used by the demonstration, not a bill or a current cloud price quote.

## 4 Understand admission and review states

Admission checks product entitlement, ownership, cost-center binding, budget, delegated cost ceiling, and quota. Read the admission result separately from the workflow state.

| Admission result | Workflow result | User action |
| --- | --- | --- |
| ELIGIBLE | Awaiting human review | Inspect the exact order and its handoff evidence. |
| REVIEW_REQUIRED | Awaiting cost-owner review | Read the financial reasons and retain the order reference for accountable review. |
| BLOCKED | Order rejected | Correct inaccurate input or seek the appropriate entitlement, ownership, budget, or quota decision. |

An eligible result does not approve spending. Repeated submission does not clear a cost review or change entitlement.

### Try the cost review path

Select **Review path — entitled, above delegated cost ceiling**. Check the values populated by that fixture, give the order a different name such as guide-demo-cost, and submit. Expect **Order requires financial review** and **Awaiting cost-owner review** in the queue. This path demonstrates where the request stops; the preview has no cost-owner approval action.

### Try a rejected request

Choose **Negative test — authenticated but not entitled**, then submit a distinctly named fictional order. Read the admission reasons. The **Negative test — entitled but quota exhausted** fixture demonstrates a different rejection. These labels describe synthetic scenarios, not your actual identity or access.

## 5 Work with multiple orders

Submit each application request with a distinct name. Open **Orders** or **Review Queue** and select **Refresh** when needed. Use the search field to narrow the visible products and orders. Clear it before concluding an order is missing.

Match the order name, application, provider, region, and digest before inspecting a record. Each order has its own admission outcome and review state. A cost review on one order does not resolve or approve another order.

The preview has no durable personal order history, authenticated reviewer assignment, or production queue service. Keep a record of the output you need before the temporary instance is restarted. Avoid repeated submissions while a response is still pending.

## 6 Inspect and retain the handoff

1. On the correct order card, select **Inspect governed handoff**.
2. Wait for **Exact downstream envelope** to finish loading both the handoff and issuance record.
3. Look for `issuanceVerified: true`, `integrity.verified: true`, `orderDigestMatches: true`, and `issuanceRecordValid: true`.
4. Confirm `computedDigest`, `embeddedDigest`, and `issuedDigest` agree.
5. Confirm the envelope's order ID and order digest match the order you selected. Read the admission decision and review state as well.
6. If retaining the evidence for an evaluation, copy the complete displayed JSON into a local text file. Preserve the handoff and verification record together without editing them.
7. Select **Close** to return to the queue.

The order digest identifies the submitted order. The handoff digest identifies the larger evidence envelope. They serve different purposes and do not need to equal one another.

The public preview inspected for this guide does not transmit the envelope to Forge or Console. Copying JSON is evidence retention, not delivery or approval. A separately configured connected evaluation must use its own accepted instructions and transport controls.

## 7 Troubleshooting

**No product is visible.** Clear the search and choose All. A provider filter can leave only future products visible.

**The form will not submit.** Complete every required field, use an available region, and check the acknowledgment. Preserve ownership values that match the selected evaluation identity.

**Admission is blocked.** Read the displayed reasons. Changing a team or cost center merely to bypass policy does not establish authorization. In the demonstration, return to a matching fixture and its expected values.

**An order is missing.** Clear the search, select Refresh, and check the name. If the service restarted, the temporary ledger may have been cleared. Recreate only the fictional exercise you still need.

**Verification fails or the handoff is unavailable.** Close the dialog, refresh the queue, and inspect the same order again. If the failure remains, retain the order ID and failure message for the platform owner. Do not edit the JSON to force a match.

**Submission remains pending.** Wait for the service response. Before resubmitting, refresh the queue to see whether the first attempt succeeded.

## 8 Completion and next steps

You have completed the current Storefront workflow when you can identify the submitted order, explain its admission result, locate its review state, and verify its handoff where available. Retain the order ID, input values, order digest, handoff, issuance record, and any review reason you need for the evaluation.

The next accountable decision belongs to the appropriate reviewer outside this public preview. There is no infrastructure endpoint or deployed resource to collect from this workflow.

## References

- [Storefront application and documentation](https://infrastructureproductworks-storefront-44yf.onrender.com/docs)
- [Storefront product overview](https://infrastructureproductworks.com/storefront/)


# IaaP Guard User Guide

End to end instructions for the hosted GitHub App

Infrastructure Product Works | Version 1.0 | September 24, 2026

Use this guide to install Guard for selected repositories, obtain an architecture assessment on a pull request, investigate findings, and verify the result after a correction. Guard's supported user interface is the **IaaP Guard / Architecture** GitHub Check.

## 1 Prepare the repository

You need a GitHub account with access to the repository and someone authorized to install the App for the relevant owner or organization. Follow your organization's installation policy if installation requires an administrator.

Guard reads repository material to evaluate Infrastructure-as-a-Product architecture and governance evidence. Select only repositories intended for this evaluation. Guard is not a generic secret scanner or a vulnerability scanner.

Supported full-scan file suffixes are `.yaml`, `.yml`, `.json`, `.tf`, `.tofu`, `.hcl`, `.md`, `.py`, and `.sh`. A pull request containing only unsupported file types can return **No relevant changes**. That is not an architecture assessment of those files.

Before the first evaluation, identify the repository owner, the purpose of the infrastructure product, the intended review process, and the people responsible for resolving findings. You do not need a cloud account or cloud credentials for Guard.

## 2 Install the hosted App

1. Open [IaaP Guard on GitHub](https://github.com/apps/iaap-guard).
2. Start the installation flow and select the intended repository owner or organization.
3. Grant access to the repositories you intend to evaluate. Use the organization's normal administrator approval process when required.
4. Review the requested permissions against the table below before completing installation.
5. Return to the target repository and confirm it is included in the installation.

| Repository permission | Expected access |
| --- | --- |
| Metadata | Read |
| Contents | Read |
| Pull requests | Read |
| Checks | Read and write |

Guard does not need repository content write permission, cloud credentials, or merge authority. An unexpected permission request needs explanation before adoption.

The former public composite Action and public local CLI are retired. Do not add a workflow that references the old Action at main. The supported route is the hosted App.

## 3 Run the first assessment

1. Create a branch using your usual development process.
2. Make a legitimate, reviewable change to a supported file, such as clarifying the product contract in a Markdown document. For an evaluation, use a designated test repository or harmless documentation change.
3. Open a pull request and note the current head commit SHA.
4. Open the pull request's checks area and find **IaaP Guard / Architecture**.
5. Open the Check details. Confirm the result is attached to the current head revision before interpreting it.
6. Read the architecture conclusion, coverage score, normalized findings, source references, and any advisory sections.

A check from a previous commit does not describe a newer commit. If you push another change while an assessment is running, wait for the result associated with the new head.

## 4 Read the result correctly

| Result | Meaning and next action |
| --- | --- |
| PASS | Applicable architecture rules passed. Read advisory continuity and product context before completing human review. |
| WARNING | Review the findings and their product context. The hosted Check can publish a neutral GitHub conclusion. |
| FAIL | Investigate and correct the reported architecture issues, then obtain a new Check on the revised head. |
| No relevant changes | The change did not trigger supported full analysis. Do not treat it as coverage of unsupported content. |

The score measures coverage of applicable Guard rules. It is not a security rating, compliance certification, production-readiness score, or approval to deploy.

For each finding, record the rule identifier, affected artifact or context, supporting evidence, and bounded recommendation. Decide whether the issue concerns the consumer contract, governance, lifecycle, product composition, or missing evidence. A standalone module can require different context from a complete infrastructure product.

## 5 Review Evidence Continuity

Guard compares the PR head with the immutable PR base supplied by GitHub. You do not choose a baseline in the Check or configure a continuity database.

| Continuity status | Interpretation |
| --- | --- |
| SUPPORTED | Guard did not detect a material change in its own rule and finding evidence model for the compared revisions. |
| REVIEW REQUIRED | Guard evidence changed materially and needs accountable review. |
| NOT ESTABLISHED | The comparison could not establish continuity. Investigate access, revision availability, supported inputs, or size bounds. |

Read the base revision, materiality, disposition, transition counts, findings introduced or resolved, and evidence digest when present. A repository PASS can coexist with REVIEW REQUIRED because continuity is advisory in the current contract.

Record the human disposition through your established review process. Guard does not decide who can approve a change or whether prior legal, risk, or operational approval still applies.

## 6 Correct findings and reassess

1. Read the entire finding and the source evidence before changing the repository.
2. Correct the affected contract, implementation, or documentation through your normal branch workflow. Apply the same correction to analogous defects within the change where appropriate.
3. Commit and push the correction to the pull request.
4. Wait for a fresh **IaaP Guard / Architecture** Check on the new head SHA.
5. Confirm the targeted finding is resolved and inspect any new findings or continuity changes.
6. Ask the accountable reviewer to evaluate the corrected change using the repository's ordinary review process.
7. Complete merge or release only under that process. Guard itself does not approve or merge the pull request.

If GitHub exposes a supported Check rerun or rerequest control, it can request reevaluation. Confirm the resulting head and base revisions again. A rerequest does not grant additional permissions or change the repository content.

## 7 Assess a product spanning repositories

Use this section only when the product has registered membership across repositories. A missing product manifest is normal in single-repository mode.

Before relying on combined product evidence, have the product owner verify that every intended member:

- belongs to the same GitHub owner and has compatible visibility;
- is accessible to the same App installation;
- has reciprocal trusted product membership on its default branch;
- resolves to an immutable default-branch revision; and
- fits within the current maximum of 12 registered members.

Use the published product schema and your approved membership configuration. Establish membership through normal review on the relevant default branches. A proposed membership change in an untrusted PR does not expand the trusted live assessment scope.

After a supported PR event, inspect the Check's member completeness, weakest-member score, relationship findings, and Product Improvement Plan when present. Missing, inaccessible, or non-reciprocal members can produce **INCOMPLETE** evidence. Fix the underlying registration or access problem before relying on the combined product result.

Product context is advisory and does not silently replace the triggering repository's architecture conclusion. It is not an order queue or a portfolio discovery crawl.

## 8 Manage updates and evidence

Retain the repository, PR number, head and base SHAs, Check link, conclusion, findings, continuity status, and exposed version or digest information with the review record. Keep enough detail to distinguish one assessment from another after later commits.

For customer-impacting updates, review the release documentation, compatibility evidence, required customer action, and rollback path before adoption. The documented policy-catalog selection file, `.iaap/guard-update.json`, applies only when the deployed runtime explicitly supports it. Do not infer that a documented selection feature is already active on the hosted runtime.

Provider maintenance and customer adoption are separate decisions. Ask the service owner to identify the active supported contract and available rollback target when evaluating a change. Guard does not edit your selection file for you.

## 9 Troubleshooting

**The Check is missing.** Verify installation access to the repository, a supported file change, and the current PR head. Ask the App or repository administrator to investigate delivery if those prerequisites are satisfied.

**The result is incomplete.** Check registered-member access, reciprocal default-branch manifests, visibility compatibility, and immutable revisions. Do not omit a required member to make the result look complete.

**A repository exceeds limits.** Current documented bounds include 25 MB compressed archive, 20,000 archive members, 100 MB extracted regular-file data, 1 MB per analyzed file, and 20 MB for the cross-repository relationship bundle. Work with the product owner on supported scope; do not assume skipped evidence was evaluated.

**Continuity is unavailable.** Confirm both head and base are accessible and within supported bounds. Preserve the NOT ESTABLISHED result until the issue is resolved.

**The organization uses GHES or restricted networking.** Obtain environment-specific acceptance evidence. Current documentation does not universally qualify those environments.

For support, include sanitized reproduction steps, rule IDs, expected versus observed behavior, and revision references you are permitted to share. Use private vulnerability reporting for suspected security issues. Keep sensitive repository content and credentials out of public issues.

## 10 Completion

The Guard workflow is complete when a result exists for the exact current PR head, findings have an accountable disposition, applicable continuity and product-context gaps have been considered, and the review record retains the relevant evidence. Infrastructure execution remains outside Guard.

## References

Published guidance: [hosted App](https://github.com/InfrastructureProductWorks/iaap-guard/blob/main/docs/GITHUB-APP-BETA.md), [adoption prerequisites](https://github.com/InfrastructureProductWorks/iaap-guard/blob/main/docs/ADOPTION-PREREQUISITES.md), [known limits](https://github.com/InfrastructureProductWorks/iaap-guard/blob/main/docs/KNOWN-LIMITS.md), [multi-repository products](https://github.com/InfrastructureProductWorks/iaap-guard/blob/main/docs/MULTI-REPOSITORY-PRODUCTS.md), and [updates and support](https://github.com/InfrastructureProductWorks/iaap-guard).

# Assurance record projection

This public Portal consumes the browser demo's actual exported synthetic decisions. It is an offline read-only consumer of that bounded producer, not an operational order service.

## Supported source and trust

`assets/assurance-records.json` is reproduced by `node scripts/build_assurance_records.cjs`. Its entries preserve the complete `iaap-assurance-browser-record/v1` record, including its original digest. The source evaluator revision is pinned in the catalog. Requested-at metadata is taken from the same evaluator request; no business timestamps or individual assignments are fabricated.

`assurance-record-view.js` pins the SHA-256 of the catalog bytes. Loading or importing requires the exact catalog member, canonical record equality, and a recomputed record digest. A caller cannot gain acceptance by editing the decision and recomputing its digest. Unknown sources, extra record fields, mixed unsupported records, duplicate request identities, and conflicting results are rejected before replacing the visible set. Imports are limited to 100 KB and 50 records. Source JSON is never inserted as HTML.

The source catalog is public synthetic evidence. This is not a general validator for signed production Assurance records. New producers, customers, schema versions, or historical retries need an explicit reviewed adapter and identity contract. The current request namespace is local to Assurance; matching IDs elsewhere do not establish cross-product lineage.

## Exchange

Accept either one unmodified browser record or this exact envelope:

```json
{"schemaVersion":"iaap-assurance-portal-package/v1","records":["one or more complete record objects"]}
```

The array illustration above describes the contents; strings are rejected. The demo exports record objects. The Portal exports those same source records without modifying their bytes semantically or their digests. The three-request bundle supports independent outcomes; the single-record export supports all six Shield scenarios. Imports replace the snapshot, rather than appending ambiguous history. A rejected import preserves the previous verified set. Nothing is uploaded, persisted, authorized, or executed by importing a file.

## Projection and audience

All summaries derive from verified entries. Management sees outcomes and next steps; Security and operations see resource/action details; Governance sees source and evidence coverage. These are presentation choices, not role authentication or access controls. All three use the same immutable source decision and action flags. Expected responsible roles are derived from known reasons; no individual assignment or new approval step is created.

Counts describe the full loaded snapshot and remain stable when a display filter is applied. They distinguish applied, review required, stopped, and rolled back. Applied means the bounded synthetic change was verified; it does not imply order fulfillment. Historical service-proof reviews lower on the page are a separate data set.

## Timing and limits

Request-to-decision is evaluated-at minus requested-at. Median is computed across the loaded set, including stopped requests. Time-since-decision is measured against the catalog's fixed as-of timestamp. Review waiting time, live queue age, order delivery, throughput improvement, current service health, and independent retained custody are unavailable. No zero values or live-clock estimates substitute for missing evidence.

Operational completion requires authenticated tenant-scoped source records, a durable order/revision identity and lifecycle, actual owner assignments, receipt/review/delivery events, disclosure authorization, and a separately accepted live integration. The public fixture consumer proves only the projection and export/import path.

## Verification

`test_assurance_records.cjs` verifies source reproduction, digest and catalog binding, rehashed tampering, identity substitution, unknown/extra fields, duplicate/conflicting requests, timing arithmetic, and asset references. `test_assurance_browser.cjs` exercises the actual demo export → Portal import → Portal export roundtrip, audience changes, filters, rejected-import retention, rollback, reset, browser errors, and a narrow viewport. The Assurance workflow runs both on the PR and resulting main commit.

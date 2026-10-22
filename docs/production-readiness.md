# From transaction demo to a production receivables subledger

October 20, 2026. Engineering readiness baseline; not a finding of regulatory compliance or authorization to launch.

## What now runs

The [transaction timeline](https://ar-credit-workspace.glassyibex21.chatgpt.site/processing.html) runs deterministic financial rules in a browser. One synthetic account, one entity, one USD currency and one January 2026 cycle are modeled. The displayed chart, daily balances and journals are calculated from input events, not pre-filled output values.

The scenario includes purchases, a principal-only payment, merchant refund, linked purchase reversal, synthetic service fee, identical retry, conflicting retry and unsupported EUR input. A daily principal-based interest calculation is assessed at cycle close. The APR selector changes the calculation and restarts the run. Controls support playing, pausing, stepping, scrubbing, resetting and exporting evidence.

Default expected result: principal $900.00, fees $25.00, interest $19.49, closing receivable $944.49. Eight balanced journals, one suppressed duplicate and two rejected events. An independent fixture totals 29,640 dollar-days at 24% / 365, rounded half-up once to cents. Changing APR to 12% yields $9.74 interest; 0% yields none.

## Calculation contract

- Posted amounts are safe bounded integers in cents. Interest accumulates a BigInt numerator with denominator 3,650,000 (365 × 10,000). It rounds once at cycle close, not each day.
- End-of-day principal is the interest base. Fees and assessed interest do not earn interest in this scenario. Displayed unbilled interest is a rounded estimate, not an additional posted obligation.
- A single principal bucket receives payments. No statement minimum, excess-payment hierarchy, grace period, protected cohort, promotional balance or compounding is implemented.
- Payment receipt debits payment clearing, not cash. No actual settlement is demonstrated. Processor clearing and income accounts are illustrative accounting mappings requiring Controller approval.
- Identical event content and identity produce no second financial effect. Conflicting content is rejected. Reversals retain the original entry and add a compensating journal.
- New backdated events, excessive principal reductions, mismatched accounts/entities/currencies and new postings after close are rejected in this bounded model. Closed-cycle corrections need a future workflow.
- State exists in memory. Replay is reproducible but is not durable storage, multi-user consistency, authenticated evidence or a tamper-resistant audit trail.

The service fee is a synthetic input for journal demonstration. It is not an approved fee policy. The cycle snapshot is not a compliant consumer statement.

## Evidence delivered

| Requirement | Demonstrated evidence | Remaining production gap |
|---|---|---|
| L01: balanced journals | Every demo entry balances; independently recomputed in tests | Database enforcement by entity/currency, accounting policy and exhaustive mappings |
| L02: controlled correction | Original and linked reversal retained; exported snapshots do not mutate engine state | Write protections, operator permissions, immutable retention and adjustment approval |
| L03: atomic commit | Validation occurs before in-memory financial mutation | Database transaction covering journal, balances, idempotency and outbox; crash proof |
| L04: duplicate protection | Same payload ignored; conflicting payload rejected | Scoped keys, persistent unique constraints, race and retry testing |
| L05: safe allocation | Negative/invalid amounts and excessive reductions rejected | Concurrent allocation, multiple buckets, credit balances and returns |
| L06/L10: effective history | Arrival day and effective day present; unsupported late events rejected | Bitemporal history, backdated calculation, time zones and prior-statement reproduction |
| L07: account reconciliation | Journal-derived receivable equals account balance each day | Independent processor, payment, cash and GL control totals and exception resolution |
| L08: traceability | Event ID, journal ID, rule version, entity/currency and reversal reference | Authenticated actor, approved terms, trace IDs, persistence and retention |
| L09: period close | New ordinary financial events rejected after modeled close | Durable period locks, approved reopen/adjust flows and accounting-period policy |

## The next build: durable ledger vertical slice

Use the proposed modular application and transactional relational database from [the architecture baseline](requirements-and-architecture.md). Keep the ledger core independent of country/product policy and processor adapters.

1. Specify versioned event and posting contracts: account, entity, currency, economic date, occurrence/receipt/posting times, source key, payload hash and rule version.
2. Implement persistent accounts, balance buckets, journals/lines, idempotency, processing attempts, business dates, period close records, rule versions and an outbox. Enforce currency/entity boundaries and uniqueness in the database.
3. Commit financial updates atomically. Serialize or safely retry concurrent account updates. Publish outbox events only after commit; consumers remain duplicate safe.
4. Separate event ingestion from posting policy. Authorization holds, clearing, payment receipt and cash settlement have explicit owners. Unrecognized or unsupported events enter an exception workflow.
5. Build replay/reconciliation tooling against an independent reference calculation. Add audit access and controlled adjustments. Do not use the browser demo engine as the production service unchanged.

Exit evidence: database-backed golden scenarios; parallel payment/retry tests; process termination at transaction boundaries; restore/replay results; closed-period protection; no lost updates or duplicate financial effects. Demonstrate this in a test environment before connecting production systems.

## Product and regulatory gates

Product, Compliance/Legal and the Controller must approve the actual product, contractual terms, chart of accounts, accounting recognition and country package. Acceptance scenarios must cover interest/grace treatment, minimum and excess allocation, fee eligibility, payment crediting/returns, credit balances, disclosures, billing errors/disputes, delinquency, hardship/protections, charge-off and recovery. Retain a requirement-to-policy-to-test mapping and review current applicability before launch.

Primary references reviewed for this readiness plan:

- [CFPB Regulation Z §1026.53, payment allocation](https://www.consumerfinance.gov/rules-policy/regulations/1026/53/).
- [CFPB Regulation Z §1026.7, periodic statements](https://www.consumerfinance.gov/rules-policy/regulations/1026/7/).
- [FFIEC development, acquisition and maintenance guidance announcement](https://www.ffiec.gov/news/press-releases/2024/pr-09-29). The supplied official page dates the announcement September 29, 2024; confirm the underlying booklet version during implementation.
- The fuller applicability inventory and sources remain in the existing architecture baseline.

These references anchor work to be reviewed. This demo has not implemented or validated all requirements in them, and the list is not exhaustive.

## Integration, security and operations gates

| Gate | Required evidence | Accountable functions |
|---|---|---|
| External money and accounting | Processor/payment contract fixtures, settlements matched to cash, balanced GL batches, duplicate-safe delivery, aged exception queues | Payments operations, Finance, engineering |
| Identity and access | Service authentication, least privilege, operator segregation, reviewed adjustments, secret management and data classification | Security, IAM, operations |
| Reliability and recovery | Measured peak load, availability objectives, latency budgets, backup restore, failover, agreed RPO/RTO and incident exercises | Engineering, SRE, business owners |
| Customer treatment | Approved terms/disclosures, independently verified calculations, servicing workflows, complaints/remediation and communication delivery | Product, Compliance/Legal, servicing |
| Release governance | Versioned policy/rule approvals, migration plan, rollback/forward-fix decision tree, monitoring and accountable sign-offs | Change governance, Risk, Finance |

## Controlled pilot and go/no-go

After the above gates pass, reconcile historical or synthetic datasets in parallel against the approved reference. Then define a bounded pilot, explicit exposure limits, stop conditions, escalation, migration reconciliation and a recoverable cutover plan. Select pilot accounts only through the institution’s approved process. No customer or financial data is connected by this prototype.

Production readiness is an evidence review with named owners. No delivery date or launch promise is established by this plan.

# Consumer Platinum reference model

Version platinum-reference-2026.1. Reviewed October 20, 2026.

## Scope and source hierarchy

The uploaded application disclosure contains rates/fees and benefit terms; it links out to the full Card Member Agreement. The relevant Pay Over Time descriptions are on pages 53–57, including separately dated February 2027 changes. It is not a personalized agreement establishing all account terms for an earlier cycle.

The supplied statement was reviewed and reconciled privately. Account figures, names, account identifiers, merchant history and source PDFs are not included in the hosted product example. Private findings live outside the Site checkout in the ignored `profile/private/consumer-platinum/` folder.

I also retrieved [Amex’s public March 31, 2026 Platinum agreement](https://www.americanexpress.com/content/dam/amex/en-us/company/legal/cardmember-agreements/public-site-2026-q1-pdf-cmas/cps-charge/platinum-card-03-31-2026.pdf). Its detailed minimum, allocation and interest rules are an explicit **candidate reference**, not confirmation that this version governs the uploaded account. Its Part 1 is DAM0AOT009_V008 and Part 2 is CLITE001 1176499. An account-specific agreement and applicable amendments must establish precedence before account-level prediction.

## Model boundaries

| Module | Implemented reference behavior | Evidence and limit |
|---|---|---|
| Balance routing | Separate Pay In Full, Pay Over Time, cash and plan capacity; whole-charge routing at transaction time | Uploaded terms pp54–55; account eligibility/status and issuer authorization remain inputs |
| Closing reclassification | Eligible Pay In Full charges may move partially into remaining Pay Over Time capacity | Uploaded terms pp54–55; no change to total principal; transferred amount starts interest the following day |
| Effective-date policy | Current active-setting conditions remain distinct from February 1, 2027 standard-account conditions | Uploaded terms pp55–57. Payment-program cases reject as unsupported, rather than assuming standard treatment |
| Payment allocation | Billed Pay In Full due, plan due, lower-rate revolving minimum, then higher-rate revolving excess and plans | Public reference, PDF p7. Billed due is separate from newly incurred Pay In Full charges. Equal-rate order is an explicit deterministic convention |
| Minimum payment | Reference formula with floor, percentage and tiered candidates, plus applicable due components | Public reference, PDF p3. Bound by balance; historical account applicability unconfirmed |
| Interest | Rounded DPR; daily compounding; conditional grace suppression; cash does not get purchase grace | Statement p2 and public reference PDF pp3,7. Missing grace evidence yields unknown, not an invented zero |
| Credits | Statement reconciliation uses reported allocation; no inference from the merchant label | Benefit credits can apply to a different balance from the related purchase; general routing policy needs account terms and event metadata |
| Statement validation | Opening + charges - payments - credits + observed fees/interest equals reported closing balance | Exact aggregate reconciliation does not independently validate the interest, fee, benefit-eligibility or minimum policy |

All money inputs are bounded integer cents. DPR and compounding use BigInt arithmetic; decimal conversions are for display. Final half-up cent rounding is a candidate implementation convention pending issuer comparison. Variable APR needs an effective-dated rate source and account margin; the code takes a specified APR and does not fetch or infer a historical Prime Rate.

## Synthetic visual example

The hosted [Platinum rules lab](https://ar-credit-workspace.glassyibex21.chatgpt.site/platinum.html) uses invented balances and dates. It exposes the balance-setting and grace assumptions instead of using the real statement as a public dataset. The existing [generic ledger demo](https://ar-credit-workspace.glassyibex21.chatgpt.site/processing.html) remains a separate journal/invariant demonstration.

The lab is a functional product-rule slice, not a complete ledger integration. Routing, allocation and reclassification conserve synthetic principal. Its computed interest can change with the explicit grace input; unknown grace blocks an exact closing total. No live customer statement, authorization, payment or fee is generated.

## Validation delivered

Reference tests cover whole-charge overflow, shared capacity, partial closing transfer, excluded charges, effective-date boundary, unsupported payment-program exceptions, missing grace evidence, the public minimum-payment example, small balances, a tier boundary, minimum/excess allocation, residual credit, daily compounding, cash interest, synthetic conservation and statement chronology limits.

The separate private fixture verifies line-item totals and aggregate account reconciliation. It deliberately retains null posting dates where the statement supplies only transaction dates. It does not fabricate an actual daily accounting timeline or daily interest-bearing balance.

## What remains before claiming account replication

1. Confirm the full account-specific Card Member Agreement, all applicable parts and amendments for the tested cycle.
2. Obtain the preceding two statement cycles and payments/due dates to establish the public-reference grace condition; identify exceptions such as Pay Over Time Select, Plan It or payment programs.
3. Obtain posting/processing dates and balance classifications for transactions and credits, rate history, plan-specific quotes and fee assessment history where relevant.
4. Compare nonzero-interest cycles and partial/minimum-payment cycles, not just a zero-interest cycle. Validate cent-level rounding, allocation order and trailing-interest treatment independently.
5. Integrate the approved rules with the durable ledger, reconciliation and operational controls in the [production readiness plan](production-readiness.md).

Detailed fee eligibility, penalty notifications/review history, plan amortization and quote determination, benefit entitlement, cash/P2P controls, fraud/disputes, special protections and compliance statement generation are not implemented by this slice. No rule should silently fall back to the generic demo’s 24% simple-interest behavior.

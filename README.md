# AR credit receivables prototype

An executable JavaScript prototype exploring an authoritative credit card receivables subledger. It includes a synthetic transaction timeline and a separate Consumer Platinum reference rules lab.

This is a browser prototype, not a production banking system, a finding of regulatory compliance, or an American Express production implementation. The requirements describe a target architecture; they do not mean those capabilities are already built.

## Run locally

Use Node.js 22 or later to run tests. The application has no npm dependencies and no build step.

```sh
npm test
python3 -m http.server 8767 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:8767/ for the product overview, `/processing.html` for the transaction timeline, or `/platinum.html` for the Platinum rules lab. Serve the files over HTTP because the browser loads JavaScript modules.

## Source layout

| Path | Purpose |
| --- | --- |
| `dist/index.html` | Product overview and capability map |
| `dist/ledger-engine.mjs` | Synthetic journal, idempotency, reversal, balance and cycle calculations |
| `dist/processing.html`, `dist/processing.mjs`, `dist/processing.css` | Interactive transaction timeline and evidence views |
| `dist/platinum-rules.mjs` | Bounded routing, closing transfer, allocation, minimum and interest reference calculations |
| `dist/platinum.html`, `dist/platinum-lab.mjs` | Synthetic product-rule scenarios and daily balance visualization |
| `tests/` | Node.js automated engine and product-rule checks |
| `docs/` | Requirements, architecture, model evidence, limitations and production roadmap |

`dist/` contains the authored application source; it is not generated or minified output. The Markdown files inside `dist/` are copies served by the prototype. Keep them aligned with their counterparts in `docs/` when editing.

## Documentation

- [Requirements and architecture](docs/requirements-and-architecture.md)
- [Platinum rules, source hierarchy and validation limits](docs/platinum-model.md)
- [Production readiness plan](docs/production-readiness.md)

## What the demos establish

The generic ledger demo calculates balanced journals and synthetic account balances, rejects unsupported events, suppresses identical retries and retains linked reversals. Its illustrative simple-interest method is separate from the Platinum reference model.

The Platinum lab demonstrates balance routing, partial closing transfers, payment allocation, effective-dated policy and conditional daily compounding. Detailed formulas use a public reference agreement whose applicability to a particular account is unconfirmed. Missing grace evidence produces an unknown result.

Neither demo persists a durable ledger or connects to live payment systems. Refreshing the browser resets its in-memory calculations. Production work requires approved product rules, durable atomic posting, access controls, operational reconciliation and the other gates documented in the readiness plan.

## Data and repository scope

Only synthetic financial examples and non-private technical documentation are included. Uploaded statements, private reconciliation fixtures, personal identifiers, recruiting research, resumes, credentials, hosting identity and local Git history are excluded. Do not add real account data to this repository.

This GitHub source copy is independent of the existing hosted Site. Updating GitHub does not automatically publish the website. No automated deployment or credential setup is included.

## Working with version control

Commit code and the corresponding documentation together. Run `npm test` before pushing changes, and use a branch and pull request for changes that need review. This initial export contains the current source snapshot rather than the mixed workspace or hosting history.

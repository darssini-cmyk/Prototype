# Automation Operations Demonstration

A React JS UI-flow demonstration using synthetic fixtures and browser-memory state. No backend, environment variables, credentials or buyer documents are needed.

## Setup and run

Validated with Node 18.20.8 and npm 10.8.2. From this directory:

```sh
npm ci --no-audit --no-fund
npx --no-install vite --host 127.0.0.1 --port 5173 --strictPort
```

Open `http://127.0.0.1:5173`. Stop the local server with Ctrl+C. This is a standalone local setup, not a managed preview or production deployment.

## Verification

```sh
node --test tests/state.test.js
npx --no-install vite build
npx --no-install playwright install chromium
```

Keep the local server running in another terminal, then:

```sh
CI=true npx --no-install playwright test --reporter=list
```

The browser config uses `DEMO_BASE_URL` if supplied; otherwise it targets `http://127.0.0.1:5173`. The browser server is intentionally externally managed; stop it after testing. On a fresh Linux host missing browser system libraries, use `npx --no-install playwright install --with-deps chromium` with appropriate installation permissions.

## Walkthrough

1. Overview shows 2 Queued, 0 In Review and 1 Reviewed synthetic cases. Try Simulated refresh.
2. Open Work Queue; try Team and Role filters. These are view filters, not access control.
3. Pick up SYN-001. Repeat pickup is disabled in this session. Open Review.
4. Try Confirm review before completing the form. Errors identify the missing Applicant, validation and classification.
5. Focus Applicant and activate its source region with Enter or a click. Only confidence 0.84 is flagged; 0.85 and 0.86 are not.
6. Validate Applicant and choose Invoice as the manual Document type. Editing Applicant again clears its validation.
7. Confirm review. SYN-001 becomes Reviewed once. Inspect Activity for pickup and confirmation with local timestamps.
8. Overview now has 1 Queued, 0 In Review and 2 Reviewed. Confirm Reset demonstration to restore initial data and clear events.

## Scope and traceability

Implementation: `src/main.jsx`, `src/demo.js`, `src/style.css`. Checks: `tests/state.test.js`, `tests/browser/flow.spec.js`.

The [workflow evidence](../kavia-docs/rfp-bids/ibps-tss005-demo/05-prototype-evidence.md) maps all 13 selected requirement IDs, observed checks and limitations. The [solution map](../kavia-docs/rfp-bids/ibps-tss005-demo/04-solution-artifact-map.md) retains original source locators.

No live OCR/AI, bots, authentication/RBAC, shared queue locking, persistent storage, durable audit, banking action, external submission or production telemetry is implemented. Reload discards state. The 0.85 threshold is an internal demo assumption, not a buyer-approved rule. A successful UI test does not establish production compliance or buyer acceptance.

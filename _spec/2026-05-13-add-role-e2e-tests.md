# Spec: Add Role Happy-Path Browser E2E Tests

## Request Summary

Add a separate Playwright browser E2E suite for one happy path per Taxify role: client ride booking, driver trip lifecycle with cash confirmation, admin booking reassign/complete controls, and agent walk-in booking.

## Date

2026-05-13

## Source Prompt

User requested Playwright E2E tests in `kofiarhin/taxify`, with config, npm scripts, isolated deterministic data, repeatable setup, existing test/build preservation, and workflow artifacts.

## Questions Asked And Answers Received

No clarifying questions were asked. The prompt included concrete scenarios, constraints, verification commands, and acceptance criteria. Remaining unknowns are documented as assumptions.

## Assumptions

- `complete-workflow` mode applies.
- Playwright can be added as a dev dependency at the repository root.
- E2E may use an isolated MongoDB Memory Server process to avoid production services and local MongoDB requirements.
- E2E may start the Express app and Vite dev server locally during the test run.
- API setup/teardown is acceptable for deterministic data and for bridging the client confirmation step in the driver cash-confirmation flow.
- Existing UI has usable accessible labels/text for most selectors; minimal accessibility-oriented UI changes are allowed only if selectors need them.

## Goal

Create a repeatable browser E2E suite that proves the main happy path for client, driver, admin, and agent roles without replacing existing Jest/Vitest coverage.

## Non-Goals

- Do not add Socket.IO or real-time behavior.
- Do not redesign role pages.
- Do not replace existing backend or frontend tests.
- Do not use production databases, services, or credentials.
- Do not change deployment configuration.

## Users

- Client booking a ride.
- Driver handling an assigned trip and confirming cash after client confirmation.
- Admin managing booking operations.
- Agent creating walk-in bookings.
- Developers running local verification.

## Functional Requirements

- Add Playwright config at the repo root.
- Add E2E tests under `e2e/`.
- Add `npm run test:e2e`.
- Add deterministic E2E data seeding when reliable browser seed/login data is not already sufficient.
- E2E setup must create admin, agent, client, approved active drivers, a driver-assigned booking, a pre-trip admin booking for reassignment, and an eligible admin completion booking.
- Tests must log in through the real browser UI.
- Client test must navigate to `/client/book`, submit pickup/dropoff, and assert booking-created success plus assigned/queued status.
- Driver test must navigate to `/driver`, assert assigned trip, accept, start, end with metrics, bridge client confirmation when needed, confirm cash received, and assert completed/fare status.
- Admin test must navigate to `/admin/bookings`, assert list render, exercise reassign and complete controls safely, and assert feedback/status updates.
- Agent test must navigate to `/agent`, submit walk-in booking, and assert booking-created success plus assigned/queued status.

## UI Expectations

- Prefer accessible role, label, and text selectors.
- Add visible labels or `aria-label` only if necessary for stable accessibility-based selection.
- Keep current Tailwind styling conventions intact.
- If frontend files are changed, run the `design-taste-frontend` final pre-flight matrix before final output.

## API Expectations

- E2E helper setup may use backend models/services directly while connected to an isolated test database.
- Runtime browser interactions must use the configured local API server, not production services.
- Frontend API base URL must remain environment-driven.

## Data Model Expectations

- Seeded test credentials use clearly named local/test accounts.
- Seed data is isolated per E2E run and can be recreated idempotently.
- No sensitive fields or secrets are exposed in client UI or committed files.

## Edge Cases

- If no active driver remains for client or agent bookings, success may show `QUEUED`; this is acceptable.
- If Playwright browser binaries are unavailable in the environment, config/tests/scripts still need to be added and the exact local install/run command documented.
- If an E2E command fails because browser installation is unavailable, classify and document it as an environment blocker.

## Constraints

- Use npm as detected package manager.
- Existing commands must continue to work:
  - `npm test`
  - `cd client && npm test`
  - `cd client && npm run build`
- Do not add secrets.
- Do not use production services.
- Do not introduce broad refactors.

## Success Criteria

- E2E suite exists and is documented.
- One browser happy path exists for client, driver, admin, and agent.
- E2E setup is repeatable from a clean local checkout.
- Existing backend/frontend tests still pass.
- Frontend build still passes.
- Final review documents E2E limitations or environment blockers.
- Final response includes changed files, commands run, pass/fail status, and next steps.

## Out-Of-Scope Items

- Real-time updates.
- Payment provider integration.
- Broad UI redesign.
- Deployment changes.
- Commit creation.

## Open Questions

- Whether Playwright browser binaries are already installed in this environment; verification will determine this.

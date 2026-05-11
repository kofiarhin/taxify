# Task Plan: Add Role Happy-Path Browser E2E Tests

## Spec File Used

`_spec/2026-05-13-add-role-e2e-tests.md`

## Planning Date

2026-05-13

## Progress And Summary Files Read

- `_handoff/current.md`
- `_progress/progress.md`
- `_summary/2026-05-13-taxify-brief-audit-remediation.md`
- `docs/PROJECT_CONTEXT.md`

## Dirty Worktree Protection

- Existing dirty files before implementation: `WORK_REQUEST.md`, `_spec/2026-05-13-add-role-e2e-tests.md`, `_task/2026-05-13-add-role-e2e-tests.md`.
- Planned files for this workflow: root package files, Playwright config, `e2e/` files, optional `.env.example`, workflow artifacts, and minimal frontend accessibility updates only if needed.
- Overlap risk: none beyond workflow files intentionally created for this request.

## Execution Mode

`complete-workflow`

## Task List

### TASK-001: Add isolated Playwright E2E harness

Status: Done

Objective:
Add the root Playwright dependency/config/scripts plus isolated server/database setup that can seed deterministic E2E data without production services.

Files likely affected:
- `package.json`
- `package-lock.json`
- `playwright.config.js`
- `e2e/globalSetup.js`
- `e2e/globalTeardown.js`
- `e2e/helpers/e2eSeed.js`
- `e2e/helpers/e2eServer.js`
- `.env.example` if new E2E vars are needed

Checklist:
- [x] Add Playwright root test configuration.
- [x] Add `test:e2e` script.
- [x] Add isolated MongoDB Memory Server and Express app bootstrap.
- [x] Add deterministic E2E seed helper with role users, approved active drivers, and booking states.
- [x] Add or document E2E environment variables only if needed.

Acceptance criteria:
- Playwright config and scripts exist.
- E2E seed/setup does not require production services.
- E2E data includes admin, agent, client, approved active drivers, and admin/driver booking states.
- Existing `npm test` still passes after harness changes.

Acceptance result:
- [x] Playwright config and scripts exist.
- [x] E2E seed/setup does not require production services.
- [x] E2E data includes admin, agent, client, approved active drivers, and admin/driver booking states.
- [x] Existing `npm test` still passes after harness changes.

Verification commands:
- `npm test`
- `npm run test:e2e -- --list`
- `npx playwright --version`
- `node --check playwright.config.js`
- `node --check e2e/helpers/e2eState.js`
- `node --check e2e/helpers/e2eSeed.js`
- `node --check e2e/helpers/e2eServer.js`
- `node --check e2e/helpers/seedE2e.js`
- E2E seed smoke using MongoDB Memory Server

Stop condition:
Stop if Playwright cannot be installed or the E2E harness requires production credentials/services.

Out-of-scope items:
- Writing the full role scenarios beyond a list/smoke verification.

### TASK-002: Add client and agent browser happy paths

Status: Done

Objective:
Add browser E2E tests for client ride booking and agent walk-in booking using accessible selectors and seeded credentials.

Files likely affected:
- `e2e/client-booking.spec.js`
- `e2e/agent-booking.spec.js`
- frontend role pages only if accessible selectors need minimal labels
- `_task/2026-05-13-add-role-e2e-tests.md`
- `_progress/progress.md`
- `_handoff/current.md`

Checklist:
- [x] Client logs in and reaches `/client/book`.
- [x] Client submits pickup/dropoff and sees created status.
- [x] Agent logs in and reaches `/agent`.
- [x] Agent submits walk-in booking and sees created status.
- [x] Prefer role/label/text selectors.

Acceptance criteria:
- Client E2E happy path exists.
- Agent E2E happy path exists.
- Tests use isolated seeded credentials/data.
- Existing frontend tests/build still pass.

Acceptance result:
- [x] Client E2E happy path exists.
- [x] Agent E2E happy path exists.
- [x] Tests use isolated seeded credentials/data.
- [x] Existing frontend tests/build still pass.

Verification commands:
- `cd client && npm test`
- `cd client && npm run build`
- `npm run test:e2e -- e2e/client-booking.spec.js e2e/agent-booking.spec.js`

Stop condition:
Stop if reliable browser selectors require a broader UI redesign.

Out-of-scope items:
- Driver/admin E2E scenarios.

### TASK-003: Add driver and admin browser happy paths

Status: Done

Objective:
Add browser E2E tests for the driver trip/cash lifecycle and admin reassign/complete controls.

Files likely affected:
- `e2e/driver-trip.spec.js`
- `e2e/admin-bookings.spec.js`
- `e2e/helpers/api.js` if needed
- frontend role pages only if accessible selectors need minimal labels
- `_task/2026-05-13-add-role-e2e-tests.md`
- `_progress/progress.md`
- `_handoff/current.md`

Checklist:
- [x] Driver logs in and sees assigned trip.
- [x] Driver accepts, starts, ends, and sees fare/status updates.
- [x] Test bridges client confirmation safely when needed.
- [x] Driver confirms cash received and sees no active assigned trip after completion.
- [x] Admin logs in and sees booking list.
- [x] Admin reassigns pre-trip booking.
- [x] Admin completes eligible booking.
- [x] Admin status/control feedback is asserted.

Acceptance criteria:
- Driver E2E happy path exists.
- Admin E2E happy path exists.
- Tests use isolated seeded credentials/data.
- E2E suite can run as a separate suite.

Acceptance result:
- [x] Driver E2E happy path exists.
- [x] Admin E2E happy path exists.
- [x] Tests use isolated seeded credentials/data.
- [x] E2E suite can run as a separate suite.

Verification commands:
- `npm run test:e2e -- e2e/driver-trip.spec.js e2e/admin-bookings.spec.js`

Stop condition:
Stop if the current app cannot expose the requested controls without changing product behavior beyond the spec.

Out-of-scope items:
- Real-time behavior or broad admin UI redesign.

### TASK-004: Run full verification and close workflow

Status: Done

Objective:
Run required verification, perform final review/diff audit, and update workflow artifacts.

Files likely affected:
- `_task/2026-05-13-add-role-e2e-tests.md`
- `_progress/progress.md`
- `_handoff/current.md`
- `_review/2026-05-13-add-role-e2e-tests.md`
- `_release/2026-05-13-add-role-e2e-tests.md`
- `_summary/2026-05-13-add-role-e2e-tests.md`
- `docs/PROJECT_CONTEXT.md`

Checklist:
- [x] Run `npm test`.
- [x] Run `cd client && npm test`.
- [x] Run `cd client && npm run build`.
- [x] Run `npm run test:e2e`.
- [x] Run `git diff --stat` and `git diff`.
- [x] Create review, release notes, summary.
- [x] Update handoff and health check.

Acceptance criteria:
- Required verification commands are run or documented with exact blockers.
- Final review documents E2E limitations or environment blockers.
- Release notes and summary are created.
- Workflow health is marked Passed, Partial, or Failed.

Acceptance result:
- [x] Required verification commands are run or documented with exact blockers.
- [x] Final review documents E2E limitations or environment blockers.
- [x] Release notes and summary are created.
- [x] Workflow health is marked Passed, Partial, or Failed.

Verification commands:
- `npm test`
- `cd client && npm test`
- `cd client && npm run build`
- `npm run test:e2e`
- `git diff --stat`
- `git diff`
- `git status --short`

Stop condition:
Stop if verification fails and targeted in-scope recovery cannot prove the workflow.

Out-of-scope items:
- Commit creation.

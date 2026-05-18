# Task Plan: High-Priority Booking Lifecycle Fix

## Spec File Used

`_spec/2026-05-14-high-priority-lifecycle-fix.md`

## Planning Date

2026-05-14

## Progress And Summary Files Read

- `_progress/progress.md`
- `_handoff/current.md`
- `_summary/2026-05-14-harden-realtime-dispatch-socket-io.md`
- `docs/PROJECT_CONTEXT.md`

## Dirty Worktree Protection

- Initial `git status --short` before syncing this request was clean.
- Planned source files overlap only with this workflow's intended lifecycle files.
- Current dirty files before implementation are workflow artifacts from this request: `WORK_REQUEST.md`, this spec, and this task plan.
- Overlap risk: low.

## Task List

### TASK-001: Replace backend trip lifecycle statuses

Status: Done

Objective:
Make backend trip completion move from `TRIP_IN_PROGRESS` to `TRIP_ENDED`, client confirmation to `AWAITING_DRIVER_PAYMENT_CONFIRMATION`, and driver cash confirmation through `PAID` to `COMPLETED`.

Files likely affected:
- `server/constants/statuses.js`
- `server/controllers/tripController.js`
- `server/services/bookingLifecycleService.js`
- `server/controllers/bookingController.js`
- `server/models/Booking.js`

Checklist:
- [x] Update backend booking status constants.
- [x] Remove old `TRIP_AWAITING_ARRIVAL_ACK` and `AWAITING_PAYMENT` transition logic.
- [x] Guard end trip with `TRIP_IN_PROGRESS`.
- [x] Guard client confirmation with `TRIP_ENDED`.
- [x] Guard driver payment confirmation with `AWAITING_DRIVER_PAYMENT_CONFIRMATION`.
- [x] Ensure `PAID` is recorded before `COMPLETED`.
- [x] Ensure commission upsert happens before final completion.
- [x] Ensure completed trips set driver lifecycle status to `ACTIVE`.
- [x] Update admin completion override statuses.

Acceptance criteria:
- End trip returns status `TRIP_ENDED`.
- Client confirmation returns status `AWAITING_DRIVER_PAYMENT_CONFIRMATION`.
- Driver payment confirmation returns status `COMPLETED` with `PAID` before `COMPLETED` in history.
- Driver returns `ACTIVE` after completion.
- Invalid status transitions return 409.

Acceptance result:
- [x] End trip returns status `TRIP_ENDED`.
- [x] Client confirmation returns status `AWAITING_DRIVER_PAYMENT_CONFIRMATION`.
- [x] Driver payment confirmation returns status `COMPLETED` with `PAID` before `COMPLETED` in history.
- [x] Driver returns `ACTIVE` after completion.
- [x] Invalid status transitions return 409.

Verification commands:
- `npm test -- --runTestsByPath server/tests/dispatchLifecycle.test.js server/tests/operations.test.js`

Stop condition:
Stop if route compatibility requires changing public API contracts beyond aliases.

Out-of-scope items:
- Historical booking migration.

### TASK-002: Update frontend lifecycle UI

Status: Done

Objective:
Update client, driver, admin, and status-display UI to reflect `TRIP_ENDED` and `AWAITING_DRIVER_PAYMENT_CONFIRMATION` without old arrival acknowledgement UI.

Files likely affected:
- `client/src/constants/statuses.js`
- `client/src/pages/client/ClientCurrentBookingPage.jsx`
- `client/src/pages/driver/DriverWorkspacePage.jsx`
- `client/src/pages/admin/AdminBookingsPage.jsx`
- `client/src/hooks/mutations/useTripMutations.js`
- `client/src/services/tripService.js`
- `client/test/AdminBookingsPage.test.jsx`
- `e2e/helpers/e2eSeed.js`

Checklist:
- [x] Update frontend booking status constants and tones.
- [x] Show fare after `TRIP_ENDED`.
- [x] Show client completion confirmation only on `TRIP_ENDED`.
- [x] Show driver cash confirmation only on `AWAITING_DRIVER_PAYMENT_CONFIRMATION`.
- [x] Remove old arrival acknowledgement UI.
- [x] Update admin completion filters/displays.
- [x] Run `design-taste-frontend` pre-flight.

Acceptance criteria:
- Client cannot confirm completion before `TRIP_ENDED`.
- Driver cannot confirm cash received before client confirmation.
- Admin completion button appears on new completion-ready statuses.
- Old status strings are not used in frontend source or tests.

Acceptance result:
- [x] Client cannot confirm completion before `TRIP_ENDED`.
- [x] Driver cannot confirm cash received before client confirmation.
- [x] Admin completion button appears on new completion-ready statuses.
- [x] Old status strings are not used in frontend source or tests.

Verification commands:
- `npm run test --prefix client`
- `npm run build --prefix client`

Stop condition:
Stop if a required UI route depends on removed backend behavior with no safe alias.

Out-of-scope items:
- Broad redesign or new navigation.

### TASK-003: Update lifecycle tests and close workflow

Status: Done

Objective:
Update backend tests for the required full lifecycle and complete workflow review, release notes, summary, and health check.

Files likely affected:
- `server/tests/dispatchLifecycle.test.js`
- `server/tests/operations.test.js`
- `_progress/progress.md`
- `_handoff/current.md`
- `_review/2026-05-14-high-priority-lifecycle-fix.md`
- `_release/2026-05-14-high-priority-lifecycle-fix.md`
- `_summary/2026-05-14-high-priority-lifecycle-fix.md`

Checklist:
- [x] Update full lifecycle test assertions.
- [x] Update admin override tests.
- [x] Verify commission idempotency coverage remains present or add it.
- [x] Run backend tests.
- [x] Run client build.
- [x] Run final diff audit.
- [x] Create review, release notes, summary, and update handoff.

Acceptance criteria:
- Backend full lifecycle test covers required flow end to end.
- Backend tests pass.
- Client build passes.
- Workflow artifacts are complete.

Acceptance result:
- [x] Backend full lifecycle test covers required flow end to end.
- [x] Backend tests pass.
- [x] Client build passes.
- [x] Workflow artifacts are complete.

Verification commands:
- `npm test`
- `npm run build --prefix client`
- `git diff --stat`
- `git diff`
- `git status --short`

Stop condition:
Stop if full backend tests fail for an unrelated reason that cannot be safely fixed in scope.

Out-of-scope items:
- Browser E2E expansion.

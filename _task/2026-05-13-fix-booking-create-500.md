# Task Plan: Fix Booking Create 500

## Spec File Used

`_spec/2026-05-13-fix-booking-create-500.md`

## Planning Date

2026-05-13

## Progress And Summary Files Read

- `_progress/progress.md`
- `_summary/2026-05-13-fix-auth-register-api-url.md`
- `_handoff/current.md`
- `docs/PROJECT_CONTEXT.md`

## Dirty Worktree Protection

- Existing dirty worktree is broad and includes backend booking files from prior scaffold work.
- Planned files for this workflow: `WORK_REQUEST.md`, `_spec/2026-05-13-fix-booking-create-500.md`, `_task/2026-05-13-fix-booking-create-500.md`, `server/controllers/bookingController.js`, `server/services/assignmentService.js`, `server/tests/dispatchLifecycle.test.js`, `_progress/progress.md`, `_handoff/current.md`, `_review/2026-05-13-fix-booking-create-500.md`, `_release/2026-05-13-fix-booking-create-500.md`, `_summary/2026-05-13-fix-booking-create-500.md`.
- Overlap risk: planned backend files are already dirty from prior scaffold work. Edits must preserve current behavior and only address booking create error handling/validation.

## Task List

### TASK-001: Make booking creation return controlled responses

Status: Done

Objective:
Fix the booking create path so valid frontend booking submissions do not produce an unhandled 500.

Files likely affected:
- `server/controllers/bookingController.js`
- `server/services/assignmentService.js`
- `server/tests/dispatchLifecycle.test.js`

Checklist:
- [x] Reproduce or cover booking creation failure conditions in backend tests.
- [x] Normalize booking input before persistence.
- [x] Ensure invalid booking input returns a structured 400.
- [x] Ensure assignment audit side effects do not break successful booking creation.
- [x] Run backend verification.
- [x] Review the diff for scope and sensitive data.

Acceptance criteria:
- Valid client booking creation returns `201`.
- Valid agent booking creation returns `201`.
- Invalid blank address input returns a controlled 400.
- Assignment audit write failure does not cause `POST /api/bookings` to return 500 after the booking itself is valid.
- Backend tests pass.

Acceptance result:
- [x] Valid client booking creation returns `201`.
- [x] Valid agent booking creation returns `201`.
- [x] Invalid blank address input returns a controlled 400.
- [x] Assignment audit write failure does not cause `POST /api/bookings` to return 500 after the booking itself is valid.
- [x] Backend tests pass.

Verification commands:
- `npm test`

Stop condition:
- Stop if the failure requires unavailable production data access or a destructive database migration.

Out-of-scope items:
- UI changes.
- Deployment changes.
- Schema migrations.

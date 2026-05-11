# Task Plan: Taxify Brief Audit And MVP Remediation

## Spec File Used

`_spec/2026-05-13-taxify-brief-audit-remediation.md`

## Planning Date

2026-05-13

## Progress And Summary Files Read

- `_handoff/current.md`
- `_progress/progress.md`
- `_summary/2026-05-13-taxify-full-mern-platform.md`
- `_summary/2026-05-13-fix-booking-create-500.md`
- `docs/PROJECT_CONTEXT.md`
- `docs/ARCHITECTURE.md`
- `docs/VERIFY.md`
- `_decisions/2026-05-13-rest-first-taxify-platform.md`

## Baseline Verification

- Initial sandboxed `npm test`, `cd client && npm test`, and `cd client && npm run build` failed with `EPERM: operation not permitted, lstat 'C:\Users\laura.bolas'`.
- Escalated `npm test` passed: 3 suites, 8 tests.
- Escalated `cd client && npm test` passed: 1 suite, 1 test.
- Escalated `cd client && npm run build` passed.

## Dirty Worktree Protection

- `git -c core.excludesfile= status --short` showed only `M WORK_REQUEST.md` at planning time.
- Planned files overlap only with workflow artifact changes and implementation files intentionally touched by this workflow.
- No unrelated dirty implementation files were detected.

## Task List

### TASK-001: Add admin booking lifecycle overrides

Status: Done

Objective:
Add REST-first admin booking controls for reassigning and completing eligible bookings while preserving driver lifecycle and payment ordering.

Files likely affected:
- `server/controllers/bookingController.js`
- `server/routes/bookingRoutes.js`
- `server/services/assignmentService.js`
- `server/tests/dispatchLifecycle.test.js`
- `server/tests/operations.test.js`

Checklist:
- [x] Add safe backend service/controller behavior for admin reassign.
- [x] Add safe backend controller behavior for admin complete override.
- [x] Keep PAID lifecycle represented before final completion.
- [x] Expand backend tests for reassign, complete override, and lifecycle ordering.
- [x] Run targeted and full backend tests.

Acceptance criteria:
- [x] Admin can reassign a pre-trip booking and the prior driver is released.
- [x] Reassignment chooses another approved active driver when one exists.
- [x] Reassignment queues the booking when no driver is available.
- [x] Admin can complete only after fare and client confirmation prerequisites are met, then records admin cash override.
- [x] Driver payment confirmation records the `PAID` state before final `COMPLETED` persistence.
- [x] Backend tests pass.

Acceptance result:
- [x] All criteria met.

Verification commands:
- `npm test -- --runTestsByPath server/tests/dispatchLifecycle.test.js server/tests/operations.test.js`
- `npm test`

Stop condition:
Stop if lifecycle changes require a destructive migration or conflict with existing accepted tests.

Out-of-scope items:
- Real-time event broadcasting.
- New booking status names beyond the project brief.

### TASK-002: Expose admin booking controls in the UI

Status: Done

Objective:
Update the admin booking screen and booking service hooks so admins can use retry/reassign, cancel, dispute, and complete override controls from the MVP UI.

Files likely affected:
- `client/src/services/bookingService.js`
- `client/src/pages/admin/AdminBookingsPage.jsx`
- `client/src/components/shared/StatusPanel.jsx`
- `client/test/App.test.jsx` or new focused frontend tests

Checklist:
- [x] Add service methods for any new booking endpoints.
- [x] Add admin actions to the bookings page with responsive wrapping.
- [x] Show mutation errors or pending feedback where practical.
- [x] Add focused frontend test coverage for admin booking controls or core screen states.
- [x] Run frontend tests and build.

Acceptance criteria:
- [x] Admin bookings page exposes brief-aligned controls.
- [x] UI remains responsive and uses existing Tailwind component patterns.
- [x] Loading, empty, and error state conventions remain intact.
- [x] Frontend tests cover at least one MVP screen beyond login.
- [x] Frontend tests and build pass.

Acceptance result:
- [x] All criteria met.

Verification commands:
- `cd client && npm test`
- `cd client && npm run build`

Stop condition:
Stop if frontend changes require a new dependency or a broader redesign.

Out-of-scope items:
- Full visual redesign.
- End-to-end browser tests.

### TASK-003: Final audit, documentation, and workflow closure

Status: Done

Objective:
Run final verification, audit the diff, document completed remediation, and close workflow artifacts.

Files likely affected:
- `_progress/progress.md`
- `_handoff/current.md`
- `_review/2026-05-13-taxify-brief-audit-remediation.md`
- `_release/2026-05-13-taxify-brief-audit-remediation.md`
- `_summary/2026-05-13-taxify-brief-audit-remediation.md`
- `docs/PROJECT_CONTEXT.md` if durable facts changed

Checklist:
- [x] Run backend tests.
- [x] Run frontend tests.
- [x] Run frontend build.
- [x] Run `git diff --stat`.
- [x] Run `git diff`.
- [x] Create review file.
- [x] Create release notes.
- [x] Create summary.
- [x] Update handoff.
- [x] Run workflow health check.

Acceptance criteria:
- [x] All required verification passes or blockers are documented.
- [x] Final diff matches the saved spec and task plan.
- [x] Progress, handoff, review, release notes, and summary are updated.
- [x] Workflow health is recorded.

Acceptance result:
- [x] All criteria met.

Verification commands:
- `npm test`
- `cd client && npm test`
- `cd client && npm run build`
- `git diff --stat`
- `git diff`
- `git -c core.excludesfile= status --short`

Stop condition:
Stop if final verification exposes an unrelated failure that cannot be safely separated from this workflow.

Out-of-scope items:
- Commit creation.

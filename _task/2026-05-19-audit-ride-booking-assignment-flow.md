# Task Plan: Audit And Fix Ride Booking Assignment Queue

## Spec File Used

`_spec/2026-05-19-audit-ride-booking-assignment-flow.md`

## Planning Date

2026-05-19

## Progress And Summary Files Read

- `_progress/progress.md`
- `_handoff/current.md`
- `_summary/2026-05-14-harden-realtime-dispatch-socket-io.md`
- `_summary/2026-05-14-high-priority-lifecycle-fix.md`
- `docs/PROJECT_CONTEXT.md`
- `docs/ARCHITECTURE.md`

## Request Classification

- Type: `bugfix`
- Scope: `medium`
- Risk: `medium`
- Execution mode: `complete-workflow`
- Implementation allowed after saved spec and plan: yes
- Open question blocks implementation: no; available-driver definition follows existing repo constants.

## Dirty Worktree Protection

- Initial `git status --short` after syncing active request: `M WORK_REQUEST.md`.
- Existing dirty files: `WORK_REQUEST.md`, created by this workflow.
- Planned files: `server/services/assignmentService.js`, `server/controllers/driverController.js`, `server/tests/dispatchLifecycle.test.js`, workflow artifacts.
- Overlap risk: no user-authored dirty implementation files detected.

## Audit Finding

The existing flow already queues bookings when no approved active driver exists and assigns immediately when one exists. The gap is that queued bookings are not automatically retried when a driver later becomes active or is approved. Manual admin/agent retry exists, but driver availability changes do not drain the queue.

## Tasks

### TASK-001: Assign one queued booking when a driver becomes available

Status: Done

Objective:
When an approved driver becomes `ACTIVE`, assign the oldest queued booking to that driver and mark the driver `ASSIGNED`.

Files likely affected:
- `server/services/assignmentService.js`
- `server/controllers/driverController.js`
- `server/tests/dispatchLifecycle.test.js`

Checklist:
- [x] Add a focused assignment-service helper that assigns the oldest queued/pending booking to a specific approved active driver.
- [x] Call the helper after driver self-service availability changes to `ACTIVE`.
- [x] Call the helper after admin approval/status changes make a driver approved and `ACTIVE`.
- [x] Preserve existing API response shape for driver profile updates.
- [x] Emit existing populated realtime booking assignment event when a queued booking is assigned.
- [x] Add backend coverage for queued booking assignment on driver availability.
- [x] Add backend coverage for rejection returning booking to `QUEUED` when no alternate driver exists.

Acceptance criteria:
- An existing queued booking is assigned when an approved driver switches from `OFFLINE` to `ACTIVE`.
- Admin approval that makes a driver active assigns an existing queued booking.
- If an assigned driver rejects and no other active approved driver exists, the booking status becomes `QUEUED` and `assignedDriver` is cleared.
- Existing immediate assignment on booking creation remains covered.
- Backend targeted lifecycle tests pass.

Acceptance result:
- [x] An existing queued booking is assigned when an approved driver switches from `OFFLINE` to `ACTIVE`.
- [x] Admin approval that makes a driver active assigns an existing queued booking.
- [x] If an assigned driver rejects and no other active approved driver exists, the booking status becomes `QUEUED` and `assignedDriver` is cleared.
- [x] Existing immediate assignment on booking creation remains covered.
- [x] Backend targeted lifecycle tests pass.

Verification commands:
- `npm test -- --runTestsByPath server/tests/dispatchLifecycle.test.js`
- `npm test`

Stop condition:
Stop if assignment requires changing public API response shapes or if tests reveal unrelated failing backend behavior that cannot be safely fixed in scope.

Out-of-scope items:
- Driver proximity matching.
- Background queue worker.
- Frontend redesign.

### TASK-002: Close the workflow with final audit artifacts

Status: Done

Objective:
Run final diff audit, create review/release/summary artifacts, and update handoff.

Files likely affected:
- `_task/2026-05-19-audit-ride-booking-assignment-flow.md`
- `_progress/progress.md`
- `_handoff/current.md`
- `_review/2026-05-19-audit-ride-booking-assignment-flow.md`
- `_release/2026-05-19-audit-ride-booking-assignment-flow.md`
- `_summary/2026-05-19-audit-ride-booking-assignment-flow.md`

Checklist:
- [x] Run `git diff --stat`.
- [x] Run `git diff`.
- [x] Document final audit findings.
- [x] Create review file.
- [x] Create release notes.
- [x] Create summary file.
- [x] Update handoff and workflow health.

Acceptance criteria:
- Final diff audit is documented.
- Review, release notes, summary, progress, and handoff are updated.
- Workflow health is recorded.

Acceptance result:
- [x] Final diff audit is documented.
- [x] Review, release notes, summary, progress, and handoff are updated.
- [x] Workflow health is recorded.

Verification commands:
- `git diff --stat`
- `git diff`
- `git status --short`

Stop condition:
Stop if final diff contains unexpected implementation files, generated junk, or sensitive values.

Out-of-scope items:
- New implementation beyond defects found during review.

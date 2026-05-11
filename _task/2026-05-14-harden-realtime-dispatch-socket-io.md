# Task Plan: Harden Socket.IO Realtime Dispatch

## Spec File Used

`_spec/2026-05-14-harden-realtime-dispatch-socket-io.md`

## Planning Date

2026-05-14

## Progress And Summary Files Read

- `_handoff/current.md`
- `_progress/progress.md`
- `_summary/2026-05-14-realtime-dispatch-socket-io.md`
- `docs/PROJECT_CONTEXT.md`

## Dirty Worktree Protection

Initial `git status --short` was clean before syncing this request. Planned files are realtime backend source/tests, realtime frontend hook/socket tests, and workflow artifacts. No pre-existing dirty-file overlap was detected.

## Task List

### TASK-001: Normalize booking realtime payloads

Status: Done

Objective:
Add a reusable booking realtime serializer/population helper and make `server/realtime/socket.js` build the stable payload contract.

Files likely affected:
- `server/realtime/socket.js`
- `server/realtime/bookingPayload.js`
- `server/tests/socket.test.js`

Checklist:
- Add helper that safely serializes bookings and strips sensitive/internal auth fields.
- Ensure `bookingId` is always a string when present.
- Ensure `timestamp` is an ISO string.
- Export helper functions for tests and lifecycle emitters.
- Add/adjust tests for contract shape.

Acceptance criteria:
- Stable payload contract is implemented.
- Serialized booking payloads do not expose sensitive auth fields.
- Socket auth tests still pass.

Acceptance result:
- [x] Stable payload contract is implemented.
- [x] Serialized booking payloads do not expose sensitive auth fields.
- [x] Socket auth tests still pass.

Verification commands:
- `npm test -- --runTestsByPath server/tests/socket.test.js`

Stop condition:
Stop if payload serialization would require changing REST response shapes.

Out-of-scope items:
- REST controller response changes.
- Schema changes.

### TASK-002: Reduce duplicate lifecycle emissions

Status: Done

Objective:
Emit one final useful creation event, one final reassignment event, and one rejection outcome sequence.

Files likely affected:
- `server/services/assignmentService.js`
- `server/controllers/bookingController.js`
- `server/controllers/tripController.js`
- `server/tests/dispatchLifecycle.test.js`

Checklist:
- Add assignment-service `suppressRealtime` option.
- Suppress assignment/queued event during booking creation and emit `booking:created` once with final status.
- Suppress intermediate assignment/queued event during reassign and emit `booking:reassigned` once.
- Keep driver rejection event plus final assigned/queued outcome event.
- Add focused backend lifecycle emission assertions.

Acceptance criteria:
- Booking creation emits one final `booking:created` event.
- Reassignment emits one final `booking:reassigned` event.
- Driver rejection emits `booking:rejected` then one final outcome event.
- Backend lifecycle tests pass.

Acceptance result:
- [x] Booking creation emits one final `booking:created` event.
- [x] Reassignment emits one final `booking:reassigned` event.
- [x] Driver rejection emits `booking:rejected` then one final outcome event.
- [x] Backend lifecycle tests pass.

Verification commands:
- `npm test -- --runTestsByPath server/tests/dispatchLifecycle.test.js server/tests/socket.test.js`

Stop condition:
Stop if duplicate cleanup requires removing a UI-required event without a replacement payload.

Out-of-scope items:
- Renaming event names or statuses.

### TASK-003: Harden frontend realtime cache tests and behavior

Status: Done

Objective:
Improve the realtime booking hook to insert/update cached booking lists and expand Vitest coverage for hook subscriptions, cleanup, cache updates, invalidation, and socket creation.

Files likely affected:
- `client/src/hooks/useRealtimeBookings.js`
- `client/src/lib/socket.js`
- `client/test/realtimeBookings.test.jsx`

Checklist:
- Replace cached bookings when `payload.booking` exists.
- Insert new payload bookings into existing lists if absent.
- Avoid duplicates.
- Preserve newest-first order by `createdAt` where possible.
- Invalidate bookings after realtime booking events.
- Test all event subscriptions and cleanup.
- Test socket origin/token/null-token behavior.

Acceptance criteria:
- All booking realtime events are subscribed on mount.
- Handlers are removed on unmount.
- Matching cached booking is updated.
- New payload booking is inserted without duplication.
- Booking queries are invalidated.
- Socket connection helper tests pass.

Acceptance result:
- [x] All booking realtime events are subscribed on mount.
- [x] Handlers are removed on unmount.
- [x] Matching cached booking is updated.
- [x] New payload booking is inserted without duplication.
- [x] Booking queries are invalidated.
- [x] Socket connection helper tests pass.

Verification commands:
- `npm run test --prefix client`

Stop condition:
Stop if frontend cache update requires changing query key conventions broadly.

Out-of-scope items:
- Page component API/socket logic.
- Redux booking state.
- Visual redesign.

### TASK-004: Run final verification and close workflow

Status: Done

Objective:
Run required verification, audit the diff, and create review, release notes, summary, and updated handoff.

Files likely affected:
- `_task/2026-05-14-harden-realtime-dispatch-socket-io.md`
- `_progress/progress.md`
- `_handoff/current.md`
- `_review/2026-05-14-harden-realtime-dispatch-socket-io.md`
- `_release/2026-05-14-harden-realtime-dispatch-socket-io.md`
- `_summary/2026-05-14-harden-realtime-dispatch-socket-io.md`

Checklist:
- Run `npm test`.
- Run `npm run test --prefix client`.
- Run final `git diff --stat` and `git diff`.
- Create review file.
- Create release notes.
- Create summary.
- Update handoff and workflow health.

Acceptance criteria:
- Required verification is complete or documented.
- Final diff audit is complete.
- Workflow artifacts are complete.
- Workflow health is recorded.

Acceptance result:
- [x] Required verification is complete or documented.
- [x] Final diff audit is complete.
- [x] Workflow artifacts are complete.
- [x] Workflow health is recorded.

Verification commands:
- `npm test`
- `npm run test --prefix client`
- `git diff --stat`
- `git diff`
- `git status --short`

Stop condition:
Stop if required verification fails after targeted in-scope recovery.

Out-of-scope items:
- Commit creation.
- Deployment changes.

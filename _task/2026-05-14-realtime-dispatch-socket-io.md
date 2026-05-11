# Task Plan: Realtime Dispatch Socket.IO Layer

## Spec File Used

`_spec/2026-05-14-realtime-dispatch-socket-io.md`

## Planning Date

2026-05-14

## Progress And Summary Files Read

- `_handoff/current.md`
- `_progress/progress.md`
- `_summary/2026-05-13-taxify-brief-audit-remediation.md`
- `docs/PROJECT_CONTEXT.md`

## Dirty Worktree Protection

- Initial `git status --short` was clean before syncing this request.
- `WORK_REQUEST.md`, this spec, and this task plan became intentionally dirty during planning.
- Planned files overlap only with intentional workflow artifacts and the realtime implementation paths listed below.
- No unrelated user changes are present at planning time.

## Execution Mode

`complete-workflow`

## Task List

### TASK-001: Add authenticated Socket.IO server

Status: Done

Objective:
Start the backend through an HTTP server, attach Socket.IO, authenticate sockets with existing JWT/User rules, join role/user/driver rooms, and expose focused emission helpers.

Files likely affected:
- `package.json`
- `package-lock.json`
- `server/server.js`
- `server/realtime/socket.js`
- `server/tests/socket.test.js`

Checklist:
- [x] Install `socket.io`.
- [x] Refactor `server/server.js` to create an HTTP server and attach Socket.IO.
- [x] Keep Express app export and route behavior unchanged.
- [x] Add socket authentication using `handshake.auth.token`.
- [x] Join role, user, and driver rooms.
- [x] Add helper emit functions.
- [x] Add focused socket auth and helper tests.

Acceptance criteria:
- Socket connections without/with invalid token are rejected.
- Active users connect and join expected rooms.
- Explicit inactive users are rejected.
- Missing `status` users are accepted for backward compatibility.
- Helper functions emit to expected rooms with the required event payload shape.

Acceptance result:
- [x] Socket auth rejection and acceptance verified.
- [x] Helper emissions verified.
- [x] Existing REST app behavior preserved.

Verification commands:
- `npm test -- --runTestsByPath server/tests/socket.test.js`
- `npm test`

Stop condition:
Stop if HTTP server refactor breaks existing backend tests or socket auth cannot share existing JWT/User behavior safely.

Out-of-scope items:
- Redis Socket.IO adapter.
- E2E browser socket tests.

### TASK-002: Emit booking lifecycle events from backend

Status: Done

Objective:
Publish realtime booking/trip/payment events from existing lifecycle state-change points without changing REST responses.

Files likely affected:
- `server/realtime/socket.js`
- `server/services/assignmentService.js`
- `server/controllers/bookingController.js`
- `server/controllers/tripController.js`
- `server/tests/dispatchLifecycle.test.js`
- `server/tests/socket.test.js`

Checklist:
- [x] Emit created/queued/assigned during booking creation and assignment.
- [x] Emit accepted/rejected/reassigned from driver/admin lifecycle paths.
- [x] Emit cancelled/disputed/completed from booking controller paths.
- [x] Emit trip started/ended and payment confirmation events from trip controller paths.
- [x] Include populated booking where already available or cheap.
- [x] Add one happy-path lifecycle event test.

Acceptance criteria:
- Creating a booking emits `booking:queued` or `booking:assigned`.
- Driver accept/start/end emits relevant realtime events.
- Client and driver payment confirmations emit relevant realtime events.
- REST responses keep existing JSON shape.
- No booking lifecycle status names change.

Acceptance result:
- [x] Booking create event verified.
- [x] Driver lifecycle event verified.
- [x] Payment lifecycle event verified.
- [x] REST shape remains backward compatible.

Verification commands:
- `npm test -- --runTestsByPath server/tests/dispatchLifecycle.test.js server/tests/socket.test.js`
- `npm test`

Stop condition:
Stop if event emission requires expensive population on hot paths or changes REST lifecycle semantics.

Out-of-scope items:
- Exhaustive socket test for every controller action.

### TASK-003: Add frontend realtime socket integration

Status: Done

Objective:
Add Socket.IO client connection management, booking event cache handling, and provider wiring through existing TanStack Query patterns.

Files likely affected:
- `client/package.json`
- `client/package-lock.json`
- `client/src/lib/socket.js`
- `client/src/realtime/SocketProvider.jsx`
- `client/src/hooks/useRealtimeBookings.js`
- `client/src/redux/providers.jsx`
- `client/test/realtimeBookings.test.jsx`

Checklist:
- [x] Install `socket.io-client`.
- [x] Create socket client module using `VITE_API_URL` origin or current origin fallback.
- [x] Connect with `localStorage.taxify_token`.
- [x] Reconnect/disconnect on auth token changes.
- [x] Invalidate or update booking query caches on booking lifecycle events.
- [x] Add Vitest tests with mocked `socket.io-client`.

Acceptance criteria:
- Socket connects only when a token is present.
- Token changes cause reconnect/logout disconnect behavior.
- Booking lifecycle events invalidate or update booking queries.
- No API logic is added to page components.
- No Redux server-state duplication is introduced.

Acceptance result:
- [x] Client socket auth token behavior verified.
- [x] Booking query invalidation/update verified.
- [x] Provider wiring verified.

Verification commands:
- `cd client && npm test`

Stop condition:
Stop if socket client wiring causes tests to require a live backend.

Out-of-scope items:
- Browser E2E socket suite.

### TASK-004: Show realtime connection state in AppShell

Status: Done

Objective:
Display a compact connected/reconnecting/offline realtime indicator in the existing shell without redesigning the UI.

Files likely affected:
- `client/src/components/shared/AppShell.jsx`
- `client/src/realtime/SocketProvider.jsx`
- `client/test/App.test.jsx`

Checklist:
- [x] Expose socket connection state through a small hook/context API.
- [x] Add compact indicator to the header.
- [x] Preserve existing navigation layout and responsive behavior.
- [x] Update tests where needed.

Acceptance criteria:
- AppShell shows connected, reconnecting, and offline states.
- Indicator is accessible and does not disrupt navigation.
- Existing AppShell tests pass.

Acceptance result:
- [x] Indicator states implemented.
- [x] Frontend tests pass.
- [x] Design pre-flight completed.

Verification commands:
- `cd client && npm test`
- `cd client && npm run build`

Stop condition:
Stop if adding the indicator requires broad shell redesign.

Out-of-scope items:
- New dashboard widgets.

### TASK-005: Verify, review, and close workflow

Status: Done

Objective:
Run final verification, audit the diff, create review/release/summary artifacts, and update handoff.

Files likely affected:
- `_task/2026-05-14-realtime-dispatch-socket-io.md`
- `_progress/progress.md`
- `_handoff/current.md`
- `_review/2026-05-14-realtime-dispatch-socket-io.md`
- `_release/2026-05-14-realtime-dispatch-socket-io.md`
- `_summary/2026-05-14-realtime-dispatch-socket-io.md`
- `docs/PROJECT_CONTEXT.md`

Checklist:
- [x] Run backend tests.
- [x] Run frontend tests.
- [x] Run frontend build.
- [x] Smoke-check `npm run dev` startup as practical.
- [x] Run final diff audit.
- [x] Create review file.
- [x] Create release notes.
- [x] Create summary.
- [x] Update handoff and workflow health.

Acceptance criteria:
- Required verification is run or documented.
- Review, release notes, summary, and handoff are current.
- Final diff audit documents scope, tests, secrets, and generated files.
- Workflow health is recorded.

Acceptance result:
- [x] Final verification completed.
- [x] Workflow artifacts completed.
- [x] Health check recorded.

Verification commands:
- `npm test`
- `cd client && npm test`
- `cd client && npm run build`
- `npm run dev` smoke startup or documented limitation
- `git diff --stat`
- `git diff`
- `git status --short`

Stop condition:
Stop if final verification fails and targeted recovery cannot prove the implementation.

Out-of-scope items:
- Commit creation unless explicitly requested.

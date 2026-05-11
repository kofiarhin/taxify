# Summary: Fix Booking Create 500

## Request

Fix `bookingService.js:5 POST http://localhost:5000/api/bookings 500 (Internal Server Error)`.

## Spec File Used

`_spec/2026-05-13-fix-booking-create-500.md`

## Task Plan Used

`_task/2026-05-13-fix-booking-create-500.md`

## Review File Used

`_review/2026-05-13-fix-booking-create-500.md`

## Release Notes File Used

`_release/2026-05-13-fix-booking-create-500.md`

## Tasks Completed

- `BOOKING-500 TASK-001`

## Files Changed

- `WORK_REQUEST.md`
- `_spec/2026-05-13-fix-booking-create-500.md`
- `_task/2026-05-13-fix-booking-create-500.md`
- `_progress/progress.md`
- `_handoff/current.md`
- `_review/2026-05-13-fix-booking-create-500.md`
- `_release/2026-05-13-fix-booking-create-500.md`
- `_summary/2026-05-13-fix-booking-create-500.md`
- `server/controllers/bookingController.js`
- `server/services/assignmentService.js`
- `server/tests/dispatchLifecycle.test.js`

## Verification Run

- Initial `npm test -- --runTestsByPath server/tests/dispatchLifecycle.test.js` reproduced the 500 failures.
- After fixes, `npm test -- --runTestsByPath server/tests/dispatchLifecycle.test.js` passed.
- `npm test` passed.
- `git diff --stat` completed.
- Targeted `git diff` for workflow files completed.
- `git status --short` completed.

## Acceptance Results

- [x] Valid client booking creation returns `201`.
- [x] Valid agent booking creation returns `201`.
- [x] Invalid blank address input returns a controlled 400.
- [x] Assignment audit write failure does not cause `POST /api/bookings` to return 500 after the booking itself is valid.
- [x] Backend tests pass.

## Failure Recovery Notes

The failing command was `npm test -- --runTestsByPath server/tests/dispatchLifecycle.test.js`. It failed with 500 responses where the new tests expected 400 and 201. The failures were in scope and fixed by trimming booking input validation and making assignment audit writes non-blocking. The exact failing command passed after the fix.

## Final Diff Audit

Full diff audit still shows the broad pre-existing dirty worktree. Targeted workflow changes are scoped to booking create backend behavior, backend tests, and workflow artifacts. No secrets were added.

## Unresolved Issues

- The exact stack trace from the user's running backend was not available.
- Broad pre-existing dirty worktree remains.

## Next Recommended Work

Restart the backend server and retry creating a booking from the client or agent page.

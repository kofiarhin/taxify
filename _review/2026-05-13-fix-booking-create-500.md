# Review: Fix Booking Create 500

## Request

Fix `bookingService.js:5 POST http://localhost:5000/api/bookings 500 (Internal Server Error)`.

## Spec File Used

`_spec/2026-05-13-fix-booking-create-500.md`

## Task Plan Used

`_task/2026-05-13-fix-booking-create-500.md`

## Tasks Reviewed

- `BOOKING-500 TASK-001: Make booking creation return controlled responses`

## Bugs Found

Two in-scope failure paths were reproduced and fixed:

- Whitespace-only address input passed Zod validation, reached Mongoose trimming/required validation, and returned an unhandled 500.
- Assignment audit write failure caused booking creation to return 500 after the booking itself was otherwise valid.

## Scope Creep Check

Scope respected. Changes were limited to booking input validation, assignment audit side-effect handling, focused backend tests, and workflow artifacts.

## Final Diff Audit

- `git diff --stat` completed and still shows the large pre-existing dirty baseline: 213 files changed, 7,704 insertions, 22,890 deletions.
- Targeted diff completed for this workflow's planned files. Because the tracked baseline predates the current scaffold, backend files show large historical replacement diffs, but this workflow's functional edits are limited to `server/controllers/bookingController.js`, `server/services/assignmentService.js`, and `server/tests/dispatchLifecycle.test.js`.
- Workflow artifacts were created and updated.
- No generated junk or temporary files were added.
- No secrets were added.

## Failure Recovery Notes

Initial targeted verification failed:

- Command: `npm test -- --runTestsByPath server/tests/dispatchLifecycle.test.js`
- Failures: expected 400/201 responses received 500 for blank address input and assignment audit write failure.
- Classification: in-scope.
- Fix: trim booking validation inputs before persistence and make assignment audit attempts non-blocking.
- Exact rerun: `npm test -- --runTestsByPath server/tests/dispatchLifecycle.test.js` passed.

## Missing Tests

No missing in-scope backend tests. Frontend tests were not run because no frontend files were changed.

## Security Concerns

No sensitive fields or secrets were exposed. Production still receives generic 500 messaging for truly unexpected errors.

## Architecture Concerns

Assignment attempts are now best-effort audit records. Critical booking/driver state writes remain blocking.

## Follow-Up Tasks

- Inspect live server logs if a different 500 appears after this fix, because the user's exact stack trace was not available.

## Final Review Verdict

Passed. The reproduced booking-create 500 paths are fixed and backend verification passed.

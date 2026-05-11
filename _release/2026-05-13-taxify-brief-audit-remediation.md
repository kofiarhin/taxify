# Release Notes: Taxify Brief Audit And MVP Remediation

## Request

Audit Taxify against `taxify-project-brief.md`, remediate missing MVP REST features, and ensure matching tests pass.

## User-Facing Changes

- Admin booking screen now exposes retry, reassign, complete, cancel, and dispute controls.
- Admins can reassign pre-trip bookings to another active approved driver.
- Admins can complete eligible post-trip bookings after client confirmation as a cash-payment override.
- Booking lifecycle now records auditable status history, including `PAID` before `COMPLETED`.

## Developer Changes

- Added `server/services/bookingLifecycleService.js`.
- Added `Booking.statusHistory`.
- Centralized booking status transition recording for touched assignment, trip, complaint, and admin booking flows.
- Added backend coverage for reassignment, admin completion override, and paid/completed ordering.
- Added frontend coverage for admin booking controls and empty state.
- Updated durable project context.

## New Routes/APIs

- `POST /api/bookings/:bookingId/reassign` admin only.
- `POST /api/bookings/:bookingId/complete` admin only.

## New Env Vars

none

## Database/Schema Changes

- Added optional `Booking.statusHistory[]` subdocuments with `status`, `changedAt`, `actor`, and `note`.

## Dependencies Added/Removed

none

## Test Commands Run

- `npm test -- --runTestsByPath server/tests/dispatchLifecycle.test.js server/tests/operations.test.js`
- `npm test`
- `cd client && npm test`
- `cd client && npm run build`

## Known Limitations

- Real-time updates remain out of scope for this REST MVP.
- Commission receipts remain metadata-only.
- No E2E browser workflow suite exists yet.

## Follow-Up Work

- Add Socket.IO event publishing from lifecycle transition points when approved.
- Add E2E coverage for the main client, driver, agent, and admin flows.

## Suggested Commit Message

`feat: align booking lifecycle with Taxify MVP brief`

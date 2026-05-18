# Release Notes: High-Priority Booking Lifecycle Fix

## Request

Align Taxify booking, trip, and cash-payment lifecycle with the required statuses and flow.

## User-Facing Changes

- Clients now see the calculated fare after `TRIP_ENDED`.
- Clients confirm trip completion on `TRIP_ENDED`.
- Drivers confirm cash received only after client trip-completion confirmation.
- Old arrival acknowledgement UI was removed.
- Admin booking completion controls now use the new driver-payment-confirmation status.

## Developer Changes

- Backend status constants now include `TRIP_ENDED`, `AWAITING_CLIENT_CONFIRMATION`, and `AWAITING_DRIVER_PAYMENT_CONFIRMATION`.
- Old `TRIP_AWAITING_ARRIVAL_ACK` and `AWAITING_PAYMENT` lifecycle logic was replaced.
- Driver payment confirmation records `PAID`, creates commission idempotently, then records `COMPLETED`.
- Completed bookings return the assigned driver to `ACTIVE`.
- Backend lifecycle and admin override tests were updated for the required flow.

## New Routes/APIs

- `POST /api/trips/:bookingId/client-confirmed` added as a semantic alias for client trip-completion confirmation.
- Existing `/api/trips/:bookingId/client-arrived` and `/api/trips/:bookingId/client-paid` remain compatible aliases.

## New Env Vars

none

## Database/Schema Changes

No schema fields were added. `Booking.status` enum values changed to the required lifecycle statuses.

## Dependencies Added/Removed

none

## Test Commands Run

- `npm test -- --runTestsByPath server/tests/dispatchLifecycle.test.js server/tests/operations.test.js`
- `npm run test --prefix client`
- `npm run build --prefix client`
- `npm test`
- `rg "TRIP_AWAITING_ARRIVAL_ACK|AWAITING_PAYMENT" server client\src client\test e2e -g "*.js" -g "*.jsx"`
- `git diff --stat`
- targeted `git diff`
- `git status --short`

## Known Limitations

- Historical bookings stored with removed status values may need a data migration before production rollout.
- Existing `arrival.clientMarkedAt` still stores client trip-completion confirmation for compatibility.

## Follow-Up Work

- Add a production data migration plan for old lifecycle statuses if needed.
- Run the updated Playwright E2E lifecycle suite before release if browser coverage is required.

## Suggested Commit Message

`fix: align booking lifecycle statuses`

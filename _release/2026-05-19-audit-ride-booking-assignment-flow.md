# Release Notes: Audit And Fix Ride Booking Assignment Queue

## Request

Audit and fix the ride booking assignment flow so bookings queue when no driver is available and are assigned when a driver becomes available.

## User-Facing Changes

- Queued ride bookings are now automatically assigned when an approved driver becomes active.
- Admin approval that makes a driver active can now assign the oldest queued booking.
- If a driver rejects a booking and no replacement driver is available, the booking returns to the queue instead of being cancelled.

## Developer Changes

- Added `assignQueuedBookingToDriver` in `server/services/assignmentService.js`.
- Driver self-service availability updates now trigger queue assignment only when the driver becomes active.
- Admin driver approval/status updates now trigger queue assignment only when the driver becomes approved and active.
- Added backend lifecycle tests for queued assignment and no-replacement rejection.

## New Routes/APIs

none

## New Env Vars

none

## Database/Schema Changes

none

## Dependencies Added/Removed

none

## Test Commands Run

- `npm test -- --runTestsByPath server/tests/dispatchLifecycle.test.js` passed.
- `npm test` passed.

## Known Limitations

- Assignment still uses the existing approved-active driver rule and oldest queued booking ordering.
- No geospatial/nearest-driver matching was added.
- No background worker or distributed lock was added.

## Follow-Up Work

- Add E2E coverage for queued bookings being assigned when a driver becomes available.
- Consider atomic queue claiming before scaling dispatch across multiple backend instances.

## Suggested Commit Message

`fix: assign queued bookings when drivers become available`

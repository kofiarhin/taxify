# Release Notes: Fix Booking Create 500

## Request

Fix `bookingService.js:5 POST http://localhost:5000/api/bookings 500 (Internal Server Error)`.

## User-Facing Changes

- Booking creation no longer returns an internal server error for whitespace-only address input.
- Valid bookings still succeed if the non-critical assignment audit log write fails.

## Developer Changes

- Booking create validation now trims passenger and address fields before persistence.
- Assignment attempt audit writes are non-blocking and logged outside test mode.
- Added backend regression tests for blank address validation and assignment audit failure.

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

- The user's exact live backend stack trace was not available. This fix covers reproduced 500 paths in booking creation.

## Follow-Up Work

- Check live backend logs if another distinct 500 remains.

## Suggested Commit Message

`fix: handle booking create validation and audit failures`

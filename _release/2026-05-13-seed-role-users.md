# Release Notes: Seed Role Users

## Request

Generate a script and seed admin, client, driver, and agent users.

## User-Facing Changes

No UI changes.

## Developer Changes

- Updated `server/scripts/seedUsers.js` to create/update one user per role.
- Added approved active driver profile seeding.
- Added production guard and clean MongoDB disconnect handling.
- Added configurable seed password via `SEED_PASSWORD`.
- Added optional password reset control via `RESET_SEEDED_PASSWORDS=false`.

## New Routes/APIs

none

## New Env Vars

- `SEED_PASSWORD` optional
- `RESET_SEEDED_PASSWORDS` optional
- `ALLOW_PRODUCTION_SEED` optional

## Database/Schema Changes

none

## Dependencies Added/Removed

none

## Test Commands Run

- `npm test` passed.
- `npm run seed:users` attempted and failed because MongoDB was unavailable at `127.0.0.1:27017`.

## Known Limitations

Actual seeding requires a reachable MongoDB connection through root `.env` or shell env vars.

## Follow-up Work

Run `npm run seed:users` after MongoDB is running.

## Suggested Commit Message

`chore: add idempotent role user seed script`

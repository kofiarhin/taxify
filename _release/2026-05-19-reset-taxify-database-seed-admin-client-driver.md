# Release Notes: Reset Taxify Database And Seed Role Users

## Request

Reset the Taxify database configured by root `.env` and seed users with password `password`.

## User-Facing Changes

Seeded local/development login users now exist in the configured Taxify database:

- Admin: `admin@taxify.local`
- Client: `client@taxify.local`
- Driver: `driver@taxify.local`

The existing seed also creates an agent user: `agent@taxify.local`.

## Developer Changes

No application code changed. Workflow artifacts were added/updated to document the reset and verification.

## New Routes/APIs

none

## New Env Vars

none

## Database/Schema Changes

No schema changes. Existing data in the configured root `.env` database was deleted from non-system collections, then existing seed users were recreated.

## Dependencies Added/Removed

none

## Test Commands Run

- `node -e "<drop database using dotenv/mongoose>"` failed due missing MongoDB `dropDatabase` permission.
- `node -e "<clear every non-system collection using dotenv/mongoose>"` passed and deleted 33 documents.
- `$env:SEED_PASSWORD='password'; npm run seed:users` passed.
- `node -e "<verify seeded users and bcrypt password checks>"` passed.
- `git diff --stat` completed.
- `git diff` completed.
- `git status --short` completed.

## Known Limitations

- The MongoDB user cannot run `dropDatabase`, so reset was performed by clearing collection data.
- The existing seed script also seeds an agent user.

## Follow-Up Work

Add a reusable local reset script if this reset is expected to be repeated often.

## Suggested Commit Message

`chore: document database reset and seeded role users`

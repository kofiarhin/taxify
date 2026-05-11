# Seed Role Users Spec

## Request Summary

Generate/update a script and seed Taxify with admin, agent, driver, and client accounts.

## Date

2026-05-13

## Source Prompt

`generate a script and seed the codebase with admin, client, driver, agent`

## Questions Asked And Answers Received

None. The request is narrow and maps to the existing `seed:users` script.

## Assumptions

- Seeded accounts are development/demo users.
- The driver should be approved and active so bookings can be assigned immediately.
- The script should be idempotent and safe to rerun.
- The script should not run in production unless explicitly allowed.
- A real MongoDB connection is required to seed the database.

## Goal

Provide a reliable seed script that creates or updates one user for each role: `ADMIN`, `AGENT`, `DRIVER`, and `CLIENT`.

## Non-Goals

- No frontend changes.
- No deployment changes.
- No production data migration.

## Functional Requirements

- Create or update the following accounts:
  - `admin@taxify.local`
  - `agent@taxify.local`
  - `driver@taxify.local`
  - `client@taxify.local`
- Use a configurable seed password with a development default.
- Reset seeded account passwords on rerun unless disabled.
- Create/update an approved active driver profile for the seeded driver.
- Disconnect from MongoDB after the script completes.
- Block production seeding unless `ALLOW_PRODUCTION_SEED=true`.

## Success Criteria

- `npm run seed:users` exists and points to the seed script.
- Seed script is idempotent.
- Seed script prints seeded accounts and driver profile status.
- Tests still pass.
- Seeding is attempted against the available local environment and the result is documented.

## Out Of Scope

- Creating `.env` with real secrets.
- Starting or installing MongoDB.

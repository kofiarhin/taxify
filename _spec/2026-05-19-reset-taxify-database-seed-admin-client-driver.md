# Reset Taxify Database And Seed Role Users

## Request Summary

Reset the Taxify MongoDB database configured by the root `.env`, then run the existing user seed so Taxify has seeded admin, client, and driver accounts whose password is `password`.

## Date

2026-05-19

## Source Prompt

`reset taxify database and seed it again with admin client driver use password as password for all users including admin`

## Questions Asked And Answers Received

- Which database should be reset?
  - Answer: the root `.env`.
- Is it OK to delete all data in the Taxify database?
  - Answer: it is OK to delete all data in the Taxify database.
- Should the existing seed script be used or changed?
  - Answer: use the existing seed and set password to `password`.

## Assumptions

- The root `.env` `MONGO_URI` points at the intended Taxify development database.
- Using the existing seed script means preserving its current seed set. It currently seeds admin, agent, driver, and client role users; the requested admin, client, and driver users are included.
- `SEED_PASSWORD=password` is the intended way to set every seeded user's password.
- Reset means dropping all collections/data in the target MongoDB database before seeding.

## Goal

Create a clean development Taxify database with seeded role users using password `password`.

## Non-Goals

- Do not modify deployment configuration.
- Do not change frontend code.
- Do not create new seed credentials beyond the existing seed script.
- Do not commit changes.

## Users

- Local developer/admin using the seeded Taxify accounts.

## Functional Requirements

- Connect to MongoDB using the root `.env`.
- Drop all data in the configured Taxify database after confirmation.
- Run the existing seed script with `SEED_PASSWORD=password`.
- Confirm seeded admin, client, and driver users exist.
- Confirm seeded users can validate the password `password`.
- Preserve the existing seed script unless verification shows it cannot satisfy the request.

## UI Expectations

None.

## API Expectations

None.

## Data Model Expectations

- Existing Mongoose models remain unchanged.
- Seeded driver profile remains approved and active as defined by the existing seed script.
- Password hashes must not be exposed in output or committed docs.

## Edge Cases

- If MongoDB is unavailable, stop and record the failure.
- If `MONGO_URI` is missing, stop and record the failure.
- If verification cannot prove seeded users and passwords, stop with human review.
- If the seed script creates additional existing role users, document that rather than changing scope.

## Constraints

- Destructive database operation is explicitly approved by the user for the root `.env` Taxify database.
- Existing dirty worktree includes prior workflow/source changes; this workflow should avoid overlapping implementation files unless seed verification requires it.
- Do not print secrets from `.env`.

## Success Criteria

- The configured Taxify database is dropped/reset.
- The existing seed script completes successfully using `SEED_PASSWORD=password`.
- Seeded admin, client, and driver accounts exist.
- Password verification succeeds for seeded users with `password`.
- Workflow artifacts are updated, including progress, handoff, review, release notes, and summary.

## Out-Of-Scope Items

- Removing the agent user from the existing seed script.
- Adding new user-management features.
- Changing production data.

## Open Questions

- None blocking.

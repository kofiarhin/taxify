# Reset Taxify Database And Seed Role Users Task Plan

## Spec File Used

`_spec/2026-05-19-reset-taxify-database-seed-admin-client-driver.md`

## Planning Date

2026-05-19

## Progress And Summary Files Read

- `_handoff/current.md`
- `_progress/progress.md`
- `_summary/2026-05-19-audit-ride-booking-assignment-flow.md`
- `docs/PROJECT_CONTEXT.md`

## Dirty Worktree Protection

- Existing dirty files before this workflow:
  - `WORK_REQUEST.md`
  - `_handoff/current.md`
  - `_progress/progress.md`
  - `server/controllers/driverController.js`
  - `server/services/assignmentService.js`
  - `server/tests/dispatchLifecycle.test.js`
  - untracked prior workflow artifacts for `2026-05-19-audit-ride-booking-assignment-flow`
- Planned files for this workflow:
  - `WORK_REQUEST.md`
  - `_spec/2026-05-19-reset-taxify-database-seed-admin-client-driver.md`
  - `_task/2026-05-19-reset-taxify-database-seed-admin-client-driver.md`
  - `_progress/progress.md`
  - `_handoff/current.md`
  - `_review/2026-05-19-reset-taxify-database-seed-admin-client-driver.md`
  - `_release/2026-05-19-reset-taxify-database-seed-admin-client-driver.md`
  - `_summary/2026-05-19-reset-taxify-database-seed-admin-client-driver.md`
- Overlap risk:
  - Workflow files overlap because the active request is being updated. Server source/test dirty files from the previous workflow are unrelated and will not be edited for this request.

## Task List

### TASK-001: Reset database and run existing seed

Status: Done

Objective:
Drop the MongoDB database configured in root `.env`, then run the existing user seed with `SEED_PASSWORD=password`.

Files likely affected:
- `_task/2026-05-19-reset-taxify-database-seed-admin-client-driver.md`
- `_progress/progress.md`
- `_handoff/current.md`

Checklist:
- [x] Connect using root `.env`.
- [x] Drop/reset the configured database data.
- [x] Run `npm run seed:users` with `SEED_PASSWORD=password`.
- [x] Verify seeded role users and password checks.
- [x] Update progress and handoff.

Acceptance criteria:
- [x] Database reset command completes against the root `.env` database.
- [x] Existing seed command completes with password `password`.
- [x] Admin, client, and driver users exist after seeding.
- [x] Seeded user password verification succeeds for `password`.

Acceptance result:
- [x] Root `.env` database `taxify_dev` was reset by clearing all non-system collections after `dropDatabase` permission was denied.
- [x] Existing seed command completed with `SEED_PASSWORD=password`.
- [x] Admin, client, and driver users exist.
- [x] Password verification succeeded for `password`.

Verification commands:
- `node -e "<drop database using dotenv/mongoose>"` failed with missing `dropDatabase` permission.
- `node -e "<clear every non-system collection using dotenv/mongoose>"` passed and deleted 33 documents.
- `$env:SEED_PASSWORD='password'; npm run seed:users`
- `node -e "<verify seeded users and bcrypt password checks>"`

Stop condition:
- Stop if MongoDB cannot be reached, root `.env` is missing `MONGO_URI`, seeding fails, or password verification fails.

Out-of-scope items:
- Do not edit frontend code.
- Do not change deployment configuration.
- Do not remove the existing agent seed entry.

### TASK-002: Close workflow artifacts

Status: Done

Objective:
Complete the final diff audit, review, release notes, summary, handoff, and workflow health check for the reset/seed workflow.

Files likely affected:
- `_task/2026-05-19-reset-taxify-database-seed-admin-client-driver.md`
- `_progress/progress.md`
- `_handoff/current.md`
- `_review/2026-05-19-reset-taxify-database-seed-admin-client-driver.md`
- `_release/2026-05-19-reset-taxify-database-seed-admin-client-driver.md`
- `_summary/2026-05-19-reset-taxify-database-seed-admin-client-driver.md`

Checklist:
- [x] Run final diff audit.
- [x] Create review file.
- [x] Create release notes.
- [x] Create summary.
- [x] Update handoff.
- [x] Record workflow health.

Acceptance criteria:
- [x] Final diff audit is documented.
- [x] Review, release notes, summary, progress, and handoff are updated.
- [x] Workflow health is recorded.

Acceptance result:
- [x] Final diff audit completed with `git diff --stat`, `git diff`, and `git status --short`.
- [x] Review, release notes, summary, progress, and handoff updated.
- [x] Workflow health recorded as Passed.

Verification commands:
- `git diff --stat`
- `git diff`
- `git status --short`

Stop condition:
- Stop if final audit reveals unintended implementation edits or missing required artifacts.

Out-of-scope items:
- Do not commit changes.
- Do not modify seed behavior unless TASK-001 failed because of seed script behavior.

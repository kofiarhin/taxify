# Seed Role Users Task Plan

## Spec File Used

`_spec/2026-05-13-seed-role-users.md`

## Planning Date

2026-05-13

## Progress And Summary Files Read

- `_handoff/current.md`
- `_progress/progress.md`
- `_summary/2026-05-13-taxify-full-mern-platform.md`

## Dirty Worktree Protection

The worktree is already broadly dirty from the prior scaffold workflow and unrelated pre-existing deletions. This task will only touch:

- `WORK_REQUEST.md`
- `_spec/2026-05-13-seed-role-users.md`
- `_task/2026-05-13-seed-role-users.md`
- `server/scripts/seedUsers.js`
- workflow tracking artifacts

Overlap risk is low because `server/scripts/seedUsers.js` is part of the prior scaffold and directly in scope.

## Task List

### TASK-001: Make role user seed script idempotent and run it

Status: Needs Human Review

Objective:
Update the seed script to create/update admin, agent, driver, and client users, then attempt to run it against the available local MongoDB environment.

Files likely affected:

- `server/scripts/seedUsers.js`
- `_progress/progress.md`
- `_handoff/current.md`

Checklist:

- [ ] Use configurable seed password.
- [ ] Create or update all four role users.
- [ ] Reset seeded passwords unless disabled.
- [ ] Create/update approved active driver profile.
- [ ] Block accidental production seed.
- [ ] Run verification and attempt seed command.

Acceptance criteria:

- [ ] Script is idempotent.
- [ ] Script seeds admin, agent, driver, client.
- [ ] Driver profile is approved and active.
- [ ] Tests pass after script changes.
- [ ] Seed command result is documented.

Acceptance result:

- [x] Script is idempotent.
- [x] Script seeds admin, agent, driver, client.
- [x] Driver profile is approved and active.
- [x] Tests pass after script changes.
- [~] Seed command was attempted but local MongoDB was unavailable at `127.0.0.1:27017`.

Verification result:

- `npm test` passed: 3 suites, 6 tests.
- `npm run seed:users` failed with `connect ECONNREFUSED 127.0.0.1:27017`.
- Checked for local MongoDB binary/service and Docker; none were available.

Verification commands:

- `npm test`
- `npm run seed:users`

Stop condition:

- Stop if MongoDB is unavailable after documenting that code changes are complete.

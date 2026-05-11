# Fix Tailwind Content Config Task Plan

## Spec File Used

`_spec/2026-05-13-fix-tailwind-content-config.md`

## Planning Date

2026-05-13

## Progress And Summary Files Read

- `_progress/progress.md`
- `_handoff/current.md`
- `_summary/2026-05-13-add-role-e2e-tests.md`
- `docs/PROJECT_CONTEXT.md`

## Request Classification

- Type: `bugfix`
- Scope: `small`
- Risk: `low`
- Execution mode: `complete-workflow`
- Implementation allowed after this saved spec and task plan: yes

## Dirty Worktree Protection

- Initial `git status --short`: clean.
- Existing dirty files before workflow artifacts: none.
- Files planned for this workflow: `WORK_REQUEST.md`, `client/tailwind.config.js`, workflow artifact files.
- Overlap risk: none at intake.

## Task List

### TASK-001: Make Tailwind content paths stable

Status: Done

Objective:
Update the active Tailwind config so content scanning covers the real client app source and remains valid when loaded from repo root or `client/`.

Files likely affected:
- `client/tailwind.config.js`
- `client/postcss.config.js`
- `_task/2026-05-13-fix-tailwind-content-config.md`
- `_progress/progress.md`
- `_handoff/current.md`

Checklist:
- [x] Audit Tailwind/PostCSS config files outside `node_modules`.
- [x] Reproduce or capture the missing/empty content warning from root-level E2E startup.
- [x] Update the active Tailwind config content paths without changing theme styling.
- [x] Remove dead Tailwind config files if any unused duplicates exist.
- [x] Verify build and E2E behavior.
- [x] Confirm Tailwind warning no longer appears.
- [x] Review the change for scope and config correctness.

Acceptance criteria:
- Tailwind scans `client/index.html`.
- Tailwind scans `client/src/**/*.{js,jsx,ts,tsx}`.
- Current shared components/layouts under `client/src/components` are included by the source glob.
- Production build completes successfully.
- Root-level Playwright E2E completes successfully.
- Missing/empty Tailwind `content` warning is absent after the fix.
- Duplicate/conflicting root vs client Tailwind configs are audited.

Acceptance result:
- [x] Tailwind scans `client/index.html`.
- [x] Tailwind scans `client/src/**/*.{js,jsx,ts,tsx}`.
- [x] Current shared components/layouts under `client/src/components` are included by the source glob.
- [x] Production build completes successfully.
- [x] Root-level Playwright E2E completes successfully.
- [x] Missing/empty Tailwind `content` warning is absent after the fix.
- [x] Duplicate/conflicting root vs client Tailwind configs are audited; only `client/postcss.config.js` and `client/tailwind.config.js` exist outside `node_modules`.

Verification commands:
- `cd client && npm run build`
- `npm run test:e2e`
- Warning check from `npm run test:e2e` output.

Stop condition:
Stop if duplicate configs overlap ambiguously, verification fails for an unrelated reason that cannot be safely separated, or fixing the warning requires redesigning styling.

Out-of-scope items:
- UI redesign.
- Tailwind version migration.
- Component refactors.

### TASK-002: Close Tailwind config workflow

Status: Done

Objective:
Complete final diff audit and workflow closeout artifacts for the Tailwind config fix.

Files likely affected:
- `_task/2026-05-13-fix-tailwind-content-config.md`
- `_progress/progress.md`
- `_handoff/current.md`
- `_review/2026-05-13-fix-tailwind-content-config.md`
- `_release/2026-05-13-fix-tailwind-content-config.md`
- `_summary/2026-05-13-fix-tailwind-content-config.md`

Checklist:
- [x] Run final diff audit.
- [x] Create review file.
- [x] Create release notes.
- [x] Create summary.
- [x] Update handoff.
- [x] Run workflow health check.

Acceptance criteria:
- Final diff audit is completed or documented.
- Review file exists and records scope, tests, and warning status.
- Release notes exist.
- Summary exists.
- Handoff reflects the completed workflow.
- Workflow health is recorded.

Acceptance result:
- [x] Final diff audit is completed or documented.
- [x] Review file exists and records scope, tests, and warning status.
- [x] Release notes exist.
- [x] Summary exists.
- [x] Handoff reflects the completed workflow.
- [x] Workflow health is recorded.

Verification commands:
- `git diff --stat`
- `git diff`
- `git status --short`

Stop condition:
Stop if final diff reveals unrelated implementation changes or missing required artifacts.

Out-of-scope items:
- Additional implementation changes after verification unless fixing an in-scope defect.

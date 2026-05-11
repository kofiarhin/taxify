# Task Plan: Fix Auth Register API URL

## Spec File Used

`_spec/2026-05-13-fix-auth-register-api-url.md`

## Planning Date

2026-05-13

## Progress And Summary Files Read

- `_progress/progress.md`
- `_summary/2026-05-13-seed-role-users.md`
- `_summary/2026-05-13-taxify-full-mern-platform.md`
- `_handoff/current.md`
- `docs/PROJECT_CONTEXT.md`

## Dirty Worktree Protection

- Existing dirty worktree is broad and includes `client/src/lib/api.js`, `client/vite.config.js`, `client/.env.example`, and many unrelated scaffold files.
- Planned files for this workflow: `WORK_REQUEST.md`, `_spec/2026-05-13-fix-auth-register-api-url.md`, `_task/2026-05-13-fix-auth-register-api-url.md`, `client/.env`, `client/vite.config.js`, `_progress/progress.md`, `_handoff/current.md`, `_review/2026-05-13-fix-auth-register-api-url.md`, `_release/2026-05-13-fix-auth-register-api-url.md`, `_summary/2026-05-13-fix-auth-register-api-url.md`.
- Overlap risk: `client/vite.config.js` is already modified in the working tree from prior scaffold work. The edit must preserve current config and only add local proxy configuration.

## Task List

### TASK-001: Route frontend auth API calls to the backend in local development

Status: Done

Objective:
Make local registration requests reach the Express backend instead of Vite's dev server.

Files likely affected:
- `client/.env`
- `client/vite.config.js`

Checklist:
- [x] Add local `client/.env` with `VITE_API_URL=http://localhost:5000/api`.
- [x] Add a Vite dev proxy for `/api` that targets the backend origin derived from `VITE_API_URL`.
- [x] Keep service calls on the shared Axios client.
- [x] Run frontend test and build verification.
- [x] Review the diff for scope and secret exposure.

Acceptance criteria:
- `client/.env` exists locally with the expected frontend API base URL.
- Vite config proxies `/api` to the backend origin for local dev fallback.
- No component or service hard-codes a local API URL.
- Frontend tests pass.
- Frontend build passes.

Acceptance result:
- [x] `client/.env` exists locally with `VITE_API_URL=http://localhost:5000/api`.
- [x] `client/vite.config.js` proxies `/api` to the backend origin derived from `VITE_API_URL`.
- [x] No component or service hard-codes a local API URL; auth calls remain routed through `client/src/lib/api.js`.
- [x] `cd client && npm test` passed.
- [x] `cd client && npm run build` passed.

Verification commands:
- `cd client && npm test`
- `cd client && npm run build`

Stop condition:
- Stop if verification fails for an unrelated reason that would require broad fixes.

Out-of-scope items:
- Backend route changes.
- Deployment config changes.
- UI changes.

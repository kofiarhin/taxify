# Spec: Fix Auth Register API URL

## Request Summary

Fix the frontend registration request that currently posts to `http://localhost:5173/api/auth/register` and receives a 404 from the Vite dev server.

## Date

2026-05-13

## Source Prompt

`fix this error authService.js:4 POST http://localhost:5173/api/auth/register 404 (Not Found)`

## Questions Asked And Answers Received

No questions asked. The request is a small bugfix with a clear runtime symptom.

## Assumptions

- The backend API is the Express app mounted under `/api` and normally runs on port `5000`.
- The frontend Vite dev server runs on port `5173`.
- The immediate issue is that `VITE_API_URL` is not available to the running frontend, causing the shared Axios client to fall back to `/api`.
- Fixing local development routing is in scope; changing deployment targets is out of scope.

## Goal

Make registration and other frontend API calls reach the Express backend instead of returning a Vite 404.

## Non-Goals

- Do not redesign auth pages or change user-facing UI.
- Do not change backend auth behavior or routes unless inspection proves they are wrong.
- Do not change deployment configuration.
- Do not expose or hard-code secrets.

## Users

- Local developers testing registration and login.
- End users indirectly benefit because auth flows can be tested reliably.

## Functional Requirements

- Auth service calls must continue using the shared Axios client in `client/src/lib/api.js`.
- Frontend API configuration must use `VITE_API_URL` for direct backend calls.
- Local Vite dev requests to `/api` must not 404 on the Vite server when the backend is running.
- Existing auth endpoint paths must remain `/auth/register`, `/auth/login`, and `/auth/me` relative to the API base.

## UI Expectations

None. This is not a UI change.

## API Expectations

- Backend remains mounted at `/api/auth`.
- Frontend direct API base should be `http://localhost:5000/api` in local development.

## Data Model Expectations

None.

## Edge Cases

- Missing `client/.env` should have a viable local development path through the Vite proxy.
- If the backend is not running, the request may fail with a network/proxy error, not a Vite 404.

## Constraints

- Follow repository API call rules: services use `client/src/lib/api.js`; no API logic in components.
- Frontend env vars use `VITE_` prefix and live in `client/.env`.
- Do not change Namecheap/Heroku deployment assumptions.
- Existing dirty worktree is broad; edits must be narrowly scoped.

## Success Criteria

- `client/.env` provides `VITE_API_URL=http://localhost:5000/api` for local development.
- Vite dev server can proxy `/api` to the backend origin when Axios falls back to `/api`.
- `cd client && npm run build` passes.
- `cd client && npm test` passes.
- Workflow artifacts are updated.

## Out-Of-Scope Items

- Database setup and seeding.
- Backend deployment.
- UI polish or auth form redesign.

## Open Questions

- None blocking.

# Release Notes: Fix Auth Register API URL

## Request

Fix the frontend registration request that posted to Vite at `http://localhost:5173/api/auth/register` and returned 404.

## User-Facing Changes

- Registration requests now use the local backend API configuration instead of falling through to the Vite dev server.

## Developer Changes

- Added local `client/.env` with `VITE_API_URL=http://localhost:5000/api`.
- Updated `client/vite.config.js` to derive a dev proxy target from `VITE_API_URL` for `/api` fallback requests.

## New Routes/APIs

none

## New Env Vars

none; uses existing `VITE_API_URL`.

## Database/Schema Changes

none

## Dependencies Added/Removed

none

## Test Commands Run

- `cd client && npm test` passed.
- `cd client && npm run build` passed.

## Known Limitations

- The backend must be running at the configured API origin for registration to succeed.
- Vite should be restarted after this env/config change.

## Follow-Up Work

none

## Suggested Commit Message

`fix: route local frontend api calls to backend`

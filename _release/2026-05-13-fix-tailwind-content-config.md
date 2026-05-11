# Release Notes: Fix Tailwind Content Config

## Request

Audit and fix Tailwind configuration so Tailwind scans actual frontend source files and no longer warns about missing or empty `content` during Playwright/web server startup.

## User-Facing Changes

No intentional user-facing visual changes.

## Developer Changes

- Updated `client/tailwind.config.js` to scan `./index.html` and `./src/**/*.{js,jsx,ts,tsx}` relative to the client Tailwind config.
- Updated `client/postcss.config.js` to pass an absolute path to the client Tailwind config, so root-level Playwright/Vite startup uses the same config as client builds.
- Audited Tailwind/PostCSS config files outside `node_modules`; only the client configs are active.

## New Routes/APIs

none

## New Env Vars

none

## Database/Schema Changes

none

## Dependencies Added/Removed

none

## Test Commands Run

- `npm run test:e2e` before the fix: passed 4 tests and reproduced the Tailwind missing/empty `content` warning.
- `cd client && npm run build`: passed after the final fix.
- `npm run test:e2e`: passed 4 tests after the final fix with no Tailwind warning in web-server output.
- `git diff --stat`
- Targeted `git diff`
- `git status --short`

## Known Limitations

none

## Follow-Up Work

none

## Suggested Commit Message

`fix: stabilize tailwind content config`

# Review: Fix Auth Register API URL

## Request

Fix `authService.js:4 POST http://localhost:5173/api/auth/register 404 (Not Found)`.

## Spec File Used

`_spec/2026-05-13-fix-auth-register-api-url.md`

## Task Plan Used

`_task/2026-05-13-fix-auth-register-api-url.md`

## Tasks Reviewed

- `AUTH-API TASK-001: Route frontend auth API calls to the backend in local development`

## Bugs Found

No remaining in-scope defects found.

## Scope Creep Check

Scope respected. The work changed only local frontend API environment/configuration and workflow artifacts. `client/src/services/authService.js` was inspected but not changed because it already uses the shared API client correctly.

## Final Diff Audit

- `git diff --stat` completed and shows a large pre-existing dirty baseline: 213 files changed, 7,692 insertions, 22,895 deletions.
- Targeted diff for this fix shows the intended `client/vite.config.js` proxy/config update plus workflow artifacts.
- `client/.env` is ignored by git and therefore does not appear in `git diff`; it was created locally with only the non-secret frontend API base URL.
- The broad unrelated deletions and scaffold changes were not created by this workflow and were not reset.
- No secrets were added by this workflow.

## Failure Recovery Notes

None.

## Missing Tests

No new automated test was added for Vite proxy behavior. Existing frontend smoke test and build passed.

## Security Concerns

No secrets were added. `client/.env` contains only `VITE_API_URL=http://localhost:5000/api`, which is not a credential.

## Architecture Concerns

None. Frontend services continue to use `client/src/lib/api.js`.

## Follow-Up Tasks

- Restart the Vite dev server so it reloads `client/.env` and the proxy config.
- Ensure the Express backend is running on the configured API origin before retrying registration.

## Final Review Verdict

Passed. The frontend auth request target is corrected for local development, and verification passed.

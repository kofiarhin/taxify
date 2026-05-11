# Active Work Request

Add a separate Playwright browser E2E suite for Taxify with one happy path per role:

- Client books a ride from `/client/book`.
- Driver accepts, starts, ends, and completes the cash-confirmation path.
- Admin manages booking override/reassign controls from `/admin/bookings`.
- Agent creates a walk-in booking from `/agent`.

Implementation requirements:

- Add Playwright E2E tests under `e2e/` or repo root.
- Add Playwright config.
- Add `test:e2e` and any necessary setup scripts.
- Keep existing Jest/Vitest tests and frontend build working.
- Use isolated deterministic test data.
- Prefer API setup/teardown or direct test helpers where practical.
- Do not use production services, commit secrets, add Socket.IO, redesign UI, or remove workflow artifacts.

Verification commands:

- `npm test`
- `cd client && npm test`
- `cd client && npm run build`
- `npm run test:e2e`

# Release Notes: Taxify Full MERN Platform

## Request

Implement the updated Taxify taxi dispatch and ride management platform as a full MERN scaffold.

## User-Facing Changes

- Added role-aware login/register and protected dashboards for Admin, Agent, Driver, and Client.
- Added client ride booking, current ride tracking, fare display, completion confirmation, review prompt, and complaint submission.
- Added agent walk-in booking creation, queue monitoring, assignment retry, cancellation, and complaint logging.
- Added driver workspace for availability, assigned booking accept/reject, trip start/end, fare entry, cash confirmation, rating summary, and commissions.
- Added admin dashboard metrics, driver approvals/status control, booking oversight, commission review, and complaint management.

## Developer Changes

- Added Express REST API under `/api`.
- Added Mongoose models for users, drivers, bookings, trips, assignment attempts, reviews, commissions, and complaints.
- Added JWT auth, role middleware, environment validation, centralized error handling, and seed script.
- Added React/Vite frontend with Tailwind, Redux auth state, TanStack Query server-state hooks, and shared Axios API client.
- Added Jest/Supertest backend integration tests and a Vitest frontend smoke test.

## New Routes/APIs

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/drivers`
- `GET /api/drivers/me`
- `PATCH /api/drivers/me/onboarding`
- `PATCH /api/drivers/me/availability`
- `PATCH /api/drivers/:driverId/status`
- `GET /api/bookings`
- `POST /api/bookings`
- `GET /api/bookings/:bookingId`
- `POST /api/bookings/:bookingId/retry-assignment`
- `POST /api/bookings/:bookingId/cancel`
- `POST /api/bookings/:bookingId/dispute`
- `POST /api/trips/:bookingId/accept`
- `POST /api/trips/:bookingId/reject`
- `POST /api/trips/:bookingId/start`
- `POST /api/trips/:bookingId/end`
- `POST /api/trips/:bookingId/client-confirm`
- `POST /api/trips/:bookingId/payment-confirm`
- `POST /api/reviews/bookings/:bookingId`
- `GET /api/reviews/drivers/:driverId`
- `GET /api/commissions`
- `PATCH /api/commissions/:commissionId/receipt`
- `PATCH /api/commissions/:commissionId/review`
- `GET /api/complaints`
- `POST /api/complaints`
- `PATCH /api/complaints/:complaintId`
- `GET /api/dashboard/admin`
- `GET /api/users`
- `POST /api/users/staff`

## New Env Vars

- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CLIENT_ORIGIN`
- `FARE_BASE`
- `FARE_PER_KM`
- `FARE_PER_MINUTE`
- `COMMISSION_RATE`
- `VITE_API_URL`

## Database/Schema Changes

- Added collections for users, driver profiles, bookings, trips, assignment attempts, driver reviews, commission statements, and complaints.
- Added unique review-per-booking constraint.
- Added driver rating aggregate fields.

## Dependencies Added/Removed

Added:

- Backend: `express`, `mongoose`, `bcryptjs`, `jsonwebtoken`, `zod`, `cors`, `helmet`, `morgan`, `express-rate-limit`
- Backend dev/test: `jest`, `supertest`, `mongodb-memory-server`, `cross-env`, `nodemon`, `concurrently`
- Frontend: `react`, `react-dom`, `react-router-dom`, `@reduxjs/toolkit`, `react-redux`, `@tanstack/react-query`, `axios`, `@phosphor-icons/react`
- Frontend dev/test: `vite`, `@vitejs/plugin-react`, `tailwindcss`, `postcss`, `autoprefixer`, `vitest`, Testing Library packages, `jsdom`

Removed from this recreated scaffold:

- Socket.IO runtime files and dependencies are intentionally not included for this REST-only phase.

## Test Commands Run

- `npm test` passed: 3 backend suites, 6 tests.
- `cd client && npm test` passed: 1 frontend suite, 1 test.
- `cd client && npm run build` passed.

## Known Limitations

- No Socket.IO or push real-time updates yet.
- No map/geocoding integration.
- No online payment integration; cash-only flow.
- Receipt submission stores metadata, not uploaded files.
- Frontend test coverage is minimal smoke coverage.
- Booking status records completed after driver cash confirmation while payment status records paid.

## Follow-up Work

- Add real-time updates.
- Add end-to-end tests across roles.
- Add production receipt storage and audit logs.
- Add richer admin user management.

## Suggested Commit Message

`feat: implement taxify mern dispatch platform`

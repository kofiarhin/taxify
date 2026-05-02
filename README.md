# Taxify

Taxify is a taxi dispatch and ride management platform built as a full-stack JavaScript application. The app supports client-led ride booking, automatic driver assignment, real-time trip tracking, dual trip/payment confirmation, commission tracking, complaints, and post-trip driver reviews.

The product direction is a multi-role system for taxi operations:

- `ADMIN` manages users, drivers, queues, trips, commissions, complaints, and analytics
- `AGENT` handles staff-created bookings, dispatch queue work, and complaints
- `DRIVER` accepts assignments, runs trips, confirms payment, and tracks commissions
- `CLIENT` creates rides, tracks the assigned driver, confirms completion, and reviews drivers

## Current Status

Implemented now:

- Backend environment validation with fail-fast startup
- JWT authentication and `/auth/me` session recovery
- Role-based route protection in both API and frontend
- Admin user, booking, queue, driver, trip, commission, complaint, and dashboard pages
- Driver registration plus admin approval, suspension, and reactivation endpoints
- Client registration and self-service booking
- Automatic driver assignment with queue fallback
- Driver assignment accept/reject workflow
- Trip lifecycle tracking: assigned, accepted, in progress, ended, completion confirmation, payment confirmation, completed
- Client trip tracker with fare and driver details
- Post-trip driver review prompt with 1-5 rating and optional comment
- Driver aggregate rating and review count
- Cash payment confirmation with commission generation
- Monthly commission tracking and receipt review
- Complaint creation and admin resolution workflow
- Shared Axios API client using `VITE_API_URL`
- Redux Toolkit for auth, navigation, and UI state
- TanStack Query wired into frontend data fetching
- Fresh local user seeding for admin, driver, and client accounts
- Jest backend tests and Vitest frontend tests

Planned next:

- Booking history views
- Review history and moderation tools
- Expanded admin reporting
- Deployment workflow hardening

## Tech Stack

### Frontend

- React 19
- Vite
- Tailwind CSS 4
- React Router
- Redux Toolkit
- TanStack Query
- Axios
- React Hook Form
- Vitest + React Testing Library

### Backend

- Node.js
- Express 5
- MongoDB with Mongoose
- JWT authentication
- Zod validation
- Jest + Supertest

## Repository Structure

```text
taxify/
  client/
    public/
    src/
      components/
      hooks/
      lib/
      pages/
      redux/
      routes/
      services/
    test/
  server/
    config/
    constants/
    controllers/
    middleware/
    models/
    routes/
    scripts/
    services/
    tests/
    utils/
    validators/
```

## Local Setup

### 1. Install dependencies

From the repository root:

```bash
npm install
cd client && npm install
```

### 2. Configure environment variables

Backend environment lives in the root `.env`.

Example:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/taxify
JWT_SECRET=change-me
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173,http://localhost:5174
DEMO_SEED_ENABLED=true
```

Frontend environment lives in `client/.env`.

Example:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

Notes:

- Backend startup fails if required env vars are missing or invalid.
- Frontend API calls go through `client/src/lib/api.js`.
- Do not hard-code API URLs in components or services.

### 3. Start MongoDB

Make sure a MongoDB instance is available at the `MONGODB_URI` in your root `.env`.

### 4. Seed demo users

```bash
npm run seed:users
```

The seed command clears existing collections first, then creates a fresh set of users and an approved driver profile.

Seeded accounts:

- `admin@taxify.local` / `TaxifyPass123`
- `driver@taxify.local` / `TaxifyPass123`
- `client@taxify.local` / `TaxifyPass123`

### 5. Run the app

Run frontend and backend together from the root:

```bash
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/api/v1/health`

You can also run each side separately:

```bash
npm run server
npm run client
```

## Available Scripts

### Root

- `npm run dev` starts backend and frontend together
- `npm run server` starts the Express server with `nodemon`
- `npm run client` starts the Vite frontend
- `npm start` starts the backend without `nodemon`
- `npm run seed:users` seeds demo users
- `npm test` runs backend Jest tests

### Frontend

From `client/`:

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run test`

## Frontend Routes

Current role-aware routes:

- `/login`
- `/register-client`
- `/admin`
- `/admin/bookings`
- `/admin/queue`
- `/admin/drivers`
- `/admin/trips`
- `/admin/commissions`
- `/admin/complaints`
- `/admin/users`
- `/agent`
- `/agent/bookings/new`
- `/agent/queue`
- `/agent/complaints`
- `/driver`
- `/driver/trip`
- `/driver/trips`
- `/driver/commissions`
- `/client`
- `/client/bookings/new`
- `/client/bookings/current`

Unauthenticated users are redirected to `/login`. Authenticated users are redirected to the correct workspace for their role.

## API Overview

Base URL:

```text
/api/v1
```

Current endpoints:

- `GET /health`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/register-client`
- `GET /auth/me`
- `GET /users`
- `POST /users`
- `POST /drivers/register`
- `GET /drivers`
- `GET /drivers/me`
- `GET /drivers/pending`
- `POST /drivers/:id/approve`
- `POST /drivers/:id/suspend`
- `POST /drivers/:id/reactivate`
- `POST /drivers/:id/deactivate`
- `GET /bookings`
- `POST /bookings`
- `POST /bookings/:id/cancel`
- `GET /assignments/me`
- `POST /assignments/:id/accept`
- `POST /assignments/:id/reject`
- `POST /trips/:bookingId/start`
- `POST /trips/:bookingId/end`
- `POST /trips/:bookingId/confirm-payment`
- `GET /commissions`
- `POST /commissions/:id/submit-receipt`
- `POST /commissions/:id/approve`
- `POST /commissions/:id/reject`
- `POST /commissions/:id/settle`
- `GET /complaints`
- `POST /complaints`
- `PATCH /complaints/:id`
- `POST /complaints/:id/resolve`
- `GET /dashboard/summary`
- `POST /client/bookings`
- `GET /client/bookings/current`
- `POST /client/bookings/:id/confirm-complete`
- `POST /client/bookings/:id/review`

Access is enforced with JWT auth and role guards where required.

## Testing

Backend tests:

```bash
npm test
```

Frontend tests:

```bash
cd client
npm run test
```

Current test coverage includes:

- health endpoint
- authentication flow
- role protection
- booking dispatch and queue behavior
- driver assignment and trip lifecycle
- client-led dual confirmation flow
- post-trip driver reviews and rating aggregates
- commission, complaint, and dashboard flows
- frontend app, protected routes, booking pages, driver pages, and review prompt interactions

## Deployment Notes

Repo conventions for this project:

- Frontend deployment target: Namecheap via GitHub Actions
- Backend deployment target: Heroku

This README only covers local development. Deployment workflow changes should follow the project rules in `AGENTS.md`.

## Conventions

- Tailwind CSS is the default styling system for frontend work
- Redux Toolkit is for global client state
- TanStack Query is for server state
- Shared API client lives in `client/src/lib/api.js`
- Backend code stays flat under `server/`
- Keep API logic out of React components

## Known Scope Boundary

The core dispatch and client ride flow is implemented. Remaining product growth areas include richer booking history, driver review moderation, deeper reporting, notification workflows, and production deployment automation.

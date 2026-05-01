# Taxify

Taxify is a taxi dispatch and operations platform built as a full-stack JavaScript application. The current repository contains the foundation slice: authenticated role-based access, protected frontend routing, seeded demo accounts, admin user listing, and driver onboarding and approval APIs.

The product direction is a multi-role system for taxi operations:

- `ADMIN` manages staff users and driver approval
- `AGENT` handles dispatch workflows
- `DRIVER` uses a mobile-friendly driver workspace

## Current Status

Implemented now:

- Backend environment validation with fail-fast startup
- JWT authentication and `/auth/me` session recovery
- Role-based route protection in both API and frontend
- Admin user list endpoint and admin users page
- Driver registration plus admin approval, suspension, and reactivation endpoints
- Shared Axios API client using `VITE_API_URL`
- Redux Toolkit for auth, navigation, and UI state
- TanStack Query wired into frontend data fetching
- Demo account seeding for local development
- Jest backend tests and Vitest frontend tests

Planned next:

- Booking creation and dispatch queue
- Driver assignment accept/reject loop
- Trip lifecycle tracking
- Cash payment confirmation
- Commission workflows
- Admin analytics

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

Seeded accounts:

- `admin@taxify.local` / `TaxifyPass123`
- `agent@taxify.local` / `TaxifyPass123`
- `driver@taxify.local` / `TaxifyPass123`

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
- `/admin`
- `/admin/users`
- `/agent`
- `/driver`

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
- `GET /auth/me`
- `GET /users`
- `POST /users`
- `POST /drivers/register`
- `GET /drivers/me`
- `GET /drivers/pending`
- `POST /drivers/:id/approve`
- `POST /drivers/:id/suspend`
- `POST /drivers/:id/reactivate`

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
- frontend app rendering

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

This repository is not yet a complete dispatch platform. It currently provides the foundation layer that later booking, trip, payment, complaint, and commission modules will build on.

# Project Context

This file captures durable repository facts discovered during workflow runs. Keep it concise and update it when repo conventions become clear.

## Project Summary

- Project name: Taxify
- Purpose: Taxi booking, dispatch, trip lifecycle, cash payment, review, commission, and operations management platform.
- Current maturity: MVP scaffold

## Stack

- Frontend: React with Vite
- Backend: Express
- Database: MongoDB with Mongoose
- Runtime: Node.js
- Languages: JavaScript
- Styling: Tailwind CSS
- Deployment: Frontend Namecheap via GitHub Actions, backend Heroku per repository rules

## Package Manager

- Detected package manager: npm
- Lockfiles: `package-lock.json`, `client/package-lock.json`
- Install command: `npm install` and `cd client && npm install`

## Common Commands

```bash
# Test
npm test
cd client && npm test
npm run test:e2e

# Lint
none configured

# Build
cd client && npm run build

# Typecheck
none configured
```

## Testing Tools

- Unit tests: Vitest for frontend smoke/component tests
- Integration tests: Jest + Supertest + mongodb-memory-server for backend API behavior
- End-to-end tests: Playwright at repo root under `e2e/`, run with `npm run test:e2e`
- Manual verification notes: Socket.IO realtime dispatch is configured for booking lifecycle updates; REST remains the authoritative API surface.

## Repo Conventions

- Folder conventions: `client/` for React app, `server/` flat Express/Mongoose backend, no `server/src/`.
- Naming conventions: role constants use uppercase role names; booking and driver lifecycle statuses use uppercase enum strings.
- API conventions: REST API under `/api`, Bearer JWT auth, Socket.IO auth via `handshake.auth.token`, controllers delegate domain work to services where useful.
- State management conventions: Redux Toolkit stores auth/client UI state; TanStack Query handles server state through custom hooks.
- Error handling conventions: centralized Express error middleware returns `{ error: { code, message } }`.
- Booking lifecycle conventions: current status lives on `Booking.status`; audited transitions are appended to `Booking.statusHistory`; realtime booking events use Socket.IO rooms for role, user, and driver-profile delivery.

## Architecture Rules

- REST endpoints remain backward-compatible and authoritative; Socket.IO publishes booking lifecycle updates for live UI refresh.
- Admin booking operations include cancel, dispute, reassign, retry assignment, and completion override through REST endpoints under `/api/bookings/:bookingId`.
- Frontend API calls go through `client/src/lib/api.js`; service files and query/mutation hooks wrap server calls.
- Backend validates required environment variables at startup.
- Browser E2E tests start isolated local Express and Vite servers with MongoDB Memory Server via Playwright `webServer`; generated E2E state lives under ignored `e2e/.state/`.

## Known Constraints

- Cash payments only; no online payment provider in this phase.
- Fare formula defaults to base fare 10, per-km 3, per-minute 1, with distance and duration manually supplied.
- Commission rate is 10% of completed trip fare.
- Existing worktree includes unrelated pre-existing deletions outside the implemented scaffold; do not reset them without explicit user instruction.

## Open Questions

- No open implementation blockers after the 2026-05-13 scaffold workflow.

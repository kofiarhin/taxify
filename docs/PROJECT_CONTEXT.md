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
- End-to-end tests: none configured
- Manual verification notes: REST-only phase; no Socket.IO client/server runtime is configured.

## Repo Conventions

- Folder conventions: `client/` for React app, `server/` flat Express/Mongoose backend, no `server/src/`.
- Naming conventions: role constants use uppercase role names; booking and driver lifecycle statuses use uppercase enum strings.
- API conventions: REST API under `/api`, Bearer JWT auth, controllers delegate domain work to services where useful.
- State management conventions: Redux Toolkit stores auth/client UI state; TanStack Query handles server state through custom hooks.
- Error handling conventions: centralized Express error middleware returns `{ error: { code, message } }`.

## Architecture Rules

- REST endpoints are the transport for this phase; lifecycle services should remain easy to wrap with future real-time notifications.
- Frontend API calls go through `client/src/lib/api.js`; service files and query/mutation hooks wrap server calls.
- Backend validates required environment variables at startup.

## Known Constraints

- Cash payments only; no online payment provider in this phase.
- Fare formula defaults to base fare 10, per-km 3, per-minute 1, with distance and duration manually supplied.
- Commission rate is 10% of completed trip fare.
- Existing worktree includes unrelated pre-existing deletions outside the implemented scaffold; do not reset them without explicit user instruction.

## Open Questions

- No open implementation blockers after the 2026-05-13 scaffold workflow.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Taxify is a web-based taxi dispatch and operations platform. Three roles — **Admin**, **Agent**, **Driver** — interact with a shared booking lifecycle: Agent/Admin creates a booking → system auto-assigns an available driver (or queues it) → driver accepts → trip runs with a timer → driver ends trip → cash payment confirmed → driver returns to available pool. Commission is 10% per trip, tracked monthly, with driver receipt upload and admin approval.

## Repository Layout

Monorepo with two separate Node projects:

- `server/` — Express 5 backend; entry is `server/server.js` → `server/app.js`
- `client/` — React 19 + Vite 8 frontend; entry is `client/src/main.jsx` → `client/src/App.jsx`
- Root `package.json` manages backend deps and concurrently runs both processes

## Commands

```bash
# Install
npm install                  # backend deps
cd client && npm install     # frontend deps

# Development
npm run dev                  # start both server + client (concurrently)
npm run server               # backend only (nodemon)
cd client && npm run dev     # frontend only (Vite, port 5173)

# Tests
npm test                     # backend Jest tests (server/tests/**/*.test.js)
cd client && npm run test    # frontend Vitest tests (client/test/)

# Build / lint
cd client && npm run build
cd client && npm run lint
npm run seed:users           # seed demo users into MongoDB
```

## Backend Architecture

```
server/
├── app.js              # Express setup: CORS, Helmet, Morgan, routes, error handlers
├── server.js           # DB connect + server start
├── config/env.js       # Zod-validated env vars (fail-fast on startup)
├── constants/          # ROLES (ADMIN, AGENT, DRIVER), DRIVER_STATUSES
├── controllers/        # HTTP layer only — delegate to services
├── services/           # Business logic (auth, user, seed)
├── models/             # Mongoose schemas (User, DriverProfile)
├── routes/             # /api/v1/auth, /api/v1/drivers, /api/v1/users
├── middleware/         # auth.js (JWT), requireRole.js, validateRequest.js (Zod), errorHandler.js
├── validators/         # Zod schemas used in routes via validateRequest middleware
└── utils/              # ApiError, asyncHandler, pagination
```

**Error handling:** controllers are wrapped with `asyncHandler`; throw `ApiError` (statusCode + message + errors array) to surface structured errors. The global `errorHandler` middleware formats the response.

**Validation:** attach a Zod schema to a route via `validateRequest(schema)` middleware — it rejects bad requests before they reach the controller.

**Auth flow:** `POST /api/v1/auth/login` → JWT issued → stored in `localStorage` as `taxify_token` → `Authorization: Bearer` header injected by Axios interceptor → `auth` middleware verifies JWT and sets `req.user` → `requireRole(...roles)` guards role-specific endpoints.

**Rate limits:** auth endpoints are limited to 25 requests / 15 min (env-configurable). Extend this to any new sensitive routes.

## Frontend Architecture

```
client/src/
├── lib/api.js          # Axios instance; reads VITE_API_URL; JWT interceptor
├── redux/              # store.js + slices: auth, navigation, ui
├── hooks/              # useAuthBootstrap.js (checks token on load, calls /auth/me)
├── services/           # API call functions (authService, driverService)
├── routes/             # AppRouter.jsx, ProtectedRoute.jsx, RoleRoute.jsx
├── pages/              # auth/, admin/, agent/, driver/ — role-scoped pages
└── components/shared/  # AppShell, StatusPanel, etc.
```

**State:** Redux Toolkit for global auth/ui/navigation state; TanStack Query for server state. Auth slice tracks `{ token, user, status: checking|loading|authenticated|idle, error }`.

**Route protection:** `ProtectedRoute` checks auth; `RoleRoute` checks role. Both redirect on failure.

**API calls:** all network calls go through `client/src/lib/api.js` (the Axios instance) — never use raw `fetch` or a second Axios instance.

## Data Models

**User:** `role` (ADMIN | AGENT | DRIVER), `fullName`, `email`, `phone`, `passwordHash`, `isActive`, `lastLoginAt`

**DriverProfile:** references `User`; adds `status` (PENDING_APPROVAL → ACTIVE → BUSY / OFFLINE → SUSPENDED → DEACTIVATED), vehicle/license/ID fields, `approvedBy`, `suspensionReason`, `commissionDebt`

## Environment Variables

Backend (root `.env`):
```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/taxify
JWT_SECRET=
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173,http://localhost:5174
```

Frontend (`client/.env`):
```
VITE_API_URL=http://localhost:5000/api/v1
```

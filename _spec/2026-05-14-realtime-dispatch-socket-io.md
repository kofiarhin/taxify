# Spec: Realtime Dispatch Socket.IO Layer

## Request Summary

Implement a production-oriented Socket.IO realtime layer so Taxify clients, drivers, agents, and admins receive booking lifecycle updates without manual refresh.

## Date

2026-05-14

## Source Prompt

User requested the next production-readiness milestone for `github.com/kofiarhin/taxify`: add Socket.IO backend/frontend realtime booking lifecycle updates, socket authentication, role/user/driver rooms, event helper functions, lifecycle emissions, frontend socket integration, a small connection indicator, and focused backend/frontend tests.

## Questions Asked And Answers Received

- Should realtime events include full populated booking payload everywhere? Answer: include the full populated booking payload where already available or cheap to fetch. Otherwise emit the minimal payload first, then invalidate/refetch bookings on the frontend. Do not add expensive population in hot paths unless needed.
- How should inactive socket users be rejected? Answer: use existing `User.status`; treat missing status as active for backward compatibility; reject only when status exists and is not `ACTIVE`.
- What socket testing depth is expected? Answer: add focused socket auth integration tests and helper emission tests first. Add one happy-path lifecycle event test, but do not block implementation on exhaustive E2E socket tests for every controller path.

## Assumptions

- Existing REST API response shapes remain authoritative and must not change.
- Socket.IO can be installed as a new production dependency at the root backend package and `socket.io-client` in `client/`.
- Booking list cache invalidation is sufficient for minimal events without a populated booking payload.
- A small header status indicator is enough UI feedback; no app redesign is intended.
- Backend socket tests can initialize an in-memory HTTP server with Socket.IO and MongoDB Memory Server using existing Jest setup.

## Goal

Add realtime booking lifecycle event publishing and frontend consumption while preserving existing REST behavior, lifecycle statuses, auth rules, and TanStack Query server-state patterns.

## Non-Goals

- No exhaustive browser E2E socket test suite for every lifecycle path.
- No replacement of REST APIs.
- No Redux server-state implementation.
- No deployment platform changes.
- No status enum renames or lifecycle model redesign.

## Users

- Clients waiting for booking, trip, and payment status changes.
- Drivers receiving assigned/reassigned booking status changes.
- Agents monitoring queue and booking operations.
- Admins monitoring all lifecycle activity.

## Functional Requirements

- Backend starts Express through an HTTP server and attaches Socket.IO.
- Socket.IO CORS uses `env.CLIENT_ORIGIN`.
- Socket auth accepts `socket.handshake.auth.token`, verifies JWT with `JWT_SECRET`, loads `User` by `payload.sub`, rejects missing users, and rejects users whose existing `status` is not `ACTIVE`.
- Connected sockets join role room, user room, and driver profile room when applicable.
- Backend exposes helper functions:
  - `emitToAdmins(event, payload)`
  - `emitToAgents(event, payload)`
  - `emitToUser(userId, event, payload)`
  - `emitToDriver(driverProfileId, event, payload)`
  - `emitBookingEvent(booking, event, payload)`
- Booking event payloads use:

```js
{
  type: string,
  bookingId: string,
  status: string,
  booking?: populatedBooking,
  timestamp: ISOString
}
```

- Events emitted:
  - `booking:created`
  - `booking:assigned`
  - `booking:queued`
  - `booking:accepted`
  - `booking:rejected`
  - `booking:reassigned`
  - `booking:cancelled`
  - `booking:disputed`
  - `trip:started`
  - `trip:ended`
  - `payment:client_confirmed`
  - `payment:driver_confirmed`
  - `booking:completed`
- Lifecycle emissions are added around:
  - `assignmentService.assignAvailableDriver`
  - `assignmentService.requeueBooking`
  - `assignmentService.reassignBooking`
  - trip controller accept/reject/start/end/confirmClient/confirmPayment
  - booking controller create/cancel/dispute/completeOverride
- Frontend creates `client/src/lib/socket.js`, connects with token from `localStorage.taxify_token`, and derives socket URL from `VITE_API_URL` origin or current origin fallback.
- Frontend has a `SocketProvider` inside `AppProviders`.
- Frontend realtime booking handling invalidates or updates booking query caches without moving server state into Redux.
- AppShell shows connected, reconnecting, and offline socket states with minimal UI change.

## UI Expectations

- Add one compact realtime connection indicator in the existing AppShell header.
- Preserve current layout, navigation, Tailwind styling system, and responsive behavior.
- Use existing icon library if an icon is needed; no new UI dependency.
- Provide accessible text for each connection state.

## API Expectations

- REST endpoint paths, status codes, and JSON response shapes remain backward compatible.
- Socket.IO is available on the same backend origin as the API server.
- No new REST endpoint is required.

## Data Model Expectations

- No schema migration is required.
- User status remains `ACTIVE` or `INACTIVE`.
- Booking lifecycle statuses remain unchanged.
- Driver profile lookup for socket room join uses existing `DriverProfile.user`.

## Edge Cases

- Missing token rejects socket connection.
- Invalid token rejects socket connection.
- Missing user rejects socket connection.
- User with explicit non-`ACTIVE` status rejects socket connection.
- Older user documents missing `status` are allowed.
- Lifecycle events can emit minimal booking payloads when populated data would be expensive.
- Frontend socket disconnects on logout and reconnects when a new token is set.

## Constraints

- Backend uses CommonJS.
- Frontend uses Vite ESM.
- Tailwind CSS remains the frontend styling system.
- TanStack Query remains the server-state layer.
- New tests follow `server/tests/` and `client/test/`.
- No hardcoded secrets.
- No deployment config changes.

## Success Criteria

- Root backend Jest tests pass.
- Client Vitest tests pass.
- App still starts with `npm run dev`.
- Creating a booking emits `booking:queued` or `booking:assigned`.
- Driver accept/start/end emits realtime updates to admin, agent, and client-relevant rooms.
- Client confirmation and driver payment confirmation update booking state live through frontend cache invalidation/update.
- No lifecycle statuses are renamed.
- REST API remains backward compatible.

## Out-Of-Scope Items

- Socket-based driver location tracking.
- Push notifications outside active browser sessions.
- Complex realtime presence dashboard.
- WebSocket load balancing or Redis adapter.
- E2E browser tests for every socket event.

## Open Questions

- None blocking implementation.

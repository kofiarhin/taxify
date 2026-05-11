# Active Work Request

Implement the next production-readiness milestone in `github.com/kofiarhin/taxify`: a realtime dispatch layer using Socket.IO.

## Goal

Add realtime booking lifecycle updates so clients, drivers, agents, and admins receive status changes without manual refresh.

## Requirements

- Add Socket.IO backend setup by refactoring `server/server.js` to create an HTTP server, attach Socket.IO, keep existing Express behavior unchanged, configure CORS with `env.CLIENT_ORIGIN`, and add a module such as `server/realtime/socket.js`.
- Authenticate sockets with `JWT_SECRET`, using `socket.handshake.auth.token`, loading `User` by `payload.sub`, rejecting inactive or missing users, and attaching the user to the socket.
- Join rooms on connect: `role:ADMIN`, `role:AGENT`, `role:DRIVER`, `role:CLIENT`, `user:{userId}`, and `driver:{driverProfileId}` for drivers with a `DriverProfile`.
- Expose realtime helpers: `emitToAdmins`, `emitToAgents`, `emitToUser`, `emitToDriver`, and `emitBookingEvent`.
- Emit booking lifecycle events using the contract `{ type, bookingId, status, booking?, timestamp }`.
- Emit events for booking created, assigned, queued, accepted, rejected, reassigned, cancelled, disputed, trip started, trip ended, client payment confirmed, driver payment confirmed, and completed.
- Hook emissions into existing lifecycle code without changing REST response shapes.
- Add `socket.io-client` frontend support through `client/src/lib/socket.js`, using `VITE_API_URL` origin or current origin fallback and `localStorage` key `taxify_token`.
- Add React integration through a `SocketProvider` inside `AppProviders` and a hook such as `useRealtimeBookings` that invalidates or updates TanStack Query booking caches on lifecycle events.
- Add a small realtime connection indicator in `AppShell` for connected, reconnecting, and offline states without redesigning the UI.
- Add backend Jest tests for socket auth rejection/acceptance and expected lifecycle emissions.
- Add frontend Vitest tests for realtime hook behavior where practical, mocking `socket.io-client`.

## Acceptance Criteria

- Existing `npm test` passes.
- `cd client && npm test` passes.
- App still starts with `npm run dev`.
- Creating a booking emits queued or assigned event.
- Driver accept/start/end emits realtime updates to admin/agent/client.
- Client confirmation and driver payment confirmation update booking state live.
- No secrets are hardcoded.
- No business lifecycle statuses are renamed.
- REST API remains backward compatible.

## Notes

- Backend uses CommonJS.
- Frontend uses Vite ESM.
- Keep changes minimal and production-oriented.
- Keep TanStack Query for booking server state; do not introduce Redux for server state.

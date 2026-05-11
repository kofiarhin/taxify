# Active Work Request

## Request ID

`2026-05-14-harden-realtime-dispatch-socket-io`

## Source Prompt

Finish and harden the Socket.IO realtime dispatch milestone in `github.com/kofiarhin/taxify`.

Goals:

- Normalize realtime event payloads to a stable `{ type, bookingId, status, booking, timestamp }` contract.
- Reduce duplicate or noisy booking lifecycle events, especially creation, reassignment, and driver rejection flows.
- Use consistent populated booking payloads where cheap/practical without changing REST response shapes.
- Add backend lifecycle emission tests for booking creation, driver trip flow, and payment flow.
- Add frontend tests for realtime booking subscriptions/cache updates and socket connection creation.
- Improve frontend cache update behavior so payload bookings replace or insert into cached booking lists, avoid duplicates, preserve newest-first sorting where possible, and always invalidate booking queries.
- Keep the existing MERN architecture, CommonJS backend, Vite ESM frontend, TanStack Query server state, REST routes, response shapes, and booking statuses intact.

## Acceptance Criteria

- Socket auth tests pass.
- Backend lifecycle realtime emission tests pass.
- Frontend realtime hook/socket tests pass.
- Realtime events use a stable payload contract.
- Booking creation/reassignment no longer produce unnecessary duplicate final-state events.
- Frontend cache updates live when booking events arrive.
- Existing REST API behavior remains backward compatible.
- Verification commands:
  - `npm test`
  - `npm run test --prefix client`

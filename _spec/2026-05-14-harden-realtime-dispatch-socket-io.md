# Spec: Harden Socket.IO Realtime Dispatch

## Request Summary

Finish and harden the existing Socket.IO realtime dispatch milestone by stabilizing event payloads, reducing duplicate final-state events, using populated booking payloads where practical, improving frontend cache updates, and adding focused backend/frontend test coverage.

## Date

2026-05-14

## Source Prompt

The user requested hardening for the existing realtime dispatch implementation in `github.com/kofiarhin/taxify`, including payload normalization, duplicate event cleanup, populated payload helpers, lifecycle tests, frontend realtime tests, cache update behavior, and full test verification.

## Questions Asked And Answers Received

No blocking questions were asked. The prompt was detailed enough to proceed. Assumptions below capture the remaining implementation choices.

## Assumptions

- Creation events should use one final booking event: emit `booking:created` after assignment has resolved, with final `DRIVER_ASSIGNED` or `QUEUED` status, and suppress assignment-service `booking:assigned` / `booking:queued` emissions during create.
- Reassignment should emit one final `booking:reassigned` event after assignment resolves, and suppress the intermediate assignment-service final-state event.
- Driver rejection should emit `booking:rejected` first, then one final `booking:assigned` or `booking:queued` event for the new assignment outcome.
- Populating booking payloads through a reusable helper is acceptable for controller lifecycle events and assignment-service events because these paths are not high-volume hot loops.
- REST response shapes must not change; serialization helpers are for realtime payloads only.
- Frontend cache insertion should apply to cached query results shaped like `{ bookings: [...] }`; unknown shapes should remain unchanged.

## Goal

Make realtime booking lifecycle events predictable, less noisy, and test-covered so client, driver, agent, and admin UI can update promptly without excessive cache churn or inconsistent payload handling.

## Non-Goals

- Do not add a Socket.IO shared adapter for multi-instance deployment.
- Do not add browser E2E socket coverage.
- Do not rename booking or driver statuses.
- Do not change existing REST route paths or REST response bodies.
- Do not move booking server state into Redux.

## Users

- Clients watching their booking status.
- Drivers receiving assignment and trip lifecycle updates.
- Agents and admins watching operational booking state.
- Developers maintaining realtime contracts and lifecycle tests.

## Functional Requirements

- Realtime booking payloads must consistently include:
  - `type`
  - `bookingId` as a string
  - `status`
  - optional `booking`
  - `timestamp` as an ISO string
- Booking payload serialization must avoid exposing internal auth fields or secrets.
- Important booking emissions should use populated booking payloads where cheap/practical:
  - `client: name email phone`
  - `createdBy: name email role`
  - `assignedDriver.user: name email phone`
- Booking creation must emit only one final useful realtime event after assignment resolves.
- Reassignment must emit one final `booking:reassigned` event, not both `booking:assigned` and `booking:reassigned` for the same update.
- Driver rejection must emit `booking:rejected`, then exactly one final assignment outcome event.
- Frontend realtime hook must subscribe/unsubscribe all booking lifecycle events.
- Frontend cache handling must replace matching cached bookings when `payload.booking` exists, insert new bookings into existing booking lists when missing, avoid duplicates, sort newest-first by `createdAt` where possible, and invalidate booking queries for booking events.

## UI Expectations

- No visual redesign is required.
- Existing realtime status indicator remains intact.
- Frontend work is limited to hook/socket behavior and tests.

## API Expectations

- REST responses remain backward compatible.
- Socket.IO auth remains token-based through `handshake.auth.token`.
- Socket event names stay compatible except duplicate/noisy emissions are reduced.

## Data Model Expectations

- No schema changes are required.
- Existing `Booking`, `DriverProfile`, and `User` models remain authoritative.

## Edge Cases

- Payload helper must handle raw Mongoose documents, populated Mongoose documents, plain objects, and minimal payloads.
- Missing booking data should still emit a minimal payload with `bookingId`, `status`, and `timestamp` when available.
- Frontend should invalidate queries even when `payload.booking` is absent or raw/minimal.
- Cached booking lists with existing entries must not duplicate inserted bookings.

## Constraints

- Backend remains CommonJS.
- Frontend remains Vite ESM.
- Tailwind remains the default styling system; no styling changes are expected.
- TanStack Query remains the source for booking server state.
- Do not introduce new runtime dependencies unless tests reveal an existing missing dependency.
- Use existing test infrastructure: Jest/Supertest/mongodb-memory-server and Vitest/RTL.
- Follow `design-taste-frontend` for frontend-facing changes.

## Success Criteria

- Socket auth tests pass.
- Backend lifecycle realtime tests pass.
- Frontend realtime hook/socket tests pass.
- `npm test` passes.
- `npm run test --prefix client` passes.
- Stable realtime payload contract is covered by tests.
- Creation and reassignment duplicate final-state events are removed.
- Frontend cache updates live and invalidates booking queries.
- REST behavior remains backward compatible.

## Out-Of-Scope Items

- Deployment changes.
- Multi-instance Socket.IO adapter.
- Full browser realtime E2E suite.
- Broad UI refactors.
- Dependency audit remediation.

## Open Questions

- None blocking.

# Spec: Fix Booking Create 500

## Request Summary

Fix a backend `500 Internal Server Error` when the frontend calls `POST /api/bookings` through `bookingService.js`.

## Date

2026-05-13

## Source Prompt

`fix this error bookingService.js:5 POST http://localhost:5000/api/bookings 500 (Internal Server Error)`

## Questions Asked And Answers Received

No questions asked. The request gives a concrete endpoint and runtime failure. Remaining unknowns can be handled by reproducing the booking path and documenting assumptions.

## Assumptions

- The request is made by an authenticated client or agent user.
- The backend is reachable at `http://localhost:5000/api`.
- The frontend service path is correct because `bookingService.create` posts to `/bookings` through the shared API client.
- The 500 should be fixed in the backend booking create path unless reproduction proves a frontend payload issue.

## Goal

Make valid booking creation requests return `201` with a booking payload, and convert invalid booking input into a controlled 4xx response instead of an unhandled 500.

## Non-Goals

- Do not redesign booking pages.
- Do not change deployment configuration.
- Do not change booking lifecycle behavior beyond avoiding the internal server error.
- Do not alter unrelated driver, trip, commission, or complaint flows.

## Users

- Clients creating ride requests.
- Agents creating walk-in bookings.

## Functional Requirements

- `POST /api/bookings` must accept valid client booking payloads from `ClientBookingCreatePage`.
- `POST /api/bookings` must accept valid agent booking payloads from `AgentBookingCreatePage`.
- Missing or blank fields should receive a controlled validation response.
- Assignment side effects should not turn a successful booking creation into an unhandled 500.
- Existing booking assignment behavior should remain: assign approved active driver when available, otherwise queue.

## UI Expectations

None. This workflow does not change UI layout or styling.

## API Expectations

- Valid requests return `201` with `{ booking }`.
- Invalid requests return a structured error under `{ error: { code, message } }`.
- Server must not expose stack traces or sensitive details.

## Data Model Expectations

- No schema migration is expected.
- Booking documents continue to preserve `client`, `createdBy`, `source`, passenger details, addresses, status, and optional assigned driver.
- Assignment attempts remain best-effort audit records and should not break booking creation if their write fails in a non-critical way.

## Edge Cases

- Client request does not include `passengerName`; server should use authenticated user's name.
- Agent request may include blank optional phone; blanks should be normalized.
- No approved active driver should queue the booking.
- Assignment audit write failure should be handled so the user does not receive a 500 after the booking is already created.

## Constraints

- Keep API logic out of components.
- Keep frontend calls through `client/src/lib/api.js` and service files.
- Follow the flat `server/` structure.
- Existing dirty worktree is broad; edits must be narrowly scoped.

## Success Criteria

- The failing booking creation scenario is reproduced or covered by a focused backend test.
- Backend booking create no longer returns an unhandled 500 for valid booking input.
- Invalid booking input returns a controlled 4xx error.
- `npm test` passes.
- `cd client && npm test` passes if frontend files are touched.
- Workflow artifacts are updated.

## Out-Of-Scope Items

- UI redesign.
- Database seeding.
- Real-time dispatch.
- Deployment changes.

## Open Questions

- The exact server-side stack trace from the user's running backend is not available.

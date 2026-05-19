# Spec: Audit And Fix Ride Booking Assignment Queue

## Request Summary

Audit the ride booking assignment flow and fix the issue where booked rides are not being assigned to drivers. Desired behavior: client-created rides enter a queue when no driver is available; when an available driver exists, the driver is assigned and can accept or reject/cancel. If the driver rejects, the booking returns to the queue and assignment tries the next available driver.

## Date

2026-05-19

## Source Prompt

> please audit the flow of the booking of rides. rides are not been assigned to drivers. i want when client book rides it automatically enters a queue and then the available driver is assined who either approves or cancel. please audit this flow.

## Questions Asked And Answers Received

- Asked whether to audit only or audit and implement a fix.
  - Answer: audit and fix.
- Asked what counts as an available driver.
  - Answer did not explicitly define the full availability rule.
- Asked whether a booking should stay queued until a driver is available.
  - Answer: yes, it should stay in queue until driver is available.
- Asked whether an assigned driver rejection/cancel should send the booking back to the queue or cancel the ride.
  - Answer: booking should go back in queue.

## Assumptions

- Use the existing backend availability rule for assignment: driver profile must be `APPROVED` and lifecycle status must be `ACTIVE`.
- "Driver approves" maps to the existing driver trip accept endpoint.
- "Driver cancels" maps to the existing driver reject endpoint before trip start.
- No background worker will be added for this fix; assignment will be triggered by existing state changes where drivers become available.
- Existing realtime events remain the live UI notification mechanism.

## Goal

Make queued bookings automatically leave the queue when an approved driver becomes active, while preserving the existing assignment, rejection, and trip lifecycle behavior.

## Non-Goals

- Do not introduce geospatial/nearest-driver matching.
- Do not add a paid queue/background-job dependency.
- Do not redesign the booking or driver UI.
- Do not change deployment configuration.
- Do not rewrite the trip/payment lifecycle.

## Users

- Clients who create ride bookings.
- Drivers who become available, accept assigned rides, or reject pre-trip assignments.
- Admins/agents who monitor or manually retry queued assignments.

## Functional Requirements

- Client booking creation must keep the existing behavior:
  - assign immediately when an approved active driver exists;
  - otherwise set booking status to `QUEUED`.
- Queued bookings must remain `QUEUED` when no approved active driver is available.
- When a driver transitions to approved active availability, the system must assign the oldest eligible queued booking to that driver.
- The assigned queued booking must move to `DRIVER_ASSIGNED` and set `assignedDriver`.
- The assigned driver must move to `ASSIGNED`.
- Driver rejection must free the rejecting driver, return the booking to assignment flow, and assign another available driver when one exists.
- If no replacement driver exists after rejection, the booking must remain `QUEUED` with no assigned driver.
- Existing admin/agent manual retry and reassign behavior must continue to work.

## UI Expectations

No direct UI changes are expected. Realtime booking events should continue to update the UI through existing hooks.

## API Expectations

- Preserve existing routes and response shapes.
- Driver availability update should still return `{ profile }`.
- Admin driver approval/status update should still return `{ profile }`.
- Realtime booking events may be emitted when queued bookings are assigned because a driver became available.

## Data Model Expectations

- No schema changes expected.
- Existing `Booking.status`, `Booking.assignedDriver`, `DriverProfile.lifecycleStatus`, and `AssignmentAttempt` should be used.

## Edge Cases

- No queued bookings exist when driver becomes active: only the driver profile update should occur.
- Multiple queued bookings exist and one driver becomes active: assign only one oldest queued booking to that driver.
- Driver rejects with no other active driver available: booking returns to `QUEUED`.
- Admin approves a driver who was offline: driver becomes active and should receive an eligible queued booking.
- Driver manually switches from offline to active: driver should receive an eligible queued booking.
- Busy drivers (`ASSIGNED`, `ON_TRIP`) must not be manually marked active.

## Constraints

- Keep changes scoped to backend assignment flow and tests unless audit reveals a necessary frontend fix.
- Preserve role permissions.
- Keep realtime events working.
- Do not hard-code environment-specific URLs or secrets.
- Worktree dirty protection: initial status after syncing request contains only `WORK_REQUEST.md`.

## Success Criteria

- Audit identifies the assignment gap.
- Queued bookings are assigned automatically when a driver becomes active.
- Rejection returns a booking to queue when no alternate driver exists.
- Existing booking creation assignment still works.
- Relevant Jest/Supertest coverage is added or updated.
- Backend tests pass.

## Out-Of-Scope Items

- Location-based driver matching.
- Scheduled dispatch jobs.
- Driver push notifications outside existing realtime events.
- Frontend redesign.
- Production data migration.

## Open Questions

- Whether future dispatch should prioritize proximity, driver rating, or fairness beyond current oldest-driver/oldest-booking ordering.

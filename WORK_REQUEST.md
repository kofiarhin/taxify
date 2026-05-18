# Active Work Request

## Request ID

`2026-05-14-high-priority-lifecycle-fix`

## Source Prompt

Inspect the Taxify codebase and implement the high-priority lifecycle fix.

Goal:
Align booking/trip/payment flow with the required lifecycle.

Required booking statuses:
PENDING_ASSIGNMENT
QUEUED
DRIVER_ASSIGNED
DRIVER_ACCEPTED
TRIP_IN_PROGRESS
TRIP_ENDED
AWAITING_CLIENT_CONFIRMATION
AWAITING_DRIVER_PAYMENT_CONFIRMATION
PAID
COMPLETED
CANCELLED
DISPUTED

Required flow:
Client creates booking -> driver assigned/queued -> driver accepts -> driver starts trip -> driver ends trip -> fare calculated -> status TRIP_ENDED -> client confirms trip completion -> status AWAITING_DRIVER_PAYMENT_CONFIRMATION -> driver confirms cash received -> status PAID then COMPLETED -> commission created -> driver returns ACTIVE.

Implement:
1. Update backend status constants.
2. Remove/replace old TRIP_AWAITING_ARRIVAL_ACK and AWAITING_PAYMENT logic.
3. Refactor trip controller transitions:
   - end trip: TRIP_IN_PROGRESS -> TRIP_ENDED
   - client confirmation: TRIP_ENDED -> AWAITING_DRIVER_PAYMENT_CONFIRMATION
   - driver payment confirmation: AWAITING_DRIVER_PAYMENT_CONFIRMATION -> PAID -> COMPLETED
4. Keep existing routes stable where possible. Add aliases only if needed.
5. Update booking lifecycle service to create commission idempotently before final completion.
6. Ensure completed trips set driver lifecycleStatus back to ACTIVE.
7. Update admin complete override to use the new statuses.
8. Update frontend status constants and UI:
   - client sees fare after TRIP_ENDED
   - client confirms completion only on TRIP_ENDED
   - driver confirms cash received only after client confirmation
   - remove old arrival acknowledgement UI
9. Update affected admin/agent filters/displays.
10. Add/update Jest tests for full lifecycle:
   booking creation, assignment, accept, start, end, client confirmation, driver payment confirmation, PAID -> COMPLETED, commission created, driver ACTIVE.
11. Run backend tests and client build. Fix all failures.

Constraints:
Do not rewrite unrelated architecture.
Keep role permissions intact.
Keep realtime events working.
Use guarded transitions with clear 409 errors.
Return a clean patch with only necessary changes.

## Acceptance Criteria

- Backend status constants match the required lifecycle statuses.
- Old `TRIP_AWAITING_ARRIVAL_ACK` and `AWAITING_PAYMENT` lifecycle logic is removed or replaced.
- Trip end transitions from `TRIP_IN_PROGRESS` to `TRIP_ENDED`.
- Client confirmation transitions from `TRIP_ENDED` to `AWAITING_DRIVER_PAYMENT_CONFIRMATION`.
- Driver payment confirmation transitions through `PAID` to `COMPLETED`.
- Commission creation is idempotent and happens before final completion.
- Completed trips set the driver lifecycle status back to `ACTIVE`.
- Admin complete override uses the new lifecycle statuses.
- Frontend status constants, client/driver UI, and admin/agent displays reflect the new lifecycle.
- Full lifecycle Jest coverage exists or is updated.
- Backend tests run.
- Client build runs.

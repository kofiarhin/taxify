# Spec: High-Priority Booking Lifecycle Fix

## Request Summary

Align Taxify booking, trip, and cash-payment flow with the required lifecycle statuses and transitions across backend, frontend UI, admin operations, and tests.

## Date

2026-05-14

## Source Prompt

Inspect the Taxify codebase and implement the high-priority lifecycle fix. Required statuses are `PENDING_ASSIGNMENT`, `QUEUED`, `DRIVER_ASSIGNED`, `DRIVER_ACCEPTED`, `TRIP_IN_PROGRESS`, `TRIP_ENDED`, `AWAITING_CLIENT_CONFIRMATION`, `AWAITING_DRIVER_PAYMENT_CONFIRMATION`, `PAID`, `COMPLETED`, `CANCELLED`, and `DISPUTED`. Required flow is client creates booking, driver assigned or queued, driver accepts, driver starts trip, driver ends trip, fare calculated, status `TRIP_ENDED`, client confirms trip completion, status `AWAITING_DRIVER_PAYMENT_CONFIRMATION`, driver confirms cash received, status `PAID` then `COMPLETED`, commission created, driver returns `ACTIVE`.

## Questions Asked And Answers Received

No blocking questions were asked. The prompt gives the target lifecycle, required statuses, UI behavior, permission constraints, verification commands, and scope boundaries.

## Assumptions

- Existing trip routes should remain stable: `/client-arrived`, `/client-paid`, and `/driver-received` will keep working where practical, with client routes treated as aliases for client trip-completion confirmation.
- `AWAITING_CLIENT_CONFIRMATION` is a required constant but the explicit transition requirement is `TRIP_IN_PROGRESS -> TRIP_ENDED -> AWAITING_DRIVER_PAYMENT_CONFIRMATION`.
- Existing `arrival.clientMarkedAt` can record client trip-completion confirmation without a schema expansion.
- Existing `payment.driverConfirmedAt` can record driver cash receipt confirmation.
- Frontend visual changes should be limited to lifecycle text/buttons/status handling, not a redesign.
- Realtime event names should remain compatible where possible while payload status values change.

## Goal

Make the booking lifecycle deterministic and guarded so cash-trip completion follows the required order and stale arrival/payment statuses no longer drive application behavior.

## Non-Goals

- No unrelated route, schema, deployment, auth, role, or architecture rewrite.
- No online payment provider work.
- No full UI redesign.
- No migration script for historical bookings unless tests reveal model incompatibility.

## Users

- Clients confirming completed trips and viewing calculated fare.
- Drivers accepting, starting, ending, and confirming cash received.
- Agents monitoring queued bookings.
- Admins managing bookings and applying completion override.

## Functional Requirements

- Backend booking status constants must include the required statuses and remove old lifecycle statuses from active enums.
- Ending a trip must require `TRIP_IN_PROGRESS` and transition to `TRIP_ENDED` after calculating fare.
- Client confirmation must require `TRIP_ENDED` and transition to `AWAITING_DRIVER_PAYMENT_CONFIRMATION`.
- Driver payment confirmation must require `AWAITING_DRIVER_PAYMENT_CONFIRMATION`, mark cash paid, transition through `PAID`, create or reuse a commission row, then transition to `COMPLETED`.
- Driver lifecycle status must return to `ACTIVE` once booking completion is persisted.
- Guarded transition failures must return 409 with clear error codes/messages.
- Admin completion override must use new ready statuses and preserve completion guarantees.
- Commission creation must be idempotent before final completion.
- Realtime booking events must continue to emit for lifecycle changes.

## UI Expectations

- Client sees fare after `TRIP_ENDED`.
- Client can confirm trip completion only when status is `TRIP_ENDED`.
- Driver can confirm cash received only when status is `AWAITING_DRIVER_PAYMENT_CONFIRMATION`.
- Old arrival acknowledgement UI is removed or replaced with completion/payment-confirmation copy.
- Admin completion controls and tests use new statuses.
- Agent/admin filters and badges display new statuses.

## API Expectations

- Existing route names stay stable where possible.
- Add semantic aliases only if useful and low risk.
- REST response shapes remain compatible.
- Role permissions stay intact.

## Data Model Expectations

- `Booking.status` enum matches the required statuses.
- `Booking.statusHistory` records `TRIP_ENDED`, `AWAITING_DRIVER_PAYMENT_CONFIRMATION`, `PAID`, and `COMPLETED` in order.
- `Booking.payment.status` becomes `PAID` during driver cash confirmation.
- Commission upsert by booking remains the idempotency mechanism.

## Edge Cases

- Driver ending a trip outside `TRIP_IN_PROGRESS` returns 409.
- Client confirmation before `TRIP_ENDED` returns 409.
- Driver payment confirmation before client confirmation returns 409.
- Repeated driver payment confirmation after completion should return the completed booking without duplicating commission.
- Admin completion before client confirmation should return 409.
- Admin completion after client confirmation should finalize and activate the driver.

## Constraints

- Do not rewrite unrelated architecture.
- Keep role permissions intact.
- Keep realtime events working.
- Use guarded transitions with clear 409 errors.
- Return a clean patch with only necessary changes.
- Apply `design-taste-frontend` for frontend changes and run its final pre-flight matrix.

## Success Criteria

- Backend constants match required lifecycle statuses.
- Old `TRIP_AWAITING_ARRIVAL_ACK` and `AWAITING_PAYMENT` logic is removed or replaced.
- Full lifecycle backend test verifies booking creation, assignment, accept, start, end, client confirmation, driver payment confirmation, `PAID -> COMPLETED`, commission creation, and driver `ACTIVE`.
- Frontend constants and UI reflect the new lifecycle.
- Backend tests pass.
- Client build passes.

## Out Of Scope

- Historical data migration for bookings already saved with old statuses.
- New payment providers.
- Deployment configuration changes.
- Broad visual redesign.

## Open Questions

- Whether `AWAITING_CLIENT_CONFIRMATION` should be actively assigned after fare calculation in a later product revision. This implementation follows the explicit requested transition to `TRIP_ENDED`.

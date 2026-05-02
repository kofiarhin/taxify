# Taxify Client-Led Ride Flow Implementation Plan

## 1. Purpose

This plan translates [_spec/taxify-client-flow-spec.md](../_spec/taxify-client-flow-spec.md) into an execution roadmap for adding a client-led ride lifecycle to the existing Taxify codebase.

The repository already has more than the spec baseline: auth, Admin/Agent/Driver roles, booking dispatch, assignment attempts, trip start/end, fare calculation, commission tracking, socket invalidation, and tests are present. This plan is therefore a targeted migration and feature expansion, not a greenfield rebuild.

## 2. Current Baseline Observed

Existing backend modules:

- `server/constants/roles.js` contains `ADMIN`, `AGENT`, `DRIVER`.
- `server/constants/statuses.js` contains booking statuses such as `ASSIGNED`, `ACCEPTED`, `IN_PROGRESS`, `PAYMENT_PENDING`, `PAID`, `COMPLETED`.
- `server/models/Booking.js` supports staff-created customer bookings through `createdBy`, customer contact fields, assignment fields, fare fields, and payment timestamps.
- `server/models/Trip.js` supports start/end, fare breakdown, commission amount, and `paymentStatus`.
- `server/controllers/bookingController.js` creates staff bookings and auto-dispatches them.
- `server/controllers/tripController.js` currently ends a trip into `PAYMENT_PENDING`, then driver confirmation changes it to `PAID` and returns the driver to availability.
- `server/socket.js` emits global domain events.
- Frontend has role-based routes for Admin, Agent, and Driver only.
- Frontend already uses Tailwind CSS v4, React Router, Redux Toolkit, TanStack Query, Axios, and `@phosphor-icons/react`.

Main gaps against the spec:

- No `CLIENT` role.
- No public/client registration endpoint.
- No client-owned booking data contract.
- No `/client` API route family.
- No client dashboard, booking creation, or current booking tracker.
- No dual confirmation stage between trip end and driver payment confirmation.
- Driver status naming does not match the target model exactly: existing `BUSY` must be migrated or aliased to `ASSIGNED` and `ON_TRIP`.
- Socket events and query invalidation do not yet include the client-specific lifecycle events.

## 3. Delivery Strategy

Implement in narrow, reversible slices:

1. Add constants and compatibility helpers first.
2. Add data fields without changing existing behavior.
3. Add client auth and ownership-protected client endpoints.
4. Refactor lifecycle transitions through a centralized service.
5. Update driver payment confirmation to occur only after client confirmation.
6. Add client frontend routes, services, hooks, and pages.
7. Expand socket invalidation and tests.
8. Add migration/backfill tasks and release checks.

Do not refactor unrelated Admin, Agent, commission, complaint, or dashboard code unless required by the new lifecycle contract.

## 4. Target Lifecycle

Target status flow:

1. `PENDING_ASSIGNMENT`
2. `QUEUED`
3. `DRIVER_ASSIGNED`
4. `DRIVER_ACCEPTED`
5. `TRIP_IN_PROGRESS`
6. `TRIP_ENDED`
7. `AWAITING_CLIENT_CONFIRMATION`
8. `AWAITING_DRIVER_PAYMENT_CONFIRMATION`
9. `PAID`
10. `COMPLETED`
11. `CANCELLED`

Existing status mapping:

| Existing | Target |
| --- | --- |
| `ASSIGNED` | `DRIVER_ASSIGNED` |
| `ACCEPTED` | `DRIVER_ACCEPTED` |
| `IN_PROGRESS` | `TRIP_IN_PROGRESS` |
| `PAYMENT_PENDING` | `AWAITING_CLIENT_CONFIRMATION` initially, then `AWAITING_DRIVER_PAYMENT_CONFIRMATION` after client confirmation |
| `PAID` | `PAID` |
| `COMPLETED` | `COMPLETED` |

Driver status mapping:

| Existing | Target |
| --- | --- |
| `ACTIVE` | `ACTIVE` |
| `BUSY` during assignment wait | `ASSIGNED` |
| `BUSY` during trip | `ON_TRIP` |
| `OFFLINE` | `OFFLINE` |
| `SUSPENDED` | `SUSPENDED` |
| `DEACTIVATED` | `DEACTIVATED` |
| `PENDING_APPROVAL` | keep as onboarding-only extension |

## 5. Phase 1: Constants, Status Compatibility, and Domain Contract

### Backend Tasks

- Update `server/constants/roles.js`:
  - Add `CLIENT: "CLIENT"`.
- Update `server/constants/statuses.js`:
  - Add target booking statuses from the spec.
  - Add target driver statuses `ASSIGNED` and `ON_TRIP`.
  - Keep legacy statuses temporarily if existing tests or persisted records rely on them.
- Add helper sets in `server/constants/statuses.js`:
  - assignable booking statuses
  - active booking statuses
  - terminal booking statuses
  - client-visible booking statuses
  - driver-current-work statuses
- Add a small compatibility function, either in `statuses.js` or a new service:
  - `normalizeBookingStatus(status)`
  - `isLegacyBookingStatus(status)`
  - `getClientDisplayStatus(status)`
- Update frontend `client/src/constants/statuses.js` with the same target status values, colors, and display labels.
- Keep display labels separate from raw status constants.

### Testing Tasks

- Add backend unit/integration coverage that verifies the new constants are accepted by model validation.
- Add frontend tests or simple assertions where status labels are rendered.

### Definition of Done

- Both backend and frontend can import `CLIENT` and all target statuses.
- Existing tests still pass before lifecycle behavior changes.
- Legacy statuses are either supported during transition or explicitly migrated before removal.

## 6. Phase 2: Data Model Expansion

### Backend Tasks

- Update `server/models/User.js` if role enum validation is present so `CLIENT` users can persist.
- Update `server/models/Booking.js`:
  - Add `clientId` referencing `User`, default `null`.
  - Add `clientConfirmedAt`, default `null`.
  - Add `driverPaymentConfirmedAt`, default `null`.
  - Add `paymentRecordedAt`, default `null`.
  - Keep `createdBy` for Admin/Agent-created bookings.
  - Keep existing customer fields for backward compatibility and pre-fill them from the client profile for client-created bookings.
  - Add indexes for `{ clientId: 1, status: 1, createdAt: -1 }` and `{ clientId: 1, createdAt: -1 }`.
- Update `server/models/Trip.js`:
  - Add `clientConfirmedCompleteAt`, default `null`.
  - Add `driverConfirmedPaymentAt`, default `null`.
  - Expand `paymentStatus` enum to include at least `PENDING_CLIENT_CONFIRMATION`, `AWAITING_DRIVER_CONFIRMATION`, `PAID`.
  - Keep `paymentConfirmedAt` temporarily as a legacy alias or map it to `driverConfirmedPaymentAt`.
- Add model-level validation only where it cannot conflict with transitional records.

### Migration and Backfill Tasks

- Create a one-time script under `server/scripts/` if existing data needs migration:
  - Convert `ASSIGNED` to `DRIVER_ASSIGNED`.
  - Convert `ACCEPTED` to `DRIVER_ACCEPTED`.
  - Convert `IN_PROGRESS` to `TRIP_IN_PROGRESS`.
  - Convert `PAYMENT_PENDING` to `AWAITING_CLIENT_CONFIRMATION`.
  - Preserve `PAID`, `COMPLETED`, `CANCELLED`, `QUEUED`, and `PENDING_ASSIGNMENT`.
- For historical `PAID` trips:
  - Set `driverPaymentConfirmedAt` from `paidAt` or `paymentConfirmedAt`.
  - Set `paymentRecordedAt` from `paidAt`.
  - Leave `clientConfirmedAt` null unless product decides to backfill it.

### Definition of Done

- New fields exist and are indexed.
- Existing staff booking flow still works.
- Existing driver trip flow is not yet broken by new schema fields.

## 7. Phase 3: Client Auth and Registration

### Backend Tasks

- Add `POST /api/v1/auth/register-client`.
- Implement a validation schema in `server/routes/authRoutes.js` or a dedicated validator:
  - `fullName`
  - `email`
  - `phone`
  - `password`
  - optional default pickup metadata only if product wants it.
- Add controller/service logic:
  - Hash password with existing auth service.
  - Create a `User` with role `CLIENT`.
  - Enforce unique email.
  - Return serialized user and access token using existing auth response shape.
  - Never return `passwordHash`.
- Update `server/services/authService.js` serializer to safely handle `CLIENT`.
- Update seed script only if a demo client account is useful:
  - `client@taxify.local`
  - realistic full name and phone number.

### Frontend Tasks

- Add `client/src/services/authService.js` function for client registration.
- Add mutation hook under `client/src/hooks/mutations/` if existing auth mutations are separated, otherwise colocate with auth service usage.
- Add `/register-client` route if public self-registration is part of the first release.
- Update login/home redirects so `CLIENT` users land on `/client`.

### Tests

- Backend:
  - Client registration success.
  - Duplicate email rejection.
  - Password validation failure.
  - Registered client can call `/auth/me`.
  - Client cannot access Admin/Agent/Driver endpoints.
- Frontend:
  - Client redirect after login.
  - Role guard blocks client from existing staff/driver routes.

### Definition of Done

- A client can register, log in, restore session, and receive only `CLIENT` permissions.

## 8. Phase 4: Client Booking API

### Backend Tasks

- Add a new route file `server/routes/clientRoutes.js`.
- Mount it in `server/app.js` at `/api/v1/client`.
- Protect all routes with `auth` and `requireRole(ROLES.CLIENT)`.
- Add controller `server/controllers/clientController.js` or split by domain under client-specific controllers.
- Add validation schemas:
  - create client booking
  - booking id param
  - confirm complete.
- Implement `POST /api/v1/client/bookings`:
  - Create booking with `clientId: req.user._id`.
  - Set `createdBy: req.user._id` if the existing schema requires it.
  - Copy `customerName`, `customerPhone` from user unless explicitly provided.
  - Accept pickup/dropoff/pickupTime/specialInstructions/estimatedFare fields according to current booking schema.
  - Set `status: PENDING_ASSIGNMENT`.
  - Emit `client.booking.created`.
  - Call existing `dispatchBooking`.
  - If dispatch fails or no eligible driver exists, set `QUEUED` exactly as staff booking does.
- Implement `GET /api/v1/client/bookings/current`:
  - Return the newest non-terminal booking for `clientId`.
  - Include assigned driver public fields.
  - Include trip fare and timing fields when a trip exists.
  - Exclude sensitive driver user data.
- Implement `POST /api/v1/client/bookings/:id/confirm-complete`:
  - Verify the booking belongs to `req.user._id`.
  - Allow only `TRIP_ENDED` or `AWAITING_CLIENT_CONFIRMATION`, depending on the final transition naming chosen.
  - Set `clientConfirmedAt`.
  - Set related trip `clientConfirmedCompleteAt`.
  - Move booking to `AWAITING_DRIVER_PAYMENT_CONFIRMATION`.
  - Set trip `paymentStatus` to `AWAITING_DRIVER_CONFIRMATION`.
  - Emit `client.confirmed_complete`.
  - Audit action `CLIENT_CONFIRMED_COMPLETE`.
- Add optional `GET /api/v1/client/bookings/:id` only if current tracker needs historical detail. Otherwise defer.

### Ownership and Security Rules

- Client reads only bookings where `booking.clientId` equals the authenticated user id.
- Client cannot set `assignedDriverId`, `status`, `finalFare`, payment timestamps, or commission fields.
- Staff-created bookings with only `customerName/customerPhone` are not automatically visible to a client unless linked through `clientId`.
- Do not trust client-side fare, distance, or completion calculations.

### Tests

- Client creates a booking and it dispatches or queues.
- Client current booking returns only the authenticated client’s booking.
- Client cannot read another client’s booking.
- Client cannot confirm before trip end.
- Client confirmation is idempotency-safe or returns a clear conflict on repeat.

### Definition of Done

- Client can create and track their own active ride through backend APIs.
- Existing Admin/Agent booking APIs still work.

## 9. Phase 5: Lifecycle Service Refactor

### Backend Tasks

- Create or expand a central lifecycle service, for example `server/services/bookingLifecycleService.js`.
- Move status transition rules out of controllers where practical.
- Define transition functions:
  - `markDriverAssigned(booking, driverProfile, assignmentAttempt)`
  - `markDriverAccepted(booking, driverProfile, assignmentAttempt)`
  - `markTripStarted(booking, trip, driverProfile)`
  - `markTripEnded(booking, trip, fareResult)`
  - `markClientConfirmedComplete(booking, trip, clientUser)`
  - `markDriverConfirmedPayment(booking, trip, driverProfile)`
  - `markBookingCompleted(booking, trip)`
  - `cancelBooking(...)`
- Enforce transition guards:
  - only assigned driver can accept/reject/start/end/confirm payment.
  - only booking client can client-confirm.
  - cannot start until `DRIVER_ACCEPTED`.
  - cannot end until `TRIP_IN_PROGRESS`.
  - cannot client-confirm until trip ended and fare is available.
  - cannot driver-confirm payment until client confirmed completion.
  - cannot complete unless payment is recorded.
- Update `server/services/assignmentService.js`:
  - Use `DRIVER_ASSIGNED` instead of `ASSIGNED`.
  - Set driver status `ASSIGNED` for accepted pending assignment if that distinction is implemented.
  - Emit `booking.assigned` or `driver.assigned` consistently.
- Update accept/reject controller/service:
  - Accept moves booking to `DRIVER_ACCEPTED`.
  - Reject releases driver and either retries assignment or queues.
- Update `server/controllers/tripController.js`:
  - Start requires `DRIVER_ACCEPTED`.
  - Start moves booking to `TRIP_IN_PROGRESS`.
  - Start sets driver status `ON_TRIP`.
  - End moves booking to `TRIP_ENDED` and/or `AWAITING_CLIENT_CONFIRMATION`.
  - End must not return driver to active.
  - End must not record commission.
  - End emits `trip.ended`.
- Update driver payment confirmation:
  - Rename route behavior to match spec: `POST /trips/:id/confirm-payment`.
  - Keep existing `/confirm-cash-payment` route as a backward-compatible alias if needed.
  - Require `AWAITING_DRIVER_PAYMENT_CONFIRMATION`.
  - Set `driverPaymentConfirmedAt`, `paymentRecordedAt`, `paidAt`.
  - Set trip `driverConfirmedPaymentAt`.
  - Set trip payment status `PAID`.
  - Set booking `PAID`, then `COMPLETED` in the same transaction or as an explicit final transition.
  - Record commission after payment is confirmed.
  - Return driver to `ACTIVE` only after completion and lifecycle eligibility checks.
  - Emit `driver.confirmed_payment` and `booking.completed`.
- Use MongoDB transactions for multi-document lifecycle updates where feasible.

### Completion Semantics Decision

Recommended v1 behavior:

- Driver payment confirmation atomically records payment and marks booking `COMPLETED`.
- Keep `PAID` as a short-lived internal transition or timestamped state if needed for audit.
- API response can include final `COMPLETED` status with `paidAt` and `paymentRecordedAt`.

Alternative:

- Persist `PAID` first and have a separate system transition to `COMPLETED`.
- This is more complex and should be used only if Admin review is required between payment and completion.

### Tests

- Full backend lifecycle:
  - client booking created
  - driver assigned
  - driver accepts
  - driver starts trip
  - driver ends trip
  - client confirms complete
  - driver confirms payment
  - booking completed
  - driver active again.
- Illegal transition tests:
  - driver confirms payment before client confirmation.
  - client confirms another client’s booking.
  - driver ends another driver’s booking.
  - repeated confirm calls.
  - cancelled booking cannot continue.

### Definition of Done

- Lifecycle transitions match the spec and are covered by integration tests.
- Commission and driver availability happen only after final driver payment confirmation.

## 10. Phase 6: Socket Event Model

### Backend Tasks

- Emit the spec events:
  - `client.booking.created`
  - `driver.accepted`
  - `trip.started`
  - `trip.ended`
  - `client.confirmed_complete`
  - `driver.confirmed_payment`
  - `booking.completed`
- Keep existing events temporarily where current frontend screens depend on them:
  - `booking.created`
  - `booking.assigned`
  - `booking.queued`
  - `payment.confirmed`
- Add event payload conventions:
  - `bookingId`
  - `clientId`
  - `driverId`
  - `tripId`
  - `status`
  - `occurredAt`.
- Improve socket targeting if needed:
  - On connection, authenticate socket token.
  - Join `user:{userId}` room.
  - Join role rooms such as `role:ADMIN`, `role:AGENT`, `role:DRIVER`, `role:CLIENT`.
  - Emit client-specific booking events to the client user room instead of only global broadcasts.
- If authenticated sockets are deferred, keep global broadcast but rely on REST authorization for data access.

### Frontend Tasks

- Update `client/src/hooks/useSocketSync.js` invalidation map:
  - client booking created invalidates client current booking.
  - trip started/ended invalidates current booking and driver trip pages.
  - client confirmed complete invalidates client tracker and driver workspace.
  - driver confirmed payment and booking completed invalidate client tracker, driver workspace/history, staff lists, dashboard, and commission queries.
- Add `queryKeys.clientCurrentBooking` and any client history keys.

### Tests

- Backend socket emit can be covered indirectly through mocked `emitDomainEvent` if current test setup supports it.
- Frontend hook tests can verify event-to-query invalidation mapping if practical.

### Definition of Done

- Client tracker updates in near real time without manual refresh.
- Existing staff and driver screens continue to refresh on relevant events.

## 11. Phase 7: Frontend Client App

The mandatory `design-taste-frontend` guidance applies to this phase.

### Frontend Architecture Tasks

- Add client services:
  - `client/src/services/clientBookingService.js` or extend `bookingService.js` with client-specific functions.
- Add query hooks:
  - `client/src/hooks/queries/useClientBookingQueries.js`
- Add mutation hooks:
  - `client/src/hooks/mutations/useClientBookingMutations.js`
- Update `client/src/routes/AppRouter.jsx`:
  - Home redirect sends `CLIENT` to `/client`.
  - Add protected `CLIENT` route group.
  - Routes:
    - `/client`
    - `/client/bookings/new`
    - `/client/bookings/current`
- Update `client/src/components/shared/AppShell.jsx`:
  - Add `CLIENT` navigation.
  - Use `House`, `PlusCircle`, `MapPin`, `ClockCountdown`, `CheckCircle`, or equivalent Phosphor icons.
  - Keep mobile single-column collapse stable.
- Add client pages:
  - `client/src/pages/client/ClientDashboardPage.jsx`
  - `client/src/pages/client/ClientBookingCreatePage.jsx`
  - `client/src/pages/client/ClientCurrentBookingPage.jsx`
- Add focused components if reused:
  - booking status timeline
  - fare summary
  - assigned driver panel
  - completion confirmation panel.

### Client Dashboard Page

Purpose:

- Give the client an immediate view of their active ride and next action.

Content:

- If no current booking:
  - Primary action to create a booking.
  - Empty state that is concise and actionable.
- If a current booking exists:
  - Current status.
  - Pickup and dropoff.
  - Scheduled pickup time.
  - Assigned driver details when available.
  - Link to tracker.

States:

- Loading skeleton matching the layout.
- Inline error with retry.
- Empty state.
- Active booking summary.

### Create Booking Page

Fields:

- Pickup address.
- Dropoff address.
- Pickup time.
- Special instructions.
- Optional estimated fare only if current backend accepts it from booking creation.

Behavior:

- Submit through shared API client.
- On success, navigate to `/client/bookings/current`.
- Do not expose status, driver assignment, final fare, or payment fields.

Validation:

- Required pickup/dropoff.
- Pickup time must be valid and not obviously stale.
- Special instructions length cap.

Design:

- Labels above inputs.
- Helper/error text under inputs.
- Clear disabled state while submitting.
- Tactile active button state.

### Current Booking Tracker Page

Sections:

- Timeline of target lifecycle statuses.
- Pickup/dropoff summary.
- Driver assignment panel.
- Trip state panel.
- Fare summary after trip end.
- Confirm completion action when status is `AWAITING_CLIENT_CONFIRMATION` or equivalent.
- Completion receipt after `COMPLETED`.

Behavior:

- Poll through TanStack Query with modest interval as a fallback.
- Invalidate on socket events.
- Confirmation button is visible only when allowed.
- Confirmation mutation handles conflict/duplicate response clearly.

### Frontend Design Constraints

- Use Tailwind CSS only.
- Use `@phosphor-icons/react`, already installed.
- Do not add a new UI framework for this slice.
- Avoid card-overuse in the app shell; use grouped panels and borders consistently with the existing visual language.
- Do not introduce emojis.
- Provide loading, empty, and error states.
- Keep mobile layout single-column under `md`.
- Use `min-h-[100dvh]`/`min-h-dvh` patterns, not `h-screen`.
- CPU-heavy animations are not needed for this operational client flow.

### Tests

- `client/test/ClientPages.test.jsx`:
  - Dashboard empty state.
  - Dashboard active booking state.
  - Create booking form validates and submits.
  - Tracker shows timeline and fare after trip end.
  - Confirm completion calls mutation only in the right status.
- Route guard tests:
  - Client can access `/client`.
  - Admin/Agent/Driver cannot access `/client`.
  - Client cannot access `/admin`, `/agent`, or `/driver`.

### Definition of Done

- Client can register/login, create a booking, track it, and confirm completion through the UI.
- Client UI remains consistent with the existing app and passes frontend tests.

## 12. Phase 8: Admin and Agent Compatibility

### Backend Tasks

- Update Admin/Agent booking list filters to include new statuses.
- Update dashboard aggregations in `server/services/dashboardService.js`:
  - Active trips count uses `TRIP_IN_PROGRESS`.
  - Completed trips count uses `COMPLETED`.
  - Queue count unchanged.
  - Cash collected uses `paymentRecordedAt`, `paidAt`, or trip `driverConfirmedPaymentAt`.
- Update commission generation assumptions:
  - Commission records only after final driver payment confirmation.
- Ensure cancellation supports client-created bookings.
- Decide whether Admin/Agent can cancel client bookings and under what statuses.

### Frontend Tasks

- Update Admin/Agent booking tables and status filters.
- Update `BOOKING_STATUS_COLORS` for new statuses.
- Update status text in:
  - Admin bookings
  - Agent workspace
  - Queue pages
  - Driver workspace/trip pages.
- Ensure staff pages can distinguish `createdBy` and `clientId`.

### Tests

- Existing Admin/Agent booking tests updated for new statuses.
- Dashboard tests updated for the new lifecycle.
- Commission tests updated so commission is not created at trip end.

### Definition of Done

- Existing staff workflows remain usable.
- Reports and dashboards do not miscount in-progress, ended, confirmed, or completed trips.

## 13. Phase 9: Driver UI Updates

### Frontend Tasks

- Update driver workspace current assignment logic:
  - `DRIVER_ASSIGNED`: accept/reject.
  - `DRIVER_ACCEPTED`: start trip.
  - `TRIP_IN_PROGRESS`: end trip.
  - `TRIP_ENDED`/`AWAITING_CLIENT_CONFIRMATION`: show waiting for client confirmation.
  - `AWAITING_DRIVER_PAYMENT_CONFIRMATION`: show confirm payment action.
  - `COMPLETED`: return to available/no active assignment state.
- Update mutation function names if route alias changes:
  - `confirmPayment` should call `/trips/:bookingId/confirm-payment`.
  - Keep old endpoint path only while frontend migration is in progress.
- Add clear disabled and waiting states.
- Do not let the UI show payment confirmation before client confirmation.

### Backend Tasks

- Ensure driver current assignment endpoint includes enough status and trip fields to render waiting/payment states.
- Ensure driver availability is not restored while awaiting client or payment confirmation.

### Tests

- Driver page renders each new lifecycle state correctly.
- Payment confirmation button appears only after client confirmation.
- Driver history includes client-confirmed/payment timestamps where useful.

### Definition of Done

- Driver workflow follows the new dual confirmation model without exposing invalid actions.

## 14. Phase 10: End-to-End Testing and QA

### Backend Integration Tests

Add or expand `server/tests/dispatch-and-operations.test.js` with:

1. Client registration and login.
2. Client booking creation dispatches to an active driver.
3. Client booking queues when no driver is eligible.
4. Driver accepts client booking.
5. Driver starts trip.
6. Driver ends trip and fare is visible.
7. Client confirms completion.
8. Driver confirms payment.
9. Booking completes and driver becomes active again.
10. Commission is recorded only after driver payment confirmation.
11. Client cannot access another client’s booking.
12. Client cannot confirm before trip end.
13. Driver cannot confirm payment before client confirmation.
14. Admin/Agent can still list and inspect client bookings.

### Frontend Tests

Add:

- Client route guard tests.
- Client dashboard tests.
- Client create booking form tests.
- Client current booking tracker tests.
- Driver new-state rendering tests.
- Socket invalidation mapping tests if practical.

### Manual QA Script

1. Seed admin, agent, driver, and client users.
2. Log in as client.
3. Create a booking.
4. Verify admin/agent sees it.
5. Verify driver receives assignment.
6. Driver accepts.
7. Client tracker changes to accepted.
8. Driver starts trip.
9. Client tracker changes to in progress.
10. Driver ends trip with fare.
11. Client sees fare and confirms completion.
12. Driver sees payment confirmation action.
13. Driver confirms payment.
14. Client sees completed.
15. Admin sees completed booking/trip and commission.
16. Driver status returns to active.

### Definition of Done

- Backend test suite passes.
- Frontend test suite passes.
- Manual QA script completes without database correction.

## 15. Deployment and Environment Notes

- No deployment platform changes.
- Backend remains Heroku.
- Frontend remains Namecheap FTP via GitHub Actions.
- Confirm existing env vars are still sufficient:
  - root `.env` for backend.
  - `client/.env` for frontend.
  - `VITE_API_URL` for frontend API and socket base URL.
- Update `.env.example` only if new vars are introduced.
- Do not hard-code API URLs in frontend code.

## 16. Risk Register

Highest-risk areas:

- Status migration causing old dashboards or tests to fail.
- Driver availability returning too early after trip end.
- Commission being recorded at the wrong lifecycle point.
- Client ownership checks being missed on detail or confirm endpoints.
- Socket events leaking too broadly if payloads include sensitive details.
- UI showing stale action buttons during rapid status changes.

Mitigations:

- Centralize lifecycle transitions.
- Keep legacy endpoint/status aliases during migration.
- Add integration tests over the full lifecycle.
- Keep payloads minimal and fetch details through authorized REST queries.
- Use TanStack Query invalidation after every mutation and socket event.

## 17. Recommended File Impact

Backend likely changed:

- `server/constants/roles.js`
- `server/constants/statuses.js`
- `server/models/User.js`
- `server/models/Booking.js`
- `server/models/Trip.js`
- `server/routes/authRoutes.js`
- `server/routes/clientRoutes.js`
- `server/routes/tripRoutes.js`
- `server/app.js`
- `server/controllers/authController.js`
- `server/controllers/clientController.js`
- `server/controllers/tripController.js`
- `server/controllers/assignmentController.js`
- `server/services/authService.js`
- `server/services/assignmentService.js`
- `server/services/driverStatusService.js`
- `server/services/lifecycleService.js`
- `server/services/commissionService.js`
- `server/services/dashboardService.js`
- `server/socket.js`
- `server/validators/bookingValidators.js`
- `server/validators/tripValidators.js`
- `server/tests/dispatch-and-operations.test.js`
- `server/tests/auth.test.js`
- optional `server/scripts/migrateClientFlowStatuses.js`

Frontend likely changed:

- `client/src/constants/statuses.js`
- `client/src/routes/AppRouter.jsx`
- `client/src/components/shared/AppShell.jsx`
- `client/src/hooks/queryKeys.js`
- `client/src/hooks/useSocketSync.js`
- `client/src/services/authService.js`
- `client/src/services/bookingService.js`
- `client/src/services/clientBookingService.js`
- `client/src/services/tripService.js`
- `client/src/hooks/queries/useClientBookingQueries.js`
- `client/src/hooks/mutations/useClientBookingMutations.js`
- `client/src/hooks/mutations/useTripMutations.js`
- `client/src/pages/client/ClientDashboardPage.jsx`
- `client/src/pages/client/ClientBookingCreatePage.jsx`
- `client/src/pages/client/ClientCurrentBookingPage.jsx`
- `client/src/pages/driver/DriverWorkspacePage.jsx`
- `client/src/pages/driver/DriverTripPage.jsx`
- `client/test/ClientPages.test.jsx`
- `client/test/ProtectedRoute.test.jsx`
- `client/test/DriverPages.test.jsx`

## 18. Suggested Implementation Order

1. Constants and frontend status labels.
2. Booking and Trip model fields.
3. Client registration endpoint.
4. Client booking API routes and ownership tests.
5. Lifecycle service transition guards.
6. Driver trip end and payment confirmation behavior.
7. Socket event additions.
8. Frontend client services and query hooks.
9. Client route group and AppShell navigation.
10. Client dashboard page.
11. Client create booking page.
12. Client current booking tracker page.
13. Driver UI waiting/payment states.
14. Admin/Agent status compatibility updates.
15. Backend integration tests.
16. Frontend tests.
17. Migration/backfill script if persisted data exists.
18. Manual QA and release checklist.

## 19. Acceptance Criteria

The implementation is complete when:

- `CLIENT` is a supported role.
- A client can register and log in.
- A client can create a booking through `/client/bookings`.
- A client can fetch only their current booking.
- The system assigns or queues client-created bookings.
- A driver can accept/reject assigned client bookings.
- A driver can start and end a trip.
- Trip end exposes fare to the client without marking payment complete.
- Client confirmation is required before driver payment confirmation.
- Driver payment confirmation records payment and completes the booking.
- Commission is recorded after confirmed payment.
- Driver status returns to `ACTIVE` only after completion and lifecycle eligibility checks.
- Client, driver, admin, and agent UIs all reflect the new statuses.
- Socket events refresh relevant views.
- Backend and frontend tests cover the full lifecycle and authorization boundaries.

## 20. Frontend Design Pre-Flight Matrix

This matrix must be checked before any frontend implementation output:

- [ ] Global state is limited to auth/session/navigation/UI state; server state uses TanStack Query.
- [ ] Client booking API calls go through `client/src/lib/api.js`.
- [ ] Client server-state hooks live under `client/src/hooks/queries/` and `client/src/hooks/mutations/`.
- [ ] Mobile layouts collapse to one column under `md`.
- [ ] Full-height sections use `min-h-[100dvh]` or existing `min-h-dvh`, not `h-screen`.
- [ ] Client pages include loading, empty, and error states.
- [ ] Forms use labels above inputs and errors below inputs.
- [ ] Buttons have tactile active/disabled states.
- [ ] Icons use `@phosphor-icons/react`.
- [ ] No emojis are used in UI copy, code, markup, or alt text.
- [ ] No hard-coded API URLs are introduced.
- [ ] No CPU-heavy animation is introduced for the operational tracker.

# Taxify Full MERN Platform Spec

## Request Summary

Implement a new full MERN scaffold for Taxify, extending existing `client/` and `server/` folders if they exist, for a taxi dispatch and ride management platform covering authentication, driver onboarding, booking, assignment, trip lifecycle, cash payment confirmation, reviews, commissions, complaints/disputes, and admin/agent dashboards.

## Date

2026-05-13

## Source Prompt

User provided the updated Taxify taxi dispatch and ride management project brief and then clarified:

- Create or extend a full MERN scaffold.
- Use complete-workflow mode.
- Implement vertical slices in order: auth/roles, driver onboarding/availability, booking creation, assignment/queue, trip lifecycle, cash payment confirmation, reviews, commissions, complaints/disputes, admin/agent dashboards.
- Use REST endpoints for this phase; do not add Socket.IO yet.
- Design service/controller structure so real-time updates can be added later.
- Fare calculation is `baseFare + perKm + perMinute` with defaults: `baseFare = 10`, `perKm = 3`, `perMinute = 1`; store `distanceKm` and `durationMinutes` manually for now.
- Payments are cash-only.
- Create JWT auth and role-based route protection for `ADMIN`, `AGENT`, `DRIVER`, `CLIENT`.
- Admin analytics first pass includes total bookings, completed bookings, cancelled bookings, disputed bookings, queued bookings, total revenue, total commission, active drivers, pending driver approvals, and average driver rating.
- Keep implementation production-lean but not overengineered.

## Questions Asked And Answers Received

1. New scaffold or existing app extension?
   - Answer: New full MERN scaffold. If `client/` and `server/` already exist, extend them instead of deleting/rebuilding.
2. Entire brief or MVP slice?
   - Answer: Entire brief now using complete-workflow mode with listed vertical slices.
3. Real-time transport?
   - Answer: REST endpoints for this phase. Do not add Socket.IO yet; keep structure ready for future real-time updates.
4. Fare calculation?
   - Answer: `baseFare + perKm + perMinute`; defaults are base fare `10`, per-km `3`, per-minute `1`; store distance and duration manually.
5. Payments?
   - Answer: Cash-only for now.
6. Auth and roles?
   - Answer: Create JWT auth and role-based route protection.
7. Admin analytics first pass?
   - Answer: Include booking status counts, revenue, commission, active drivers, pending driver approvals, and average driver rating.

## Assumptions

- MongoDB will be used through Mongoose.
- Passwords will be hashed with bcrypt.
- Auth tokens will be sent as Bearer JWTs.
- Client registration creates `CLIENT` users. Admin and agent users can be seeded or created by privileged APIs.
- Driver accounts require onboarding approval before receiving bookings.
- Driver availability is represented by a driver lifecycle status and approval status.
- Assignment chooses the oldest approved active driver that is available and not currently assigned/on trip.
- If assigned driver rejects a booking, the booking returns to queued or reassignment flow.
- Commission is 10% of completed trip fare.
- Commission monthly tracking can be represented by per-trip commission records or computed aggregations, with receipt upload and approval endpoints.
- Complaint and dispute management can use a shared complaint/dispute resource with type/status fields.
- Frontend uses React, Vite, Tailwind CSS, React Router, Redux Toolkit for auth/client UI state, TanStack Query for server state, Axios through `client/src/lib/api.js`.
- No online payments, maps, geocoding, SMS/email, Socket.IO, or deployment changes are included in this phase.

## Goal

Deliver a working production-lean MERN application that supports Taxify's core taxi dispatch operations from account creation through ride completion, cash payment confirmation, post-trip reviews, commission tracking, complaint/dispute management, and role-appropriate dashboards.

## Non-Goals

- No Socket.IO or real-time push transport in this phase.
- No online payment processor.
- No map/geocoding integration.
- No production deployment changes.
- No full accounting system beyond commission tracking and receipt review.
- No advanced analytics beyond the requested first-pass dashboard metrics.

## Users

- Client: books rides, tracks status, confirms trip completion, reviews drivers, submits complaints.
- Driver: completes onboarding, manages availability, accepts/rejects bookings, starts/ends trips, confirms cash payment, views commissions and rating.
- Agent: creates bookings for offline customers, monitors queue, retries assignment, cancels pre-trip bookings, logs complaints.
- Admin: manages users/drivers, approvals, bookings, disputes, commissions, and dashboard analytics.

## Functional Requirements

- Auth and roles:
  - Register/login for clients.
  - JWT login for all roles.
  - Role-based route protection.
  - Sensitive fields such as password hashes must never be returned.
- Driver onboarding and availability:
  - Driver profile stores approval status, lifecycle status, vehicle/license details, rating aggregate, and review count.
  - Admin can approve/reject/suspend/deactivate drivers.
  - Approved active drivers can receive bookings.
- Booking creation:
  - Clients can create bookings for themselves.
  - Agents can create bookings for offline/walk-in customers.
  - Bookings store pickup/dropoff, requester details, source, status, assigned driver, fare fields, payment fields, and lifecycle timestamps.
- Assignment and queue:
  - System auto-assigns an available approved active driver.
  - If no driver is available, booking status becomes `QUEUED`.
  - Agents/admins can retry assignment.
  - Driver can accept or reject assigned bookings.
- Trip lifecycle:
  - Accepted booking can be started by assigned driver.
  - Driver ends trip with manually provided `distanceKm` and `durationMinutes`.
  - Fare is calculated using configured default rates.
  - Status advances through trip-ended and confirmation states.
- Cash payment confirmation:
  - Client confirms trip completion.
  - Driver confirms cash payment received.
  - Payment record is stored.
  - Booking becomes `PAID` then `COMPLETED`.
  - Driver returns to active/available state.
- Reviews:
  - Only clients can review their own completed booking.
  - Rating is 1 to 5 and feedback is optional.
  - One review per booking is enforced by backend validation and a unique index.
  - Driver rating aggregate and review count update after submission.
  - New drivers show a no-reviews state in the UI.
- Commissions:
  - 10% commission is generated for each completed trip.
  - Driver monthly commission totals are viewable.
  - Drivers can upload or submit receipt metadata.
  - Admin can approve/reject commission payments.
- Complaints and disputes:
  - Clients and agents can submit complaints.
  - Admin can view and manage complaints/disputes.
  - Bookings can be marked `DISPUTED` when appropriate.
- Dashboards:
  - Admin dashboard shows requested analytics.
  - Agent dashboard shows queue and operational actions.
  - Driver dashboard shows assigned trip, availability, ratings, and commissions.
  - Client dashboard shows current booking, history, fare, and review prompt.

## UI Expectations

- Use Tailwind CSS as the styling system.
- Use role-appropriate navigation and protected routes.
- Use the shared API client and service/query hooks for backend calls.
- Include loading, empty, and error states for primary data panels.
- Use clear status labels for booking and driver lifecycle states.
- Keep dashboard design utilitarian and scan-friendly, avoiding marketing-style layouts.
- Mobile layouts must collapse to a single-column flow.

## API Expectations

- REST API under `/api`.
- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- Drivers:
  - onboarding/profile endpoints
  - admin approval/status endpoints
  - availability update endpoint
- Bookings:
  - create/list/detail endpoints
  - queue/retry assignment endpoints
  - cancel/reassign/override endpoints by role
- Trips:
  - accept/reject/start/end/confirm-client/confirm-payment endpoints
- Reviews:
  - create review and fetch driver review summary/list.
- Commissions:
  - list driver/admin commission data
  - submit receipt
  - approve/reject receipt
- Complaints/disputes:
  - create/list/update endpoints.
- Dashboard:
  - admin analytics endpoint.

## Data Model Expectations

- User:
  - name, email, passwordHash, role, phone, status timestamps.
- DriverProfile:
  - user, approvalStatus, lifecycleStatus, vehicle details, license details, ratingAverage, reviewCount.
- Booking:
  - client, createdBy, createdByRole/source, passenger details, pickup, dropoff, status, assignedDriver, fare fields, payment status, timestamps.
- Trip:
  - booking, driver, startedAt, endedAt, distanceKm, durationMinutes, fare breakdown.
- DriverReview:
  - booking, client, driver, rating, feedback, unique booking index.
- Commission:
  - booking, driver, fare, commissionRate, commissionAmount, month, payment/review status, receipt.
- Complaint:
  - booking optional, createdBy, targetDriver optional, type, status, title, description, admin notes.

## Edge Cases

- No available drivers sends booking to queue.
- Driver rejection clears assignment and requeues/retries according to available drivers.
- Driver cannot start trips they did not accept.
- Trip cannot end without distance and duration.
- Client cannot confirm someone else's booking.
- Driver cannot confirm cash payment before client completion confirmation.
- Duplicate driver reviews are rejected.
- Unapproved/suspended/deactivated drivers cannot receive assignments.
- New drivers display no-review messaging instead of `0.0`.
- Cancelled/disputed bookings are excluded from revenue and commission totals unless explicitly completed.

## Constraints

- Existing dirty worktree has tracked deletions for `client/`, `server/`, root package files, and many historical implementation files.
- Because these overlap with planned implementation paths, implementation must stop until the user explicitly approves recreating/modifying those deleted tracked paths.
- Do not delete or reset user changes.
- Do not hard-code frontend API URLs.
- Backend env belongs in root `.env`; frontend env belongs in `client/.env`.
- Include `.env.example` files.
- Backend must fail fast on missing required env vars.
- Do not use `server/src/`.
- No deployment changes.

## Success Criteria

- Saved spec and task plan exist.
- With approval to work over overlapping deleted paths, scaffold includes a runnable backend and frontend.
- Auth, roles, booking, assignment, trip, payment, review, commission, complaint/dispute, and dashboard flows are implemented.
- Backend tests cover core auth/role and lifecycle rules.
- Frontend build succeeds and primary screens are wired through shared services/hooks.
- Final workflow artifacts are created and health check is recorded.

## Out Of Scope

- Socket.IO or push real-time.
- Online payment integration.
- Map/geocoding integration.
- Production deployment configuration changes.
- Destructive git cleanup/reset.

## Open Questions

- Blocker: current worktree contains tracked deletions overlapping planned implementation paths. User approval is required before recreating/modifying `client/`, `server/`, root package files, and related scaffold files.

# Taxify Full Implementation Plan

## 1. Plan Purpose

This plan translates [_spec/taxify-implementation-spec.md](C:/Users/laura.bolas/projects/taxify/_spec/taxify-implementation-spec.md) into an actionable implementation roadmap for the full Taxify platform. It is structured for execution in ordered slices, with clear dependencies, deliverables, test gates, and completion criteria.

## 2. Delivery Strategy

The repository is currently a scaffold, so the implementation should proceed in layered order:

1. Establish the platform foundation and project structure.
2. Build identity, authorization, and user management before domain workflows.
3. Implement dispatch and trip execution before financial workflows.
4. Add commission, complaints, and analytics after the operational core is stable.
5. Finish with hardening, release validation, and deployment readiness.

Guiding execution rules:

- Keep backend business rules in services, not controllers.
- Keep frontend API logic in `client/src/services/` using `client/src/lib/api.js`.
- Use Redux Toolkit only for app/session/UI state.
- Use TanStack Query for server state.
- Ship each phase with tests for its critical flows before moving forward.
- Avoid broad refactors outside the slice being implemented.

## 3. Global Workstreams

The project can be delivered through six parallel workstreams, but they must be sequenced by dependency:

- Product and technical decisions
- Backend platform and API
- Frontend app shell and role-based interfaces
- Domain workflows and business logic
- Testing and quality gates
- Deployment and operational readiness

## 4. Critical Early Decisions

These decisions should be confirmed before Phase 3 to avoid rework:

- Fare model for v1: manual final fare entry, fixed pricing rules, or distance/time formula
- Assignment policy: FIFO, round-robin, or least-recently-assigned
- Whether drivers can manually toggle `OFFLINE`
- Whether agents can manually override driver assignment
- Definition of overdue commission and suspension threshold
- Receipt storage choice for production
- Whether polling is sufficient for v1 or if real-time transport is required
- Whether customer data remains booking-scoped or gets its own model later

If these decisions are not available immediately, proceed with the defaults already implied by the spec:

- Manual or admin-controlled final fare
- FIFO or least-recently-assigned dispatch
- Polling for v1
- Booking-scoped customer data

## 5. Milestone Overview

### Milestone 1: Foundation

Goal:

- Turn the scaffold into a maintainable full-stack baseline.

Outputs:

- Backend bootstrapped with config, env validation, DB connection, middleware, routing structure
- Frontend bootstrapped with route shell, providers, API client, Tailwind baseline, and role-aware layout shell
- Test scaffolding added on both sides

### Milestone 2: Identity and User Management

Goal:

- Enable secure role-based access and driver onboarding/approval.

Outputs:

- Auth flow
- User/driver models
- Driver approval workflow
- Admin user management basics

### Milestone 3: Booking and Dispatch Core

Goal:

- Enable booking creation, automatic assignment, and queueing.

Outputs:

- Booking CRUD
- Assignment engine
- Queue flow
- Agent/Admin dispatch views

### Milestone 4: Driver Operations

Goal:

- Let drivers execute accepted jobs end-to-end.

Outputs:

- Driver assignment actions
- Trip start/end
- Cash payment confirmation
- Driver workflow UI

### Milestone 5: Commission and Compliance

Goal:

- Track earnings, debt, receipts, and suspension conditions.

Outputs:

- Commission generation
- Monthly statements
- Receipt submission/review
- Suspension enforcement

### Milestone 6: Complaints and Analytics

Goal:

- Add operations support tooling and business reporting.

Outputs:

- Complaint management
- Admin dashboard
- Reports and KPI endpoints

### Milestone 7: Hardening and Release

Goal:

- Make the system operationally safe and releasable.

Outputs:

- Audit logging
- Expanded tests
- Deployment validation
- Documentation and release checklist

## 6. Detailed Phase Plan

## Phase 1: Foundation and Project Restructure

### Objectives

- Establish the target repository structure from the project rules.
- Add missing core dependencies.
- Create consistent app bootstrap patterns for frontend and backend.
- Lay down shared utilities and test setup.

### Backend Tasks

- Create `server/config/env.js` to validate required env vars at startup.
- Create `server/config/db.js` for Mongo connection logic.
- Implement `server/app.js` with:
- `express.json()`
- `cors`
- `helmet`
- `morgan`
- centralized route mounting
- not-found middleware
- error handler middleware
- Implement `server/server.js` to load env, connect DB, and start the server.
- Add `server/constants/roles.js` and `server/constants/statuses.js`.
- Add utilities:
- `server/utils/apiError.js`
- `server/utils/asyncHandler.js`
- `server/utils/pagination.js`
- Add middleware:
- `server/middleware/auth.js`
- `server/middleware/requireRole.js`
- `server/middleware/validateRequest.js`
- `server/middleware/errorHandler.js`
- `server/middleware/notFound.js`
- Add base health endpoint such as `GET /api/v1/health`.

### Frontend Tasks

- Install and configure:
- Redux Toolkit
- React Redux
- TanStack Query
- Axios
- testing packages
- Build `client/src/lib/api.js` with:
- `baseURL` from `import.meta.env.VITE_API_URL`
- auth header injection
- unified error normalization
- Build `client/src/redux/store.js`
- Build `client/src/redux/providers.jsx`
- Add base auth slice in `client/src/redux/auth/`
- Add global UI slice in `client/src/redux/ui/`
- Add navigation slice in `client/src/redux/navigation/`
- Create router shell:
- `client/src/routes/AppRouter.jsx`
- `client/src/routes/ProtectedRoute.jsx`
- `client/src/routes/RoleRoute.jsx`
- Replace placeholder `App.jsx` with provider and route composition.
- Establish target folders under `components/`, `pages/`, `hooks/`, `services/`, `styles/`, and `constants/`.

### Testing Tasks

- Add Vitest config and frontend test setup file.
- Add Jest and Supertest config for backend.
- Add a smoke test for frontend render.
- Add a health endpoint test for backend.

### Deliverables

- Repo structure aligned to target conventions
- Shared API client created
- App shells working on both sides
- Test runners execute successfully

### Dependencies

- None. This is the first execution phase.

### Definition of Done

- Frontend dev server runs
- Backend server runs with env validation
- Shared providers and route shell are wired
- At least one frontend and one backend smoke test pass
- Linting runs without blocking errors

## Phase 2: Authentication and User/Driver Management

### Objectives

- Implement secure auth.
- Establish role-based access.
- Create driver onboarding and admin approval workflows.

### Backend Tasks

- Create `User` model.
- Create `DriverProfile` model.
- Implement password hashing and verification.
- Implement JWT issue/verify flow.
- Implement auth controller and routes:
- login
- logout placeholder or token invalidation strategy
- current-user endpoint
- Implement admin user management endpoints:
- list users
- create staff users
- update user status/basic profile
- Implement driver registration endpoint.
- Implement driver approval, suspension, deactivation, reactivation endpoints.
- Add response serializers to ensure sensitive fields are excluded.
- Add role-based and ownership enforcement on all user/driver endpoints.

### Frontend Tasks

- Build login page and auth session bootstrap.
- Build protected route handling for:
- unauthenticated access
- role mismatch access
- loading state during session restore
- Build admin user management page.
- Build admin driver approvals page.
- Build driver onboarding form.
- Build driver profile/status page shell.
- Add frontend services and query hooks for auth and driver data.

### Testing Tasks

- Backend tests:
- login success/failure
- unauthorized access rejection
- driver registration
- admin-only approval actions
- Frontend tests:
- login flow
- protected route redirect
- role-based page access

### Deliverables

- Auth system working for Admin and Agent
- Driver onboarding submission flow working
- Admin approval workflow working

### Dependencies

- Requires Phase 1 completion.

### Definition of Done

- User can log in and restore session
- Driver can register and remain pending approval
- Admin can approve and suspend drivers
- Protected routes enforce auth and role boundaries
- Sensitive fields are never returned in API responses

## Phase 3: Booking Management and Dispatch Engine

### Objectives

- Implement the operational heart of the platform: booking intake, assignment, and queue fallback.

### Backend Tasks

- Create `Booking` model.
- Create `AssignmentAttempt` model.
- Add booking validation schemas.
- Implement booking creation endpoint.
- Implement booking list/detail/update/cancel endpoints.
- Create `assignmentService.js` with:
- eligible driver discovery
- assignment ordering rule
- assignment attempt creation
- timeout metadata
- next-driver retry logic
- queue fallback logic
- Add booking queue retrieval endpoint.
- Add retry-assignment endpoint.
- Add assignment polling endpoint for drivers.
- Ensure dispatch writes audit history where appropriate.

### Frontend Tasks

- Build booking creation form for Agent/Admin.
- Build booking list and detail views.
- Build dispatch board showing:
- pending assignments
- assigned bookings
- queued bookings
- recent status changes
- Build queue monitor page with retry controls where allowed.
- Add query hooks and mutation hooks for bookings and queue.
- Add optimistic or immediate-refresh patterns after booking mutations.

### Testing Tasks

- Backend tests:
- booking creation validation
- assignment success when eligible driver exists
- queue fallback when no driver exists
- retry assignment behavior
- timeout/rejection path handling
- Frontend tests:
- booking creation form submission
- queue rendering
- retry assignment action behavior

### Deliverables

- Staff can create bookings
- System auto-assigns or queues bookings
- Dispatch board and queue monitor are usable

### Dependencies

- Requires authenticated users and driver statuses from Phase 2.

### Definition of Done

- Booking creation persists correctly
- Eligible drivers are assigned according to the chosen policy
- Rejections/timeouts produce the next valid state
- Queue data is visible to staff
- Driver assignment polling endpoint returns correct current assignment data

## Phase 4: Driver Assignment Actions and Trip Lifecycle

### Objectives

- Enable drivers to accept or reject assignments and complete trips to payment confirmation.

### Backend Tasks

- Create `Trip` model.
- Implement assignment accept endpoint.
- Implement assignment reject endpoint.
- Enforce response timeout rules.
- Implement trip start endpoint with state transition checks.
- Implement trip end endpoint with fare capture/finalization.
- Implement cash payment confirmation endpoint.
- Ensure driver status transitions are handled consistently through `driverStatusService.js`.
- Prevent illegal transitions such as:
- starting unaccepted bookings
- ending non-started trips
- confirming payment twice

### Frontend Tasks

- Build driver current-assignment screen.
- Build accept/reject interaction with countdown or visible expiry state.
- Build trip execution UI:
- start trip
- end trip
- payment confirmation
- Build driver trip history page.
- Add polling strategy for driver-assignment and current-trip state.
- Add clear state indicators for:
- assigned
- accepted
- in progress
- payment pending
- paid

### Testing Tasks

- Backend tests:
- accept assignment
- reject assignment
- trip start
- trip end
- cash payment confirmation
- invalid transition rejection
- Frontend tests:
- accept/reject action flows
- trip start/end interactions
- payment confirmation flow

### Deliverables

- Driver can execute the operational workflow end-to-end
- Completed trip generates payment-pending state
- Payment confirmation closes the booking lifecycle

### Dependencies

- Requires booking and dispatch engine from Phase 3.

### Definition of Done

- Drivers can only act on their own assignments
- State transitions remain valid under repeated or invalid requests
- Driver returns to assignable state after paid completion when not blocked
- Staff dashboards reflect driver actions within polling intervals

## Phase 5: Commission Tracking and Compliance Controls

### Objectives

- Automate commission generation and support driver payment settlement workflows.

### Backend Tasks

- Create `CommissionStatement` model.
- Build `commissionService.js` to:
- compute per-trip commission at 10%
- attach commission to trips
- aggregate by month/year
- calculate outstanding balance
- determine overdue state
- Implement commission list and detail endpoints.
- Implement receipt upload endpoint and storage abstraction.
- Implement admin receipt approval and rejection endpoints.
- Add suspension logic for overdue balances.
- Update assignment eligibility to exclude suspended/deactivated drivers.

### Frontend Tasks

- Build driver commission statement page.
- Build driver receipt upload form.
- Build admin commission review page.
- Add filters for month, year, status.
- Surface suspension and debt state clearly in admin and driver views.

### Testing Tasks

- Backend tests:
- commission calculation on trip completion
- monthly aggregation
- receipt submission
- approval/rejection flows
- suspension enforcement in dispatch eligibility
- Frontend tests:
- statement rendering
- receipt upload submission
- admin review action flow

### Deliverables

- Commission statements generate correctly
- Drivers can submit proof of payment
- Admin can settle or reject statements
- Suspended drivers are blocked from dispatch

### Dependencies

- Requires trip completion flow from Phase 4.

### Definition of Done

- Every completed paid trip contributes the correct commission amount
- Statement balances update correctly after review actions
- Dispatch engine respects compliance status
- Receipt uploads are validated and traceable

## Phase 6: Complaint Management and Admin Analytics

### Objectives

- Add post-trip operational support and executive visibility.

### Backend Tasks

- Create `Complaint` model.
- Implement complaint create/list/detail/update/resolve endpoints.
- Enforce complaint status progression and resolution note requirement.
- Build `dashboardService.js` with KPI aggregation for:
- bookings today
- active trips
- completed trips
- queue count
- average queue wait time
- acceptance/rejection rates
- cash collected today
- commission due this month
- suspended drivers count
- open complaints count
- Add secondary analytics endpoints for trend/report data.

### Frontend Tasks

- Build complaint logging form.
- Build complaint list/detail/resolve views.
- Build admin dashboard summary page.
- Build chart/table components for reports.
- Build limited operational reporting view for agents if required by access rules.
- Add dashboard filters and empty/loading/error states.

### Testing Tasks

- Backend tests:
- complaint CRUD
- complaint resolution
- KPI aggregation correctness
- Frontend tests:
- complaint creation and resolution
- dashboard summary rendering

### Deliverables

- Complaint workflow is operational
- Admin dashboard exposes the agreed KPIs
- Reports are available for decision-making

### Dependencies

- Requires operational and commission data from earlier phases.

### Definition of Done

- Complaint records link correctly to relevant entities when present
- Resolved complaints include required notes
- Dashboard metrics match seeded/test data expectations
- Admin-only analytics access is enforced

## Phase 7: Auditability, Hardening, and Release Preparation

### Objectives

- Close reliability, security, and release-readiness gaps.

### Backend Tasks

- Create `AuditLog` model.
- Add audit writes for critical actions:
- login attempts as needed
- driver approval/suspension/deactivation
- booking creation/cancellation/retry
- assignment accept/reject
- trip start/end
- payment confirmation
- commission review
- complaint resolution
- Add request rate limiting for auth and sensitive admin endpoints.
- Review input validation coverage and fill gaps.
- Review index strategy for high-frequency queries.
- Add pagination defaults and filtering safeguards for list endpoints.

### Frontend Tasks

- Improve empty/error states across major pages.
- Add consistent loading patterns and disabled-state handling.
- Validate accessibility of forms, tables, navigation, and keyboard flows.
- Finalize route-level guard behavior and session-expiry handling.

### Testing Tasks

- Expand integration coverage across critical cross-model workflows.
- Add regression coverage for invalid state transitions.
- Add seeded end-to-end manual QA script if automated browser tests are deferred.

### Deployment Tasks

- Create `.env.example` files for root and `client/`.
- Document local setup and required variables.
- Prepare frontend deployment workflow aligned to Namecheap FTP process.
- Prepare backend deployment settings aligned to Heroku.
- Validate production build commands.

### Deliverables

- Security and audit baseline complete
- Deployment and env documentation complete
- Release checklist complete

### Dependencies

- Requires all feature phases to be functionally complete.

### Definition of Done

- Critical flows have test coverage and manual verification notes
- Audit logs exist for key business events
- Rate limiting and validation protections are in place
- Deployment paths are documented and reproducible

## 7. Cross-Cutting Implementation Order Inside Each Phase

For each phase, execute work in this order:

1. Model and constants
2. Service/business logic
3. Controller and routes
4. Frontend service layer
5. Query/mutation hooks
6. UI pages/components
7. Automated tests
8. Manual verification against acceptance criteria

This order reduces rework and keeps UI from outrunning backend contracts.

## 8. Suggested File Creation Order

### Backend First-Wave Files

- `server/config/env.js`
- `server/config/db.js`
- `server/constants/roles.js`
- `server/constants/statuses.js`
- `server/utils/apiError.js`
- `server/utils/asyncHandler.js`
- `server/middleware/errorHandler.js`
- `server/middleware/notFound.js`
- `server/middleware/auth.js`
- `server/middleware/requireRole.js`
- `server/models/User.js`
- `server/models/DriverProfile.js`
- `server/routes/authRoutes.js`
- `server/controllers/authController.js`

### Frontend First-Wave Files

- `client/src/lib/api.js`
- `client/src/redux/store.js`
- `client/src/redux/providers.jsx`
- `client/src/redux/auth/authSlice.js`
- `client/src/routes/AppRouter.jsx`
- `client/src/routes/ProtectedRoute.jsx`
- `client/src/routes/RoleRoute.jsx`
- `client/src/pages/auth/LoginPage.jsx`

### Domain Expansion Files

- booking, assignment, trip, commission, complaint, dashboard models/controllers/routes/services
- matching frontend pages, components, services, and hooks by domain

## 9. Test Plan by Milestone

### Milestone 1

- Backend health endpoint test
- Frontend app render smoke test

### Milestone 2

- Login auth integration tests
- Protected route tests
- Driver registration and admin approval tests

### Milestone 3

- Booking creation tests
- Assignment service tests
- Queue fallback tests

### Milestone 4

- Driver accept/reject tests
- Trip lifecycle tests
- Payment confirmation tests

### Milestone 5

- Commission generation tests
- Receipt review tests
- Suspension enforcement tests

### Milestone 6

- Complaint workflow tests
- Dashboard aggregation tests

### Milestone 7

- Regression suite over all critical business flows

## 10. Manual QA Checklist

Before any release candidate, verify the following manually:

1. Admin can log in and manage drivers.
2. Agent can create a booking and watch it dispatch.
3. Booking goes to queue when no driver is eligible.
4. Driver sees assigned job and can accept or reject it.
5. Rejected booking re-enters dispatch correctly.
6. Driver can start and end trip.
7. Driver can confirm cash payment.
8. Trip appears in commission records.
9. Driver can upload commission receipt.
10. Admin can approve or reject the receipt.
11. Suspended driver cannot receive new work.
12. Complaint can be created and resolved.
13. Dashboard KPIs reflect recent actions.

## 11. Risks During Execution

### Highest Risk Areas

- Dispatch state transitions across bookings, assignments, drivers, and trips
- Idempotency of driver actions under polling and repeated taps
- Commission statement generation consistency
- Driver status conflicts between operational and compliance states
- Dashboard metrics drifting from source-of-truth records

### Mitigation Actions

- Centralize state transition logic in services
- Add explicit transition guards and tests
- Use seed data and fixed test fixtures for financial calculations
- Keep analytics derived from persisted records, not frontend-calculated aggregates
- Add audit logs before release hardening is complete

## 12. Recommended Team Execution Sequence

If implemented by one engineer or sequentially:

1. Phase 1
2. Phase 2
3. Phase 3
4. Phase 4
5. Phase 5
6. Phase 6
7. Phase 7

If implemented by a small team in parallel:

- Engineer A: backend platform, auth, domain services
- Engineer B: frontend app shell, role-based pages, data hooks
- Engineer C: tests, QA tooling, deployment pipelines

Parallelism should begin only after Phase 1 contracts are stable.

## 13. Final Release Gate

The implementation is ready for production handoff only when:

- All Phase 1 through Phase 7 definitions of done are satisfied
- The acceptance criteria in the spec are met
- Frontend and backend test suites pass
- Required env vars are documented
- Deployment steps are validated
- Known open decisions are either resolved or explicitly deferred with no blocker to v1

## 14. Recommended Immediate Next Implementation Slice

Start with a combined execution slice covering:

- repository restructure
- dependency installation
- backend env validation and app bootstrap
- frontend providers, router shell, and shared API client
- initial auth and user models

That slice creates the foundation needed for every other milestone and should be completed before any dispatch UI or business workflow code is started.

# Taxify Full MERN Platform Task Plan

## Spec File Used

`_spec/2026-05-13-taxify-full-mern-platform.md`

## Planning Date

2026-05-13

## Progress And Summary Files Read

- `_progress/progress.md`
- `_handoff/current.md`
- `_summary/README.md`
- `docs/PROJECT_CONTEXT.md`
- `docs/ARCHITECTURE.md`
- `docs/VERIFY.md`
- `docs/DECISIONS.md`

## Dirty Worktree Protection

`git status --short` shows many tracked files deleted before this workflow, including root package files, `client/`, `server/`, tests, and historical spec/plan files. Planned implementation paths overlap directly with those deleted tracked files. Per repo rules, implementation must stop until the user explicitly approves recreating or modifying those paths.

Existing dirty files include:

- Deleted root package/config/docs files such as `package.json`, `package-lock.json`, `.env.example`, `.gitignore`, `README.md`, `jest.config.js`
- Deleted frontend files under `client/`
- Deleted backend files under `server/`
- Deleted historical workflow files under `_spec/` and `_plan/`
- Modified `AGENTS.md`
- Newly added current workflow docs/directories

Planned files:

- Root package/config/env files
- `client/`
- `server/`
- `client/test/`
- `server/tests/`
- Workflow artifacts under `_spec/`, `_task/`, `_progress/`, `_handoff/`, `_review/`, `_release/`, `_summary/`

Overlap risk: high for implementation files. User later approved recreating the deleted scaffold paths with: "proceed and recreate".

## Execution Results

- TASK-001: Done. Scaffold, env validation, JWT auth, role guards, shared API client, Redux providers, and protected routes implemented.
- TASK-002: Done. Driver profile onboarding, approval, lifecycle status, and availability controls implemented.
- TASK-003: Done. Client/agent booking creation, automatic assignment, queue, and assignment retry implemented.
- TASK-004: Done. Driver accept/reject, trip start/end, fare calculation, and status transitions implemented.
- TASK-005: Done. Client completion confirmation, driver cash confirmation, completion, driver availability reset, and commission generation implemented.
- TASK-006: Done. Completed-trip driver review, duplicate review prevention, and aggregate ratings implemented.
- TASK-007: Done. Driver commission listing, receipt metadata submission, and admin review actions implemented.
- TASK-008: Done. Complaint/dispute creation and admin complaint management implemented.
- TASK-009: Done. Admin, agent, driver, and client dashboards implemented with loading, empty, and error states.
- TASK-010: Done. Backend and frontend tests/build verification, final diff audit, review, release, summary, and handoff completed.

Verification commands:

- `npm test` passed: 3 backend test suites, 6 tests.
- `cd client && npm test` passed: 1 frontend test suite, 1 test.
- `cd client && npm run build` passed.
- `git diff --stat` and `git diff -- . ':!package-lock.json' ':!client/package-lock.json'` completed for final audit.

Acceptance result:

- [x] Backend fails fast on missing required env vars.
- [x] JWT auth and role guards protect private APIs.
- [x] Client and driver registration/login support the role foundation.
- [x] Driver onboarding, approval, and availability are implemented.
- [x] Client and agent booking creation are implemented.
- [x] Automatic assignment and queue fallback are implemented.
- [x] Driver accept/reject/start/end lifecycle is implemented.
- [x] Fare calculation uses `10 + distanceKm * 3 + durationMinutes * 1`.
- [x] Client completion and driver cash confirmation are implemented.
- [x] Completed bookings create 10% commission records and return drivers to active status.
- [x] Completed client-owned bookings can receive one driver review, enforced by unique index.
- [x] Driver rating aggregate and review count update after reviews.
- [x] Commission receipt and admin review flows are implemented.
- [x] Complaint/dispute workflows are implemented.
- [x] Admin analytics include all requested first-pass metrics.
- [x] Frontend uses Tailwind, shared API client, service hooks, Redux auth state, and TanStack Query server state.

## Task List

### TASK-001: Create the runnable MERN scaffold and auth foundation

Status: Blocked

Objective:
Create or extend the root, backend, and frontend scaffolds with JWT authentication, role constants, role guards, shared API client, Redux provider, and protected route shell.

Files likely affected:

- `package.json`
- `.env.example`
- `server/app.js`
- `server/server.js`
- `server/config/env.js`
- `server/config/db.js`
- `server/models/User.js`
- `server/controllers/authController.js`
- `server/routes/authRoutes.js`
- `server/middleware/auth.js`
- `server/middleware/requireRole.js`
- `client/package.json`
- `client/src/lib/api.js`
- `client/src/redux/`
- `client/src/routes/`
- `client/src/pages/auth/`

Checklist:

- [ ] Create package scripts and env examples.
- [ ] Create Express app, env validation, DB connection, error middleware.
- [ ] Create user model and auth services/controllers.
- [ ] Add JWT authentication and role authorization.
- [ ] Create frontend API client, auth services, Redux auth slice, providers, and protected routes.
- [ ] Add basic login/register UI.

Acceptance criteria:

- [ ] Backend fails fast on missing required env vars.
- [ ] Client registration and login APIs work.
- [ ] JWT auth protects private routes.
- [ ] Role guards restrict role-specific endpoints.
- [ ] Frontend API calls go through `client/src/lib/api.js`.

Acceptance result:

- [ ] Blocked by dirty worktree overlap until user approves recreating/modifying deleted tracked paths.

Verification commands:

- `npm test`
- `cd client && npm run build`

Stop condition:

- Stop before editing implementation files because dirty tracked deletions overlap planned files.

Out-of-scope items:

- Socket.IO, online payments, deployment changes.

### TASK-002: Add driver onboarding, approval, and availability

Status: Planned

Objective:
Add driver profile lifecycle, onboarding fields, admin approval actions, and driver availability controls.

Files likely affected:

- `server/models/DriverProfile.js`
- `server/controllers/driverController.js`
- `server/routes/driverRoutes.js`
- `server/services/driverStatusService.js`
- `client/src/services/driverService.js`
- `client/src/hooks/queries/useDriverQueries.js`
- `client/src/hooks/mutations/useDriverMutations.js`
- `client/src/pages/driver/`
- `client/src/pages/admin/AdminDriversPage.jsx`

Checklist:

- [ ] Store driver profile, approval status, lifecycle status, and vehicle/license details.
- [ ] Add admin approve/reject/suspend/deactivate endpoints.
- [ ] Add driver availability update endpoint.
- [ ] Show driver profile, status, rating summary, and no-reviews state.

Acceptance criteria:

- [ ] Only approved active drivers are assignable.
- [ ] Admin can manage approval/status.
- [ ] Driver can mark self active/offline when allowed.

Acceptance result:

- [ ] Not started.

Verification commands:

- `npm test`
- `cd client && npm run build`

Stop condition:

- Stop if auth foundation is incomplete or driver status rules conflict with booking assignment.

Out-of-scope items:

- Automated onboarding document verification.

### TASK-003: Add booking creation and assignment queue

Status: Planned

Objective:
Allow clients and agents to create bookings, auto-assign available drivers, queue unassigned bookings, and retry assignment.

Files likely affected:

- `server/models/Booking.js`
- `server/models/AssignmentAttempt.js`
- `server/services/assignmentService.js`
- `server/controllers/bookingController.js`
- `server/routes/bookingRoutes.js`
- `server/routes/assignmentRoutes.js`
- `client/src/services/bookingService.js`
- `client/src/hooks/queries/useBookingQueries.js`
- `client/src/hooks/mutations/useBookingMutations.js`
- `client/src/pages/client/`
- `client/src/pages/agent/`
- `client/src/pages/admin/AdminQueuePage.jsx`

Checklist:

- [ ] Create booking model and status constants.
- [ ] Implement client and agent booking creation.
- [ ] Assign an available approved active driver or queue booking.
- [ ] Add assignment retry.
- [ ] Add booking/queue screens with loading, empty, and error states.

Acceptance criteria:

- [ ] Client-owned bookings are associated with the authenticated client.
- [ ] Agent-created bookings are marked as agent/offline source.
- [ ] No available driver produces `QUEUED`.
- [ ] Available driver produces `DRIVER_ASSIGNED` and driver status `ASSIGNED`.

Acceptance result:

- [ ] Not started.

Verification commands:

- `npm test`
- `cd client && npm run build`

Stop condition:

- Stop if booking ownership or driver assignment cannot be enforced safely.

Out-of-scope items:

- Real-time push updates.

### TASK-004: Add driver accept/reject and trip lifecycle

Status: Planned

Objective:
Implement driver accept/reject, trip start/end, fare calculation, and booking status transitions.

Files likely affected:

- `server/models/Trip.js`
- `server/services/fareService.js`
- `server/services/lifecycleService.js`
- `server/controllers/tripController.js`
- `server/routes/tripRoutes.js`
- `client/src/services/tripService.js`
- `client/src/hooks/mutations/useTripMutations.js`
- `client/src/pages/driver/DriverTripPage.jsx`
- `client/src/pages/client/ClientCurrentBookingPage.jsx`

Checklist:

- [ ] Driver accepts or rejects assigned booking.
- [ ] Rejected booking clears driver and returns to queue/retry flow.
- [ ] Driver starts accepted trip.
- [ ] Driver ends trip with distance and duration.
- [ ] Fare is calculated with configured default rates.

Acceptance criteria:

- [ ] Only assigned driver can accept/reject/start/end.
- [ ] Fare equals `10 + distanceKm * 3 + durationMinutes * 1`.
- [ ] Booking status advances through accepted, in-progress, and ended states.

Acceptance result:

- [ ] Not started.

Verification commands:

- `npm test`
- `cd client && npm run build`

Stop condition:

- Stop if lifecycle transitions permit invalid ordering.

Out-of-scope items:

- GPS distance calculation.

### TASK-005: Add cash payment confirmation and completion

Status: Planned

Objective:
Implement client completion confirmation, driver cash payment confirmation, payment record fields, booking completion, driver reactivation, and commission generation.

Files likely affected:

- `server/models/Booking.js`
- `server/models/CommissionStatement.js`
- `server/services/commissionService.js`
- `server/controllers/tripController.js`
- `client/src/pages/client/ClientCurrentBookingPage.jsx`
- `client/src/pages/driver/DriverTripPage.jsx`

Checklist:

- [ ] Client confirms trip completion.
- [ ] Driver confirms cash payment received.
- [ ] Booking becomes `PAID` then `COMPLETED`.
- [ ] Driver returns to `ACTIVE`.
- [ ] 10% commission is created.

Acceptance criteria:

- [ ] Driver cannot confirm payment before client confirmation.
- [ ] Completed booking records fare, payment, and commission.
- [ ] Completed driver is available again.

Acceptance result:

- [ ] Not started.

Verification commands:

- `npm test`
- `cd client && npm run build`

Stop condition:

- Stop if cash payment confirmation can be spoofed across roles.

Out-of-scope items:

- Online payment provider integration.

### TASK-006: Add post-trip driver reviews

Status: Planned

Objective:
Allow clients to review their completed booking once and update driver aggregate rating/review count.

Files likely affected:

- `server/models/DriverReview.js`
- `server/services/driverReviewService.js`
- `server/controllers/clientController.js`
- `server/routes/clientRoutes.js`
- `server/validators/driverReviewValidators.js`
- `client/src/components/client/DriverReviewPrompt.jsx`
- `client/src/services/driverReviewService.js`
- `client/src/hooks/mutations/useDriverReviewMutations.js`

Checklist:

- [ ] Enforce one review per completed booking.
- [ ] Validate rating 1 to 5.
- [ ] Update driver rating aggregate after review.
- [ ] Prompt client after booking completion.

Acceptance criteria:

- [ ] Duplicate reviews are rejected by service validation and database unique index.
- [ ] Driver aggregate rating and review count update.
- [ ] New drivers show no-review state.

Acceptance result:

- [ ] Not started.

Verification commands:

- `npm test`
- `cd client && npm run build`

Stop condition:

- Stop if duplicate review prevention is not enforced at database level.

Out-of-scope items:

- Review moderation workflow.

### TASK-007: Add commission receipt tracking

Status: Planned

Objective:
Expose driver monthly commission totals, receipt submission, and admin approval/rejection.

Files likely affected:

- `server/models/CommissionStatement.js`
- `server/controllers/commissionController.js`
- `server/routes/commissionRoutes.js`
- `server/services/commissionService.js`
- `client/src/pages/driver/DriverCommissionsPage.jsx`
- `client/src/pages/admin/AdminCommissionsPage.jsx`

Checklist:

- [ ] List driver commission obligations by month.
- [ ] Let driver submit receipt metadata.
- [ ] Let admin approve/reject submitted receipts.
- [ ] Show commission totals and status.

Acceptance criteria:

- [ ] Completed trips create 10% commission.
- [ ] Drivers can only see their own commission data.
- [ ] Admin can see and approve/reject all commission data.

Acceptance result:

- [ ] Not started.

Verification commands:

- `npm test`
- `cd client && npm run build`

Stop condition:

- Stop if commission data leaks across drivers.

Out-of-scope items:

- Actual file storage beyond receipt metadata unless already supported.

### TASK-008: Add complaints, disputes, and admin/agent operations

Status: Planned

Objective:
Allow clients/agents to create complaints, admins to manage disputes, and agents/admins to cancel or override appropriate booking states.

Files likely affected:

- `server/models/Complaint.js`
- `server/controllers/complaintController.js`
- `server/routes/complaintRoutes.js`
- `server/controllers/bookingController.js`
- `client/src/pages/client/ClientDashboardPage.jsx`
- `client/src/pages/agent/AgentComplaintsPage.jsx`
- `client/src/pages/admin/AdminComplaintsPage.jsx`
- `client/src/pages/admin/AdminBookingsPage.jsx`

Checklist:

- [ ] Create complaint/dispute model and endpoints.
- [ ] Allow client and agent complaint creation.
- [ ] Allow admin status and note updates.
- [ ] Allow valid cancellation/dispute overrides by role.

Acceptance criteria:

- [ ] Complaints preserve creator and optional booking context.
- [ ] Disputed booking status is visible to admin/agent/client where relevant.
- [ ] Pre-trip cancellations do not create revenue or commission.

Acceptance result:

- [ ] Not started.

Verification commands:

- `npm test`
- `cd client && npm run build`

Stop condition:

- Stop if override permissions are ambiguous or unsafe.

Out-of-scope items:

- External support ticket integration.

### TASK-009: Add admin, agent, driver, and client dashboards

Status: Planned

Objective:
Build first-pass role dashboards and admin analytics for the completed backend flows.

Files likely affected:

- `server/services/dashboardService.js`
- `server/controllers/dashboardController.js`
- `server/routes/dashboardRoutes.js`
- `client/src/pages/admin/AdminOverviewPage.jsx`
- `client/src/pages/agent/AgentWorkspacePage.jsx`
- `client/src/pages/driver/DriverWorkspacePage.jsx`
- `client/src/pages/client/ClientDashboardPage.jsx`
- `client/src/components/shared/AppShell.jsx`
- `client/src/components/shared/StatusPanel.jsx`

Checklist:

- [ ] Add admin dashboard analytics endpoint.
- [ ] Show requested admin metrics.
- [ ] Show agent queue and booking tools.
- [ ] Show driver active assignment, status, rating, and commission snapshot.
- [ ] Show client current booking, history, fare, confirmation, review, and complaints.

Acceptance criteria:

- [ ] Admin metrics include all requested counts/totals.
- [ ] Role dashboards do not expose unauthorized data.
- [ ] Primary UI states include loading, empty, and error states.
- [ ] Frontend follows Tailwind, shared API client, and TanStack Query hooks.

Acceptance result:

- [ ] Not started.

Verification commands:

- `npm test`
- `cd client && npm run build`

Stop condition:

- Stop if role-specific data access is not protected by backend authorization.

Out-of-scope items:

- Advanced charting libraries unless already installed.

### TASK-010: Add focused tests, final audit, and workflow artifacts

Status: Planned

Objective:
Add focused backend/frontend verification for the core lifecycle, run available checks, perform final diff audit, and create review, release, summary, and handoff updates.

Files likely affected:

- `server/tests/`
- `client/test/`
- `_progress/progress.md`
- `_handoff/current.md`
- `_review/2026-05-13-taxify-full-mern-platform.md`
- `_release/2026-05-13-taxify-full-mern-platform.md`
- `_summary/2026-05-13-taxify-full-mern-platform.md`

Checklist:

- [ ] Add backend tests for auth/roles and booking lifecycle.
- [ ] Add frontend tests for protected routing and key UI states where practical.
- [ ] Run backend tests and frontend build/tests.
- [ ] Run `git diff --stat` and `git diff`.
- [ ] Create review, release notes, and summary.
- [ ] Update handoff and workflow health.

Acceptance criteria:

- [ ] Verification commands pass or documented blocker exists.
- [ ] Final diff audit is recorded.
- [ ] Workflow artifacts are complete.

Acceptance result:

- [ ] Not started.

Verification commands:

- `npm test`
- `cd client && npm test`
- `cd client && npm run build`
- `git diff --stat`
- `git diff`

Stop condition:

- Stop if verification fails and cannot be fixed with targeted in-scope changes.

Out-of-scope items:

- Commit creation unless explicitly requested.

# Taxify Implementation Specification

## 1. Document Purpose

This document expands `taxify_project_brief.txt` into a full implementation specification for the Taxify platform. It defines scope, architecture, modules, workflows, data contracts, delivery phases, and acceptance criteria for a production-ready v1.

## 2. Project Summary

Taxify is a web-based taxi dispatch and operations platform that replaces manual dispatching with a centralized system for booking management, automatic driver allocation, trip execution, commission tracking, payment confirmation, and operational oversight.

Primary user roles:

- Admin
- Agent
- Driver

Primary business goals:

- Reduce manual dispatch overhead
- Improve driver-job matching speed
- Track trip execution from booking to payment
- Enforce commission collection and driver status controls
- Give administrators visibility into live operations and financial performance

## 3. Scope Definition

### 3.1 In Scope for V1

- Authentication and role-based access
- Admin, Agent, and Driver application areas
- Booking creation and management
- Automatic driver assignment
- Queue for unassigned bookings
- Driver accept/reject workflow
- Trip lifecycle tracking
- Cash payment confirmation
- Commission calculation and monthly aggregation
- Driver onboarding, approval, suspension, deactivation
- Complaint logging and resolution workflow
- Admin dashboard with operational analytics
- Basic audit logging
- Frontend and backend test coverage for critical paths

### 3.2 Out of Scope for V1

- In-app card payments
- Real-time GPS map tracking
- Passenger mobile app
- Dynamic pricing engine
- Multi-city franchise setup
- SMS/WhatsApp integrations
- Route optimization
- Automated payroll
- Native mobile apps

## 4. Product Assumptions

Because the brief is intentionally short, the following assumptions define v1 behavior unless changed later:

- Bookings are created by staff users, not by customers directly.
- Customer communication happens outside the system in v1.
- Driver assignment uses availability and simple priority rules, not GPS proximity.
- Trips are paid in cash only for v1.
- Commission is 10% of completed-trip fare.
- A driver cannot receive a new job unless their status is `ACTIVE` and they have no in-progress trip.
- Suspended or deactivated drivers cannot accept or receive new bookings.
- Complaint records are internal operations records linked to bookings and drivers when applicable.
- Monthly commission payment is verified by admin after driver receipt upload.

## 5. Target Tech Architecture

## 5.1 Frontend

- Framework: React with Vite
- Routing: React Router
- Styling: Tailwind CSS only for new work
- Global client state: Redux Toolkit
- Server state: TanStack Query
- HTTP client: Axios via shared client at `client/src/lib/api.js`
- Testing: Vitest + React Testing Library

## 5.2 Backend

- Runtime: Node.js
- Framework: Express
- Database: MongoDB with Mongoose
- Testing: Jest + Supertest

## 5.3 Deployment Constraints

- Frontend deployment target: Namecheap via FTP GitHub Actions
- Backend deployment target: Heroku
- Frontend API URL must use `import.meta.env.VITE_API_URL`
- Backend env vars must remain in root `.env`

## 5.4 Recommended Additions to Current Dependencies

The current scaffold is missing several dependencies required by the project rules and this spec.

Frontend:

- `@reduxjs/toolkit`
- `react-redux`
- `@tanstack/react-query`
- `axios`
- `zod` or similar schema validator
- `react-hook-form` for forms
- `vitest`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/user-event`

Backend:

- `cors`
- `helmet`
- `morgan`
- `bcrypt`
- `jsonwebtoken`
- `express-validator` or `zod`
- `multer` for receipt uploads
- `jest`
- `supertest`

## 6. High-Level Functional Modules

### 6.1 Authentication and Access Control

- Email/password login for Admin and Agent
- Driver login after approval
- JWT-based auth with refresh strategy or rotating access pattern
- Role-based route guards on frontend and backend
- Permission checks per action, not only per page

### 6.2 User and Driver Management

- Admin creates staff users
- Driver submits onboarding application
- Admin reviews and approves/rejects driver
- Driver profile stores license, vehicle, contact details, and status
- Driver status transitions enforced by business rules

### 6.3 Booking and Dispatch

- Agent/Admin creates booking
- System attempts auto-assignment
- If no eligible driver, booking enters queue
- Queue can be reprocessed automatically or manually
- Driver accepts or rejects assigned trip
- Rejected or timed-out assignments re-enter dispatch flow

### 6.4 Trip Execution

- Assigned driver starts trip
- Trip timer starts
- Driver ends trip
- Fare captured or calculated per pricing rules
- Completed trip awaits cash payment confirmation

### 6.5 Payment and Commission

- Cash payment recorded against completed trip
- Driver confirms collection
- Commission calculated automatically at 10%
- Monthly commission statement generated per driver
- Driver uploads payment receipt
- Admin verifies and marks commission payment settled

### 6.6 Complaints

- Admin/Agent logs complaint
- Complaint linked to booking/customer/driver if known
- Statuses: open, investigating, resolved, dismissed
- Resolution notes stored for audit

### 6.7 Analytics and Reporting

- Admin dashboard shows live operational metrics
- Historical metrics by day/week/month
- Driver commission summaries
- Booking conversion and rejection insights

## 7. Role Definitions and Permissions

## 7.1 Admin

Permissions:

- Manage all users
- Approve, suspend, deactivate drivers
- Create and edit bookings
- View and manage queue
- Override assignments
- View all trips and payments
- Review commission receipts
- Manage complaints
- Access all analytics

## 7.2 Agent

Permissions:

- Create bookings
- View booking list and statuses
- View queue
- Re-attempt dispatch when allowed
- Log complaints
- View limited operational reports

Restrictions:

- Cannot approve drivers
- Cannot manage staff accounts
- Cannot approve commission payments
- Cannot deactivate drivers

## 7.3 Driver

Permissions:

- View own profile and status
- View assigned bookings
- Accept or reject assignment
- Start and end own trip
- Confirm cash payment
- View own trip history
- View own commission statement
- Upload commission payment receipt

Restrictions:

- Cannot edit fare after admin-locked completion
- Cannot access other drivers’ data
- Cannot create bookings

## 8. Core Business Rules

### 8.1 Driver Statuses

- `PENDING_APPROVAL`: newly onboarded, cannot receive jobs
- `ACTIVE`: eligible for assignment
- `BUSY`: has accepted assignment or active trip
- `OFFLINE`: temporarily unavailable by choice or session state
- `SUSPENDED`: unpaid commission or admin action, no assignments allowed
- `DEACTIVATED`: long-term disabled, no access except controlled admin review

Rules:

- Only `ACTIVE` drivers can be auto-assigned.
- `BUSY` is derived operationally and should not conflict with suspension/deactivation rules.
- `SUSPENDED` and `DEACTIVATED` override availability.

### 8.2 Booking Statuses

- `PENDING_ASSIGNMENT`
- `QUEUED`
- `ASSIGNED`
- `ACCEPTED`
- `REJECTED`
- `IN_PROGRESS`
- `COMPLETED`
- `PAYMENT_PENDING`
- `PAID`
- `CANCELLED`

Notes:

- `COMPLETED` means trip ended.
- `PAYMENT_PENDING` can be explicit after trip completion if fare is final but payment not yet confirmed.
- `PAID` completes the operational lifecycle.

### 8.3 Assignment Rules

- Eligible driver set filters by:
- Driver status = `ACTIVE`
- Not already assigned/in-progress
- Commission state not blocking dispatch
- Optional vehicle/area constraints when provided

Initial assignment strategy for v1:

- FIFO or least-recently-assigned policy
- Configurable assignment timeout
- If driver rejects or times out, retry with next eligible driver
- If no driver accepts, booking remains queued

### 8.4 Commission Rules

- Commission rate fixed at 10%
- Calculated at trip completion using final fare
- Stored per trip and rolled into monthly commission ledger
- Driver may owe total outstanding balance across unpaid trips
- Admin can mark a monthly settlement paid after receipt review
- Drivers with overdue unpaid commission can be suspended

### 8.5 Complaint Rules

- Complaint may reference booking, driver, agent, or freeform issue
- Every complaint has owner, priority, and status
- Resolution requires note and resolver identity

## 9. User Flows

## 9.1 Booking Creation and Dispatch Flow

1. Agent/Admin enters customer name, phone, pickup, dropoff, requested time, notes, and optional fare estimate.
2. Backend validates booking payload.
3. Booking is created with `PENDING_ASSIGNMENT`.
4. Dispatch service finds eligible drivers.
5. If driver found, booking moves to `ASSIGNED` and driver receives assignment.
6. Driver accepts within timeout:
7. Booking becomes `ACCEPTED`; driver becomes operationally busy.
8. If driver rejects or timeout occurs:
9. Assignment attempt is logged and next driver is tried.
10. If no drivers remain, booking becomes `QUEUED`.

## 9.2 Queue Reprocessing Flow

1. A queued booking is reprocessed by scheduler or staff action.
2. Assignment service checks current eligible drivers.
3. If assigned, booking leaves queue.
4. If no driver available, queue timestamp remains for priority ordering.

## 9.3 Trip Lifecycle Flow

1. Driver opens accepted assignment.
2. Driver taps start trip.
3. Backend sets trip start timestamp and booking status `IN_PROGRESS`.
4. Driver taps end trip.
5. Backend records trip end timestamp, total duration, and fare.
6. Booking moves to `PAYMENT_PENDING`.
7. Driver confirms cash collected.
8. Backend marks booking `PAID`, records payment, computes commission, and returns driver to `ACTIVE` if no blocking condition exists.

## 9.4 Driver Onboarding Flow

1. Driver submits registration form with identity and vehicle details.
2. Driver record is created as `PENDING_APPROVAL`.
3. Admin reviews submitted information.
4. Admin approves or rejects.
5. Approved driver gains account access and initial status `ACTIVE` or `OFFLINE` depending on policy.

## 9.5 Commission Settlement Flow

1. System generates monthly commission summary per driver.
2. Driver reviews outstanding amount.
3. Driver uploads transfer receipt or proof of payment.
4. Admin reviews submission.
5. If approved, period statement becomes settled.
6. If rejected, admin adds rejection reason and statement stays due.
7. Overdue balances can trigger suspension.

## 10. Data Model Specification

## 10.1 User

Fields:

- `_id`
- `role`: `ADMIN | AGENT | DRIVER`
- `fullName`
- `email`
- `phone`
- `passwordHash`
- `isActive`
- `lastLoginAt`
- `createdAt`
- `updatedAt`

Notes:

- Driver-specific operational data should live in a separate `DriverProfile` document or a role-scoped extension object.

## 10.2 DriverProfile

Fields:

- `_id`
- `userId`
- `status`
- `licenseNumber`
- `licenseExpiry`
- `vehicleMake`
- `vehicleModel`
- `vehiclePlate`
- `vehicleColor`
- `nationalId` or local identifier
- `address`
- `emergencyContact`
- `approvedBy`
- `approvedAt`
- `suspendedAt`
- `suspensionReason`
- `deactivatedAt`
- `deactivationReason`
- `currentAssignmentId`
- `commissionDebt`
- `createdAt`
- `updatedAt`

## 10.3 Booking

Fields:

- `_id`
- `bookingReference`
- `createdBy`
- `customerName`
- `customerPhone`
- `pickupAddress`
- `dropoffAddress`
- `pickupTime`
- `specialInstructions`
- `estimatedFare`
- `finalFare`
- `status`
- `assignmentMode`: `AUTO | MANUAL | QUEUE_RETRY`
- `assignedDriverId`
- `acceptedAt`
- `rejectedAt`
- `cancelledAt`
- `cancelReason`
- `queueEnteredAt`
- `completedAt`
- `paidAt`
- `createdAt`
- `updatedAt`

## 10.4 AssignmentAttempt

Fields:

- `_id`
- `bookingId`
- `driverId`
- `attemptNumber`
- `status`: `PENDING | ACCEPTED | REJECTED | TIMEOUT | CANCELLED`
- `assignedAt`
- `respondedAt`
- `expiresAt`
- `reason`

Purpose:

- Preserve dispatch history and enable analytics on rejection and timeout rates.

## 10.5 Trip

Fields:

- `_id`
- `bookingId`
- `driverId`
- `startedAt`
- `endedAt`
- `durationMinutes`
- `distanceKm` optional for future support
- `fare`
- `commissionAmount`
- `paymentStatus`: `PENDING | PAID`
- `paymentConfirmedAt`
- `createdAt`
- `updatedAt`

## 10.6 CommissionStatement

Fields:

- `_id`
- `driverId`
- `periodMonth`
- `periodYear`
- `tripIds`
- `grossTripRevenue`
- `commissionRate`
- `commissionTotal`
- `amountPaid`
- `balanceDue`
- `status`: `DUE | SUBMITTED | APPROVED | REJECTED | SETTLED | OVERDUE`
- `receiptFileUrl`
- `submittedAt`
- `reviewedAt`
- `reviewedBy`
- `reviewNotes`
- `createdAt`
- `updatedAt`

## 10.7 Complaint

Fields:

- `_id`
- `bookingId` optional
- `driverId` optional
- `reportedByUserId`
- `customerName` optional
- `customerPhone` optional
- `category`
- `priority`: `LOW | MEDIUM | HIGH | CRITICAL`
- `description`
- `status`: `OPEN | INVESTIGATING | RESOLVED | DISMISSED`
- `assignedToUserId`
- `resolutionNotes`
- `resolvedAt`
- `createdAt`
- `updatedAt`

## 10.8 AuditLog

Fields:

- `_id`
- `actorUserId`
- `action`
- `entityType`
- `entityId`
- `metadata`
- `createdAt`

## 11. API Design

All endpoints should be versioned under `/api/v1`.

## 11.1 Auth

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/refresh` if refresh flow is implemented

## 11.2 Admin User Management

- `GET /users`
- `POST /users`
- `PATCH /users/:id`
- `GET /drivers/pending`
- `POST /drivers/:id/approve`
- `POST /drivers/:id/suspend`
- `POST /drivers/:id/deactivate`
- `POST /drivers/:id/reactivate`

## 11.3 Driver Self-Service

- `POST /drivers/register`
- `GET /drivers/me`
- `PATCH /drivers/me`
- `GET /drivers/me/trips`
- `GET /drivers/me/commissions`
- `POST /drivers/me/commission-receipts`

## 11.4 Bookings

- `GET /bookings`
- `POST /bookings`
- `GET /bookings/:id`
- `PATCH /bookings/:id`
- `POST /bookings/:id/cancel`
- `POST /bookings/:id/retry-assignment`
- `GET /bookings/queue`

## 11.5 Assignments

- `GET /assignments/me`
- `POST /assignments/:id/accept`
- `POST /assignments/:id/reject`

## 11.6 Trips

- `POST /trips/:bookingId/start`
- `POST /trips/:bookingId/end`
- `POST /trips/:bookingId/confirm-cash-payment`
- `GET /trips`
- `GET /trips/:id`

## 11.7 Complaints

- `GET /complaints`
- `POST /complaints`
- `GET /complaints/:id`
- `PATCH /complaints/:id`
- `POST /complaints/:id/resolve`

## 11.8 Commissions

- `GET /commissions`
- `GET /commissions/:id`
- `POST /commissions/:id/submit-receipt`
- `POST /commissions/:id/approve`
- `POST /commissions/:id/reject`

## 11.9 Dashboard and Analytics

- `GET /dashboard/summary`
- `GET /dashboard/bookings`
- `GET /dashboard/revenue`
- `GET /dashboard/drivers`
- `GET /dashboard/complaints`

## 12. Backend Architecture

Recommended structure:

```txt
server/
  app.js
  server.js
  config/
    env.js
    db.js
  constants/
    roles.js
    statuses.js
  controllers/
    authController.js
    bookingController.js
    commissionController.js
    complaintController.js
    dashboardController.js
    driverController.js
    tripController.js
    userController.js
  middleware/
    auth.js
    errorHandler.js
    notFound.js
    requireRole.js
    validateRequest.js
  models/
    AssignmentAttempt.js
    AuditLog.js
    Booking.js
    CommissionStatement.js
    Complaint.js
    DriverProfile.js
    Trip.js
    User.js
  routes/
    authRoutes.js
    bookingRoutes.js
    commissionRoutes.js
    complaintRoutes.js
    dashboardRoutes.js
    driverRoutes.js
    tripRoutes.js
    userRoutes.js
  services/
    assignmentService.js
    commissionService.js
    dashboardService.js
    driverStatusService.js
    receiptUploadService.js
  utils/
    apiError.js
    asyncHandler.js
    pagination.js
  tests/
```

### 12.1 Backend Responsibilities by Layer

- Routes: URL wiring and middleware composition
- Controllers: request/response orchestration only
- Services: business rules and multi-model workflows
- Models: schema and persistence
- Middleware: auth, validation, error handling
- Utils: shared helpers without domain logic

## 13. Frontend Architecture

Recommended structure:

```txt
client/src/
  components/
    dashboard/
    bookings/
    drivers/
    trips/
    complaints/
    commissions/
    shared/
  pages/
    auth/
    admin/
    agent/
    driver/
  routes/
    AppRouter.jsx
    ProtectedRoute.jsx
    RoleRoute.jsx
  hooks/
    queries/
    mutations/
  lib/
    api.js
  redux/
    store.js
    providers.jsx
    auth/
    navigation/
    ui/
  services/
    authService.js
    bookingService.js
    commissionService.js
    complaintService.js
    dashboardService.js
    driverService.js
    tripService.js
  utils/
  constants/
    constans.js
  styles/
```

### 13.1 Frontend App Areas

- Public/login pages
- Admin dashboard
- Agent dispatch workspace
- Driver workspace

### 13.2 Frontend State Strategy

Redux Toolkit:

- Auth/session state
- Navigation/sidebar state
- Global UI state such as toasts, modal registry, filters that must survive route changes

TanStack Query:

- Bookings lists and details
- Queue data
- Driver lists and profile data
- Trips
- Commission statements
- Complaints
- Dashboard summary data

### 13.3 Frontend Pages

Admin:

- Login
- Dashboard overview
- Staff management
- Driver approvals
- Active drivers
- Booking management
- Queue monitor
- Trips and payments
- Commission review
- Complaints
- Reports

Agent:

- Login
- Booking creation
- Dispatch board
- Queue list
- Complaint management

Driver:

- Login
- Profile/status
- Current assignment
- Trip history
- Commission statement
- Receipt upload

## 14. UI and UX Requirements

These are product requirements for the future frontend implementation.

- Responsive desktop-first app with usable mobile driver views
- Fast dispatch board with clear status color semantics
- Booking creation optimized for high-speed staff entry
- Driver app area optimized for large touch targets
- Status changes must surface immediate feedback
- Queue visibility must clearly show wait duration and retry state
- Analytics cards must highlight actionable metrics, not vanity totals
- Accessibility baseline: keyboard support, semantic forms, visible focus states, sufficient contrast

## 15. Realtime and Polling Strategy

V1 can ship with polling if websockets are deferred.

Recommended approach:

- Poll queue, active bookings, and driver assignment state every 10 to 20 seconds for staff dashboards
- Poll current assignment/trip state every 5 to 10 seconds for driver views
- Prefer server timestamps for all state transitions

Future upgrade:

- Replace critical polling paths with WebSocket or SSE updates

## 16. Validation and Error Handling

### 16.1 Backend Validation

- Validate all request bodies, params, and query strings
- Reject invalid state transitions
- Reject unauthorized entity access
- Return normalized error payloads

Suggested error response:

```json
{
  "success": false,
  "message": "Driver is not eligible for assignment",
  "errors": []
}
```

### 16.2 Frontend Validation

- Validate forms before submission
- Show inline errors for fields
- Show non-blocking toast or banner for request failures
- Disable duplicate submit actions while pending

## 17. Security Requirements

- Store passwords as hashes only
- Never return `passwordHash` in API responses
- Use JWT auth with secure expiration policy
- Restrict access by role and record ownership
- Sanitize file uploads and validate type/size
- Rate-limit login and sensitive endpoints
- Log critical admin actions
- Enforce backend truth for fares, payments, and commissions

## 18. Reporting and Analytics Requirements

Admin dashboard should expose:

- Total bookings today
- Active trips now
- Completed trips today
- Queue count
- Average queue wait time
- Driver acceptance rate
- Driver rejection rate
- Cash collected today
- Commission due this month
- Suspended drivers count
- Open complaints count

Secondary reports:

- Bookings by status over time
- Trips by driver
- Commission due and settled by month
- Complaint volume by category

## 19. Non-Functional Requirements

- API response time target: under 500ms for standard CRUD, excluding complex reports
- Key dashboard lists must support pagination and filtering
- System should maintain auditability of assignment and payment events
- Booking state changes must be idempotent where relevant
- Upload handling must be durable and traceable
- Timezone handling must be consistent across frontend and backend

## 20. Testing Specification

## 20.1 Frontend Tests

Location: `client/test/`

Priority coverage:

- Login flow
- Protected routes by role
- Booking creation form
- Queue display behavior
- Driver accept/reject actions
- Trip start/end actions
- Commission receipt upload form

## 20.2 Backend Tests

Location: `server/tests/`

Priority coverage:

- Auth login and authorization checks
- Booking creation validation
- Auto-assignment behavior
- Queue fallback when no eligible driver exists
- Driver accept/reject flow
- Trip lifecycle transitions
- Cash payment confirmation
- Commission calculation
- Driver suspension enforcement
- Complaint CRUD and resolution

## 20.3 Minimum Acceptance Test Scenarios

1. Agent creates booking when active driver exists and system assigns successfully.
2. Agent creates booking when no driver exists and booking enters queue.
3. Driver rejects booking and system retries next eligible driver.
4. Driver starts and ends trip; fare and commission are recorded.
5. Driver confirms cash payment and becomes available again.
6. Suspended driver is excluded from assignment.
7. Admin approves commission receipt and statement becomes settled.
8. Admin resolves complaint with audit trail preserved.

## 21. Environment and Configuration

### 21.1 Root `.env`

Required backend variables:

- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CLIENT_URL`
- receipt upload config variables if external storage is used

### 21.2 `client/.env`

Required frontend variables:

- `VITE_API_URL`

### 21.3 Fail-Fast Behavior

- Backend should validate required env vars on startup and exit if missing.
- Frontend should fail build or surface a clear configuration error if `VITE_API_URL` is absent.

## 22. Implementation Phases

## Phase 1: Foundation

- Establish target folder structure
- Add shared API client
- Add backend app bootstrap, DB config, env validation, and base middleware
- Add auth model, role constants, protected routing shell
- Add test scaffolding

Exit criteria:

- App boots on frontend and backend
- Auth-protected route skeleton works
- Lint and initial tests pass

## Phase 2: Auth and User Management

- Implement login, session restore, logout
- Add user and driver models
- Build admin user management basics
- Build driver onboarding and approval

Exit criteria:

- Admin and Agent can log in
- Driver can register and await approval
- Admin can approve drivers

## Phase 3: Booking and Dispatch

- Implement booking CRUD
- Implement assignment service
- Implement queue handling and retry
- Build staff dispatch pages

Exit criteria:

- Booking can be created and auto-assigned
- Queue fallback works
- Driver receives assignment data

## Phase 4: Driver Operations and Trip Lifecycle

- Implement driver assignment actions
- Implement trip start/end
- Implement cash payment confirmation
- Build driver workspace

Exit criteria:

- Driver can accept/reject trip
- Driver can start/end trip
- Payment confirmation closes operational loop

## Phase 5: Commission and Driver Compliance

- Implement trip commission generation
- Implement monthly statement aggregation
- Implement receipt upload and review flow
- Enforce suspension rules

Exit criteria:

- Commission statements generate correctly
- Receipt review works
- Overdue drivers can be suspended

## Phase 6: Complaints and Dashboard

- Implement complaint tracking
- Implement analytics endpoints
- Build admin dashboard and reports

Exit criteria:

- Complaints workflow is usable
- Dashboard shows core KPIs accurately

## Phase 7: Hardening and Release Readiness

- Add audit logs
- Improve error handling
- Expand test coverage
- Validate deployment pipelines and environment docs

Exit criteria:

- Critical flows covered by tests
- Production config documented
- Deployment process repeatable

## 23. Acceptance Criteria for V1 Release

The system is ready for v1 release when all of the following are true:

- Role-based auth works for Admin, Agent, and Driver
- Driver onboarding approval flow works end-to-end
- Booking creation and assignment flow works end-to-end
- Queue handling works when no driver is available
- Driver can accept, reject, start, end, and close payment on trips
- Commission is calculated correctly at 10%
- Driver commission submission and admin review work
- Suspended and deactivated drivers are blocked appropriately
- Complaint management works
- Admin dashboard metrics are accurate
- Critical backend and frontend tests pass
- Required environment variables are documented and enforced

## 24. Risks and Open Decisions

The brief leaves several decisions unspecified. These should be confirmed early to avoid rework:

- Whether pricing is manually entered, fixed-rule calculated, or distance/time based
- Whether drivers can go offline manually
- Whether assignment should use round-robin, FIFO, or priority ranking
- Whether booking edits are allowed after assignment or after trip start
- How overdue commission is defined in days
- Where receipt files are stored in production
- Whether real-time updates are required for v1 or polling is acceptable
- Whether agents can manually override assignment to a specific driver
- Whether customer records should be persisted separately from bookings

## 25. Recommended Immediate Next Step

Start with Phase 1 and Phase 2 combined as the initial implementation slice. The current repository is effectively a scaffold, so the first meaningful milestone should establish the final project structure, auth foundation, env validation, shared API client, protected routing, and core user/driver models before any dispatch logic is added.

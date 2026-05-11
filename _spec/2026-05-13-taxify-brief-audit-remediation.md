# Spec: Taxify Brief Audit And MVP Remediation

## Request Summary

Audit the current codebase against `taxify-project-brief.md`, identify MVP gaps, fix missing or incomplete REST-first MVP features, and ensure matching tests pass.

## Date

2026-05-13

## Source Prompt

```txt
audit the current codebase and ensure that it aligns with taxify-project-brief.md. make sure all features are fully implemented and all matching test passes
```

## Questions Asked And Answers Received

- Audit-only or audit plus remediation?
  - Audit plus remediation. First identify gaps, then fix missing or incomplete MVP features found during the workflow.
- What does "fully implemented" mean?
  - MVP REST implementation for now. No true real-time updates yet. Structure should allow Socket.IO later.
- Test scope?
  - Use existing tests as baseline. Add or expand tests wherever coverage is missing for implemented Taxify brief behavior.
- UI scope?
  - UI completeness and responsive polish are in scope for MVP screens, including dashboards, forms, status screens, loading, empty, and error states.
- Work across client and server?
  - Yes.
- Execution preference?
  - `complete-workflow`. Stop only for a real blocker, unsafe change, or missing required access.

## Assumptions

- Real-time status tracking is represented by REST fetch/mutation flows and query invalidation in this MVP; Socket.IO is out of scope.
- Existing model names and status constants should be preserved unless a brief gap requires extending them.
- Receipt uploads remain metadata-only for this MVP unless a file upload service is requested.
- No deployment configuration changes are required.

## Audit Findings

- Covered: multi-role auth, client/driver registration, driver onboarding/approval, assignment/queue, driver accept/reject/start/end, fare calculation, cash confirmation, review uniqueness, rating aggregates, commissions, complaints/disputes, role dashboards, shared API client, Redux auth/UI state, TanStack Query server state.
- Gap: the trip payment flow currently jumps from `AWAITING_DRIVER_PAYMENT_CONFIRMATION` directly to `COMPLETED`; the brief explicitly includes `PAID -> COMPLETED`.
- Gap: admin booking controls do not yet include complete/reassign override behavior from the brief. Cancel and dispute exist; retry assignment exists only for queued/retry flows.
- Gap: test coverage does not prove admin override/reassign behavior, PAID lifecycle ordering, driver rejection reassignment to a second driver, commission receipt review permissions, or client review constraints outside the happy path.
- Gap: admin booking UI exposes dispute only, so admins cannot perform the MVP controls listed in the brief from the screen.
- Gap: frontend tests only cover the login shell. They do not prove core MVP screens render loading/empty/error/action states.
- Polish issue: some compact action areas can be improved for responsive wrapping and accessible button state feedback while staying within the existing Tailwind system.

## Goal

Bring the MVP REST implementation into closer alignment with the project brief by closing high-value lifecycle, admin-control, UI, and test gaps without introducing real-time infrastructure or broad refactors.

## Non-Goals

- No Socket.IO or push notifications.
- No online payment provider.
- No real file upload/storage for commission receipts.
- No full redesign or styling-system migration.
- No deployment or CI changes.

## Users

- Admins managing bookings, drivers, complaints, commissions, and operational metrics.
- Agents creating offline bookings and managing queued/cancellable bookings.
- Drivers accepting/rejecting trips, managing availability, completing trips, and submitting commission receipt references.
- Clients booking rides, confirming completion, reviewing drivers, viewing ride history, and submitting complaints.

## Functional Requirements

- Preserve existing role-protected REST APIs and current passing behavior.
- Make payment confirmation record a `PAID` booking state before completion is finalized in the same REST operation or a clearly documented service transition.
- Add admin override endpoints for completing eligible paid/ended bookings and reassigning pre-trip bookings.
- Reassignment must release the prior assigned driver when appropriate and select an approved active driver.
- Reassignment must avoid reselecting the explicitly released driver when another eligible driver exists.
- Prevent unsafe admin completion before fare/payment prerequisites are met.
- Keep driver lifecycle status authoritative when bookings are cancelled, rejected, reassigned, completed, or disputed.
- Keep duplicate driver reviews blocked.
- Keep commission creation at 10% for completed trips.

## UI Expectations

- Admin bookings screen must expose useful MVP controls: retry/reassign, cancel, mark disputed, and complete override when allowed by status.
- Controls must use existing Tailwind components/classes, wrap on mobile, and avoid overlapping text.
- Loading, empty, error, and mutation feedback states must remain available.
- Use existing Phosphor dependency only where icons are needed.
- Frontend design pre-flight from `design-taste-frontend` applies to UI changes.

## API Expectations

- All frontend API calls must go through `client/src/lib/api.js` and service files.
- New booking endpoints should remain under `/api/bookings/:bookingId/...`.
- Errors should use the existing `{ error: { code, message } }` shape through `ApiError`.
- Backend must remain REST-first and easy to wrap with future event publishing.

## Data Model Expectations

- Reuse existing booking, driver, commission, complaint, review, and trip models.
- Avoid schema changes unless required by the remediation.
- Do not expose `passwordHash` or sensitive fields.

## Edge Cases

- Admin cannot complete a booking with no fare, no client confirmation, or no driver payment confirmation.
- Admin cannot reassign bookings already in progress, paid, completed, cancelled, or disputed.
- Reassigning a booking releases the prior assigned driver to `ACTIVE` only if the driver was waiting on that booking.
- If no alternate driver is available, reassignment returns the booking to `QUEUED`.
- Driver cash confirmation must remain blocked before client confirmation.
- Reviews remain one per completed client-owned booking.

## Constraints

- Dirty worktree at planning contains only the synced `WORK_REQUEST.md`.
- Baseline verification required escalation because Node could not access `C:\Users\laura.bolas` inside the sandbox.
- Current package manager is npm; backend uses Jest/Supertest, frontend uses Vitest/RTL.
- Tailwind CSS v3.4 is installed; `@phosphor-icons/react` is installed.

## Success Criteria

- [ ] Spec and task plan are saved before implementation.
- [ ] Current audit gaps are documented and remediated or explicitly deferred.
- [ ] Backend tests cover new admin override/reassign and lifecycle behavior.
- [ ] Frontend tests cover at least one MVP screen beyond login.
- [ ] `npm test` passes.
- [ ] `cd client && npm test` passes.
- [ ] `cd client && npm run build` passes.
- [ ] Final diff audit is completed and documented.
- [ ] Workflow artifacts are updated.

## Out-Of-Scope Items

- True real-time updates.
- Payment provider integration.
- File upload/storage for receipts.
- Full E2E browser automation.
- Production deployment changes.

## Open Questions

- None blocking. Future real-time event transport remains a known follow-up.

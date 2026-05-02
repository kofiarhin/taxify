# Taxify Driver Review Implementation Plan

## 1. Purpose

This plan translates [_spec/taxify-driver-review-spec.md](../_spec/taxify-driver-review-spec.md) into an execution roadmap for adding post-trip driver reviews to the current Taxify client-led ride flow.

The feature starts after the existing completed-booking lifecycle:

Client confirms trip complete -> Driver confirms payment -> Booking becomes `COMPLETED` -> Client can review the assigned driver once -> Driver aggregate rating updates.

This is a targeted feature addition. It should not change booking completion, payment recording, commission behavior, or driver availability.

## 2. Current Baseline Observed

Relevant backend modules already exist:

- `server/constants/roles.js` includes the app roles, including the recently added `CLIENT`.
- `server/constants/statuses.js` includes the client-led booking statuses, including `COMPLETED`.
- `server/models/Booking.js` stores `clientId`, `driverId`, completion timestamps, and payment confirmation timestamps.
- `server/models/DriverProfile.js` stores driver operational profile data.
- `server/controllers/clientController.js` owns client booking APIs.
- `server/routes/clientRoutes.js` mounts the client booking route family.
- `server/controllers/tripController.js` owns trip end and payment confirmation behavior.
- `server/socket.js` supports domain events.
- `server/tests/dispatch-and-operations.test.js` already covers dispatch, driver acceptance, trip lifecycle, and client-led completion.

Relevant frontend modules already exist:

- `client/src/lib/api.js` is the shared API client.
- `client/src/services/clientBookingService.js` owns client booking API calls.
- `client/src/hooks/queries/useClientBookingQueries.js` owns current client booking queries.
- `client/src/hooks/mutations/useClientBookingMutations.js` owns client booking mutations.
- `client/src/hooks/queryKeys.js` centralizes TanStack Query keys.
- `client/src/hooks/useSocketSync.js` invalidates queries after socket events.
- `client/src/pages/client/ClientDashboardPage.jsx` and `ClientCurrentBookingPage.jsx` show client booking state.
- `client/src/pages/driver/DriverWorkspacePage.jsx` shows driver status/workspace information.
- `client/test/` contains Vitest + React Testing Library tests.

Main gaps:

- No `DriverReview` persistence model.
- No review aggregate fields on `DriverProfile`.
- No review submission endpoint.
- No current-booking review eligibility state.
- No frontend review prompt or mutation hook.
- No driver aggregate rating display.
- No backend/frontend tests for review rules.

## 3. Delivery Strategy

Implement in narrow slices:

1. Add database shape and aggregate fields.
2. Add review validation and backend service logic.
3. Expose client-owned review submission and review eligibility state.
4. Add socket invalidation for review events.
5. Add the client review prompt UI.
6. Add driver aggregate rating display.
7. Add tests around authorization, validation, duplicate protection, UI states, and aggregate updates.
8. Run the existing full validation suite.

Do not implement review editing, review deletion, moderation, driver replies, push notifications, or public profile pages.

## 4. Phase 1: Backend Data Model

### Files

- Add `server/models/DriverReview.js`
- Update `server/models/DriverProfile.js`

### Tasks

- Create a `DriverReview` Mongoose model with:
  - `bookingId`: ObjectId ref `Booking`, required, unique, indexed
  - `driverId`: ObjectId ref `User`, required, indexed
  - `clientId`: ObjectId ref `User`, required, indexed
  - `rating`: Number, required, integer, min `1`, max `5`
  - `comment`: String, trim, max `500`, default `null`
  - timestamps enabled
- Add indexes:
  - `{ bookingId: 1 }` unique
  - `{ driverId: 1, createdAt: -1 }`
  - `{ clientId: 1, createdAt: -1 }`
- Extend `DriverProfile` with:
  - `averageRating`: Number, default `0`
  - `reviewCount`: Number, default `0`
  - `ratingTotal`: Number, default `0`
- Keep existing driver profile fields untouched.
- Ensure model JSON serialization does not expose sensitive user fields through population.

### Definition of Done

- `DriverReview` can be imported in tests and controllers.
- Mongoose enforces one review per booking at the database level.
- Existing profile creation still works for seeded and test drivers.

## 5. Phase 2: Backend Validation

### Files

- Add `server/validators/driverReviewValidators.js`
- Update `server/routes/clientRoutes.js`

### Tasks

- Add validation middleware for `POST /api/v1/client/bookings/:bookingId/review`.
- Validate route param:
  - `bookingId` must be a valid Mongo ObjectId.
- Validate request body:
  - `rating` is required.
  - `rating` must be an integer.
  - `rating` must be between `1` and `5`.
  - `comment` is optional.
  - `comment` must be at most `500` characters after trim.
- Normalize an empty or whitespace-only comment to `null`.
- Return clear field-level error messages where the repo's existing validation style supports it.

### Definition of Done

- Invalid ratings fail before business logic runs.
- Overlong comments fail consistently.
- Empty comments do not create noisy empty strings in the database.

## 6. Phase 3: Backend Review Service

### Files

- Add `server/services/driverReviewService.js`
- Use existing error utility patterns from the repo.

### Tasks

- Implement `submitDriverReview({ bookingId, clientId, rating, comment })`.
- Fetch booking by `bookingId`.
- Return `404` if the booking does not exist.
- Return `403` if `booking.clientId` does not match authenticated `clientId`.
- Return `422` if booking status is not `COMPLETED`.
- Return `422` if the booking has no assigned `driverId`.
- Return `409` if a review already exists for `bookingId`.
- Derive `driverId` from the booking. Do not trust any driver id in the request body.
- Create `DriverReview`.
- Update the assigned driver's `DriverProfile` aggregate:
  - increment `ratingTotal` by `rating`
  - increment `reviewCount` by `1`
  - set `averageRating = ratingTotal / reviewCount`
- Handle Mongo duplicate key errors for `bookingId` as `409`.
- Prefer a Mongoose session/transaction only if the existing test database setup supports it cleanly. Otherwise, rely on the unique index for idempotency and update the aggregate immediately after creation.
- Return the created review and aggregate rating payload.

### Definition of Done

- The service is the only place that owns review eligibility and aggregate update logic.
- Duplicate reviews are protected by both app-level check and database unique index.
- Aggregate values update from backend state only.

## 7. Phase 4: Backend Controller and Routes

### Files

- Update `server/controllers/clientController.js`
- Update `server/routes/clientRoutes.js`

### Tasks

- Add controller action: `submitDriverReview`.
- Mount route:
  - `POST /api/v1/client/bookings/:bookingId/review`
- Protect route with existing auth middleware.
- Restrict route to `CLIENT`.
- Call `submitDriverReview` service with authenticated user id.
- Emit socket event after successful review:
  - event name: `driver.reviewed`
  - payload: `bookingId`, `driverId`, `clientId`, `rating`, `averageRating`, `reviewCount`
- Return `201` with:
  - review id
  - booking id
  - driver id
  - client id
  - rating
  - comment
  - created at
  - driver aggregate rating

### Definition of Done

- A client can submit one valid review for their own completed booking.
- Drivers, admins, agents, and unauthenticated users cannot submit client reviews.
- Socket listeners receive a review event after successful submission.

## 8. Phase 5: Current Client Booking Review State

### Files

- Update `server/controllers/clientController.js`
- Use `server/models/DriverReview.js`

### Tasks

- Extend current client booking response to include `review` state when the returned booking is completed or review-relevant.
- For a completed eligible booking with no review:
  - `review.eligible = true`
  - `review.submitted = false`
  - `review.rating = null`
- For an already reviewed booking:
  - `review.eligible = false`
  - `review.submitted = true`
  - `review.rating = submitted rating`
  - optionally include `review.comment` and `review.createdAt` if useful for confirmation display
- For ineligible active/cancelled/staff bookings:
  - either omit `review` or return a stable object with `eligible = false`.
- Keep the response backward-compatible for existing client pages.

### Definition of Done

- Client UI can decide whether to show the review prompt from API state.
- Existing current booking views still render active trip states.

## 9. Phase 6: Optional Admin Review Read Model

### Files

- Add or update admin driver controller/route only if an admin driver detail route already exists.
- Likely files:
  - `server/controllers/driverController.js`
  - existing admin/driver routes

### Tasks

- Keep this phase optional for the first implementation unless admin pages already have a natural driver detail endpoint.
- If implemented, add:
  - `GET /api/v1/admin/drivers/:driverId/reviews`
  - role `ADMIN`
  - pagination with `page` and `limit`
  - newest-first ordering
- Return:
  - review id
  - booking id/reference
  - rating
  - comment
  - created at
  - minimal client display data only if already allowed elsewhere

### Definition of Done

- Admin can inspect review history without exposing sensitive client fields.
- If skipped, the first implementation still satisfies the core client review flow.

## 10. Phase 7: Backend Tests

### Files

- Update `server/tests/dispatch-and-operations.test.js`
- Or add `server/tests/driver-reviews.test.js` if the existing lifecycle test file becomes too large.
- Update `server/tests/helpers/testUtils.js` only if reusable helpers are needed.

### Test Cases

- Client can review their own completed booking.
- Review response includes created review and driver aggregate.
- Driver profile `reviewCount`, `ratingTotal`, and `averageRating` update.
- Client cannot review before booking is `COMPLETED`.
- Client cannot review another client's booking.
- Client cannot review a booking without a driver.
- Client cannot review the same booking twice.
- Duplicate key conflict maps to `409`.
- Rating missing returns `400`.
- Rating below `1` returns `400`.
- Rating above `5` returns `400`.
- Non-integer rating returns `400`.
- Comment over `500` characters returns `400`.
- Authenticated non-client roles cannot submit reviews.
- Current client booking response shows eligible review state after completion.
- Current client booking response shows submitted state after review.
- Existing dispatch and trip lifecycle tests still pass.

### Definition of Done

- Backend tests prove authorization, validation, lifecycle gating, duplicate protection, and aggregate updates.

## 11. Phase 8: Frontend API and Query Layer

### Files

- Add `client/src/services/driverReviewService.js`
- Update `client/src/hooks/queryKeys.js`
- Add `client/src/hooks/mutations/useDriverReviewMutations.js`
- Update `client/src/hooks/queries/useClientBookingQueries.js` only if response shaping needs adjustment.
- Update `client/src/hooks/useSocketSync.js`

### Tasks

- Add API service function:
  - `submitDriverReview(bookingId, payload)`
  - uses `client/src/lib/api.js`
  - calls `POST /client/bookings/:bookingId/review`
- Add query key:
  - `clientCurrentBooking` invalidation already exists; reuse it.
  - add `driverReviews` or `driverRating` only if admin/driver review queries are implemented.
- Add mutation hook:
  - `useSubmitDriverReviewMutation`
  - accepts `bookingId`, `rating`, `comment`
  - invalidates current client booking query on success
  - invalidates driver workspace/current assignment queries if aggregate rating is shown there
  - invalidates admin driver detail/list if optional admin read model is implemented
- Update socket sync:
  - on `driver.reviewed`, invalidate client current booking and driver/profile queries that display rating.

### Definition of Done

- Components do not call Axios directly.
- Review server state stays in TanStack Query, not Redux.
- Mutation success updates visible UI without a full page reload.

## 12. Phase 9: Frontend Review Prompt Component

### Files

- Add `client/src/components/client/DriverReviewPrompt.jsx`
- Add test coverage in `client/test/DriverReviewPrompt.test.jsx` or a client page test.

### Component Contract

Props:

- `bookingId`
- `driverName`
- `driverVehicle`
- `review`
- `onSubmitted` optional callback if the page needs local side effects

Internal state:

- selected `rating`
- `comment`
- dismissed-for-session boolean, if implemented locally

UI states:

- eligible prompt
- no rating selected
- submitting
- submit success
- submitted confirmation
- inline validation error
- server error
- dismissed for current session

### Design and Accessibility Requirements

- Use a compact grouped section inside the completed trip area, not a blocking modal.
- Do not nest cards.
- Use five fixed-size rating buttons with stable dimensions on mobile and desktop.
- Each rating button must be a real `button`.
- Each rating button must include an accessible label such as `Rate driver 5 out of 5`.
- Selected state must expose `aria-pressed`.
- Submit button disabled until a rating is selected.
- Add tactile `active` states through transform/scale, using Tailwind classes.
- Use `@phosphor-icons/react` only if icons are needed; it is already installed.
- Avoid emoji stars. Use numeric buttons, text labels, or Phosphor icons.
- Error text appears near the rating/comment controls.
- Text must not overflow at mobile widths.
- Loading should avoid a generic spinner; use button text/state and disabled styles.

### Definition of Done

- The prompt is accessible by keyboard and screen reader.
- The prompt has loading, error, success, and already-submitted states.
- The UI fits the existing operational dashboard style.

## 13. Phase 10: Client Page Integration

### Files

- Update `client/src/pages/client/ClientDashboardPage.jsx`
- Update `client/src/pages/client/ClientCurrentBookingPage.jsx`

### Tasks

- Show `DriverReviewPrompt` when:
  - booking status is `COMPLETED`
  - `booking.review.eligible === true`
  - `booking.review.submitted === false`
- Show submitted confirmation when:
  - `booking.review.submitted === true`
- Keep completed trip details visible above or alongside the prompt.
- Do not block navigation or hide the trip summary.
- If dashboard and current-booking page share the same completed trip surface, extract a small shared component only if it reduces duplication without creating an abstraction too early.

### Definition of Done

- Client sees the review prompt after payment confirmation completes the booking.
- Client does not see the prompt during active or awaiting-confirmation states.
- Client does not see the prompt again after submitting a review.

## 14. Phase 11: Driver Rating Display

### Files

- Update `server/controllers/driverController.js` or whichever endpoint feeds driver workspace profile data.
- Update `client/src/pages/driver/DriverWorkspacePage.jsx`
- Update related driver service/query files if needed:
  - `client/src/services/driverService.js`
  - `client/src/hooks/queries/useDriverQueries.js`

### Tasks

- Ensure driver workspace API includes:
  - `averageRating`
  - `reviewCount`
- Show:
  - `No reviews yet` when `reviewCount` is `0`.
  - rating rounded to one decimal when reviews exist.
  - review count with clear label.
- Do not expose client review comments in driver workspace for the first implementation unless explicitly needed.
- Invalidate driver workspace data after `driver.reviewed` socket event.

### Definition of Done

- Driver can see aggregate performance context.
- Empty state does not display misleading `0.0`.

## 15. Phase 12: Optional Admin UI

### Files

- Update `client/src/pages/admin/AdminDriversPage.jsx` if the driver list is the natural surface.
- Add admin review query/service only if backend admin route is implemented.

### Tasks

- Add average rating and review count to driver list/detail if data is already available.
- Optional review history table:
  - date
  - booking reference
  - rating
  - comment
- Keep table dense and operational.
- Do not add marketing-style cards or large empty hero sections.

### Definition of Done

- Admin can use review data for oversight if this optional phase is included.
- Core client review flow remains complete even if detailed admin history is deferred.

## 16. Phase 13: Frontend Tests

### Files

- Add `client/test/DriverReviewPrompt.test.jsx`
- Update `client/test/DriverPages.test.jsx` if driver rating display changes.
- Add or update client page tests if current booking page rendering is covered.

### Test Cases

- Completed eligible booking renders review prompt.
- Non-completed booking does not render prompt.
- Already reviewed booking renders confirmation state.
- Submit button is disabled before rating selection.
- Selecting rating changes `aria-pressed` and enables submit.
- Submitting calls mutation with selected rating and comment.
- Successful submit shows submitted/confirmation UI.
- Server error displays inline message.
- Comment length validation blocks overlong comments if frontend validates locally.
- Driver workspace shows `No reviews yet` for zero reviews.
- Driver workspace shows rounded rating and count when reviews exist.

### Definition of Done

- Frontend tests cover interaction, accessibility state, success, and failure.

## 17. Phase 14: Seed and Local Data Considerations

### Files

- Optional update: `server/services/seedService.js`

### Tasks

- Do not seed reviews by default unless useful for manual driver-rating display validation.
- If seed reviews are added:
  - create a completed booking first
  - create exactly one review for that booking
  - update driver profile aggregate consistently
- Keep the seed script fresh-start behavior intact:
  - clear database collections
  - seed admin, driver, and client users
  - avoid duplicates

### Definition of Done

- Existing seed command still creates a clean admin, driver, and client set.
- Optional review seed data does not break one-review-per-booking rules.

## 18. Phase 15: Manual QA Flow

Run this end-to-end flow after automated tests:

1. Start backend and frontend dev servers.
2. Run the seed command for a clean database.
3. Log in as client.
4. Create a booking.
5. Log in as admin or use existing assignment flow to assign the booking.
6. Log in as driver.
7. Accept the assignment.
8. Start the trip.
9. End the trip.
10. Log in as client.
11. Confirm trip completion if required by the lifecycle.
12. Log in as driver.
13. Confirm payment.
14. Log in as client.
15. Confirm booking is `COMPLETED`.
16. Verify review prompt appears.
17. Submit rating `5` with a short comment.
18. Verify prompt changes to submitted confirmation.
19. Refresh page and confirm the prompt does not reappear.
20. Log in as driver.
21. Verify aggregate rating and review count updated.

## 19. Validation Commands

Run from repo root:

```bash
npm test
```

Run frontend checks:

```bash
npm test --prefix client
npm run lint --prefix client
npm run build --prefix client
```

Run seed validation if seed data is touched:

```bash
npm run seed:users
```

If a dev server is needed for manual QA:

```bash
npm run dev
npm run dev --prefix client
```

Use the actual available frontend port if Vite selects a fallback because the default port is occupied.

## 20. Rollout and Compatibility Notes

- Existing completed bookings without reviews should simply become eligible when viewed by the owning client if they have `clientId` and `driverId`.
- Existing driver profiles without aggregate fields should read as:
  - `averageRating = 0`
  - `reviewCount = 0`
  - `ratingTotal = 0`
- If production already has completed trips, consider a one-time backfill to set missing driver profile aggregate fields to zero.
- Do not recalculate all driver averages on every request.
- If aggregate drift is suspected later, add an admin-only maintenance script to rebuild aggregates from `DriverReview`.

## 21. Acceptance Checklist

- `DriverReview` model exists with unique `bookingId`.
- `DriverProfile` stores aggregate rating fields.
- Client review route exists and is protected by auth plus `CLIENT` role.
- Backend derives client and driver ids from trusted state.
- Only completed client-owned bookings can be reviewed.
- Duplicate reviews return `409`.
- Invalid ratings and comments return `400`.
- Ineligible booking lifecycle state returns `422`.
- Driver aggregate rating updates after review creation.
- Current client booking response includes review eligibility/submitted state.
- Client completed booking UI prompts for a review only when eligible.
- Prompt includes accessible 1-5 rating control.
- Prompt includes loading, error, and success states.
- Submitted reviews remove the prompt after query invalidation.
- Driver workspace displays aggregate rating or `No reviews yet`.
- Socket event `driver.reviewed` invalidates relevant frontend queries.
- Backend tests pass.
- Frontend tests pass.
- Frontend lint passes.
- Frontend production build passes.

## 22. Design Pre-Flight Matrix

Before finalizing frontend implementation:

| Requirement | Check |
| --- | --- |
| Rating control dimensions are stable | Five buttons do not resize on hover, loading, or selection |
| Mobile layout is safe | Prompt fits below 375px width without horizontal scroll |
| Accessibility state exists | Rating buttons expose accessible labels and selected state |
| Keyboard operation works | Client can tab, select rating, type comment, submit |
| Error placement is local | Rating/comment errors render near the prompt controls |
| Loading state is clear | Submit button communicates progress and prevents double submit |
| Success state is clear | Submitted rating is visible after mutation succeeds |
| No card nesting | Prompt is one grouped section inside the completed booking surface |
| No blocked trip details | Completed trip summary remains visible |
| Server state ownership is correct | TanStack Query owns review data; Redux is not used for review payloads |

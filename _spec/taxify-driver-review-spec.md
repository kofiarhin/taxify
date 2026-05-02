# Taxify Driver Review Feature Spec

## 1. Product Direction

After a client-led trip is completed, Taxify should ask the client to review the assigned driver.

Client completes trip flow -> Driver confirms payment -> Booking becomes COMPLETED -> Client is prompted to rate driver from 1 to 5 -> Review is saved -> Driver rating aggregates update -> Review prompt no longer appears for that booking

The review feature should help Taxify measure driver performance without blocking trip completion, payment recording, or driver availability.

---

## 2. Current Codebase Status

Already implemented:
- CLIENT role
- Client booking ownership
- Driver assignment and acceptance
- Trip start/end lifecycle
- Client completion confirmation
- Driver payment confirmation
- Booking COMPLETED status
- Client dashboard and current booking views
- Socket updates for booking lifecycle events

Gap:
- No driver review model
- No client post-trip review prompt
- No rating validation
- No aggregate driver rating on driver profile
- No admin visibility into driver feedback
- No protection against duplicate reviews for the same booking

---

## 3. Roles and Permissions

CLIENT:
- Can review a driver only for their own completed booking.
- Can submit exactly one review per booking.
- Can see whether they already reviewed a completed booking.

DRIVER:
- Can see their aggregate rating and review count.
- Should not see private client data beyond what is already exposed in the app.
- Should not be able to create, edit, or delete client reviews.

ADMIN:
- Can view driver review history.
- Can see average rating and total review count per driver.
- Can use review data in operational oversight.

AGENT:
- No review write access.
- Optional read access only if existing operations screens need driver quality context.

---

## 4. Review Timing

The review prompt appears only after all of these are true:
- Booking status is `COMPLETED`.
- Booking has a `clientId`.
- Booking has a `driverId`.
- Client is authenticated as the booking owner.
- No review exists for this booking.

The prompt must not appear:
- During active trips.
- While waiting for driver payment confirmation.
- For cancelled bookings.
- For staff-created bookings without a client owner.
- For bookings already reviewed.

Review submission is not required for completion. A booking remains `COMPLETED` even if the client skips or delays the review.

---

## 5. Rating Rules

Rating scale:
- `1` = Poor
- `2` = Below expectations
- `3` = Acceptable
- `4` = Good
- `5` = Excellent

Validation:
- Rating is required.
- Rating must be an integer between 1 and 5.
- Optional written comment may be supported.
- Comment max length: 500 characters.
- Empty comments should be stored as `null` or omitted consistently.

Duplicate protection:
- One review per booking.
- A unique index must enforce `bookingId`.
- Backend must return a clear conflict response if a review already exists.

---

## 6. Data Model Updates

Add model: `DriverReview`

Fields:
- `bookingId`
  - ObjectId ref `Booking`
  - required
  - unique
  - indexed
- `driverId`
  - ObjectId ref `User`
  - required
  - indexed
- `clientId`
  - ObjectId ref `User`
  - required
  - indexed
- `rating`
  - Number
  - required
  - min `1`
  - max `5`
  - integer only
- `comment`
  - String
  - optional
  - trim
  - max `500`
- `createdAt`
- `updatedAt`

Recommended indexes:
- Unique: `{ bookingId: 1 }`
- Query: `{ driverId: 1, createdAt: -1 }`
- Query: `{ clientId: 1, createdAt: -1 }`

Update `DriverProfile`:
- `averageRating`
  - Number
  - default `0`
- `reviewCount`
  - Number
  - default `0`
- `ratingTotal`
  - Number
  - default `0`

`ratingTotal` allows stable aggregate recalculation without scanning all reviews on every request.

---

## 7. Backend API

### Submit Driver Review

`POST /api/v1/client/bookings/:bookingId/review`

Auth:
- Required
- Role: `CLIENT`

Body:

```json
{
  "rating": 5,
  "comment": "Professional driving and clear communication."
}
```

Success:
- Status `201`
- Creates review
- Updates driver profile rating aggregate
- Emits socket event

Response:

```json
{
  "status": "success",
  "data": {
    "review": {
      "id": "reviewId",
      "bookingId": "bookingId",
      "driverId": "driverId",
      "clientId": "clientId",
      "rating": 5,
      "comment": "Professional driving and clear communication.",
      "createdAt": "2026-05-02T00:00:00.000Z"
    },
    "driverRating": {
      "averageRating": 4.7,
      "reviewCount": 12
    }
  }
}
```

Failure cases:
- `400` invalid rating or comment length
- `401` unauthenticated
- `403` booking does not belong to client
- `404` booking not found
- `409` review already exists
- `422` booking is not completed or has no assigned driver

### Get Current Client Review Eligibility

The existing current-booking endpoint should include review state for completed bookings:

`GET /api/v1/client/bookings/current`

Add response fields where relevant:

```json
{
  "review": {
    "eligible": true,
    "submitted": false,
    "rating": null
  }
}
```

For already reviewed bookings:

```json
{
  "review": {
    "eligible": false,
    "submitted": true,
    "rating": 5
  }
}
```

### Optional Admin Review Listing

`GET /api/v1/admin/drivers/:driverId/reviews`

Auth:
- Required
- Role: `ADMIN`

Supports pagination:
- `page`
- `limit`

---

## 8. Backend Service Rules

Create review inside a transaction when MongoDB transaction support is available:
- Validate booking ownership and status.
- Validate assigned driver.
- Insert `DriverReview`.
- Increment driver profile:
  - `ratingTotal += rating`
  - `reviewCount += 1`
  - `averageRating = ratingTotal / reviewCount`

If transactions are not available in the local test environment:
- Keep the write path idempotent through the unique `bookingId` index.
- Handle duplicate key errors as `409`.
- Keep aggregate update immediately after review creation.

Aggregate rounding:
- Store full precision or one decimal consistently.
- API display can round to one decimal.
- Do not let the frontend calculate canonical averages.

---

## 9. Socket Events

Emit after successful review:

Event:
- `driver.reviewed`

Payload:

```json
{
  "bookingId": "bookingId",
  "driverId": "driverId",
  "clientId": "clientId",
  "rating": 5,
  "averageRating": 4.7,
  "reviewCount": 12
}
```

Consumers:
- Client dashboard should invalidate current booking/review state.
- Driver workspace should refresh aggregate rating.
- Admin driver detail screens should refresh review data if open.

---

## 10. Frontend User Experience

Client dashboard:
- When a booking reaches `COMPLETED` and no review exists, show a review prompt near the completed trip summary.
- Use a focused rating control with five selectable values.
- The selected rating must be obvious through color, label, and accessible state.
- The submit button is disabled until a rating is selected.
- Optional comment field appears below the rating control.
- The client can skip/dismiss the prompt for the current session, but the prompt can return later until submitted.

Client current booking page:
- Show completed trip details.
- Show driver name and vehicle details if available.
- Show review prompt below the completion/payment summary.
- After submission, replace the prompt with a compact confirmation state showing the submitted rating.

Driver workspace:
- Show aggregate rating and review count in the driver profile/status area.
- If there are no reviews, show `No reviews yet` rather than `0.0`.

Admin driver detail/listing:
- Show average rating and review count.
- Optional review history table can include date, booking reference, rating, and comment.

Accessibility:
- Rating buttons must be keyboard accessible.
- Each rating value must have an accessible label such as `Rate driver 5 out of 5`.
- The selected rating must expose `aria-pressed` or equivalent state.
- Error messages must be rendered near the affected input.

Design constraints:
- Keep the prompt compact and operational, not marketing-style.
- Do not block access to booking details behind a modal.
- Use a modal only if the existing app already uses one for post-action prompts.
- Avoid card nesting. The prompt should be a single grouped section within the completed booking surface.
- Use tactile active states and clear disabled/loading states.

---

## 11. Frontend Data Flow

Services:
- Add `client/src/services/driverReviewService.js`
- Use shared API client from `client/src/lib/api.js`

Queries:
- Extend current client booking query to include review state.
- Add driver review/admin review queries only where needed.

Mutations:
- Add `useSubmitDriverReviewMutation`.
- On success, invalidate:
  - client current booking
  - driver workspace/current assignment if rating shown there
  - admin driver detail/list if implemented

State:
- Do not store review server data in Redux.
- Keep transient selected rating/comment state local to the review component.
- Use TanStack Query for server state.

---

## 12. Validation and Error Handling

Backend validation:
- Rating missing: `Rating is required.`
- Rating outside range: `Rating must be between 1 and 5.`
- Non-integer rating: `Rating must be a whole number.`
- Comment too long: `Comment must be 500 characters or fewer.`
- Duplicate review: `This trip has already been reviewed.`
- Ineligible booking: `Only completed trips can be reviewed.`

Frontend handling:
- Inline validation before submit for missing rating and long comment.
- Server errors shown in the prompt area.
- Loading state prevents duplicate submit clicks.
- Successful submission updates UI without requiring a page refresh.

---

## 13. Security and Privacy

Security:
- Backend must derive `clientId` from authenticated user, not request body.
- Backend must derive `driverId` from the booking, not request body.
- Client must not be able to review another client's booking.
- Driver must not be able to review themselves.
- Review creation must not expose `passwordHash` or sensitive user fields.

Privacy:
- Driver-facing review summaries should not expose unnecessary client personal information.
- Admin review views may show operational identifiers already visible elsewhere in admin flows.

---

## 14. Testing Requirements

Backend tests:
- Client can review own completed booking.
- Client cannot review booking before `COMPLETED`.
- Client cannot review another client's booking.
- Client cannot review same booking twice.
- Rating must be between 1 and 5.
- Rating must be an integer.
- Comment length is enforced.
- Review updates driver profile aggregate.
- Existing booking completion tests still pass.

Frontend tests:
- Completed client booking shows review prompt when eligible.
- Prompt does not show before completion.
- Submit disabled until rating is selected.
- Selecting rating updates visible selected state.
- Successful submit shows confirmation state.
- Duplicate or server error displays inline message.

Manual validation:
- Complete a client trip end to end.
- Confirm payment as driver.
- Log in as client.
- Verify review prompt appears.
- Submit rating `5`.
- Confirm prompt is replaced by submitted state.
- Log in as driver.
- Confirm driver rating count and average are updated.

---

## 15. Acceptance Criteria

The feature is complete when:
- A completed client booking can receive exactly one driver review.
- The review rating is validated from 1 to 5.
- Duplicate reviews are blocked by both application logic and database constraint.
- Driver profile aggregate rating updates after review submission.
- Client UI prompts for review only after booking completion.
- Client UI no longer prompts after review submission.
- Driver-facing UI can display aggregate rating and review count.
- Tests cover the success path, authorization rules, validation, duplicate prevention, and aggregate update.

---

## 16. Out of Scope

Not included in this feature:
- Editing reviews after submission
- Deleting reviews
- Driver replies to reviews
- Public driver profile pages
- Multi-category ratings such as safety, cleanliness, and punctuality
- Automatic driver suspension based on low ratings
- Review moderation workflow
- Push notifications or email reminders

These can be added later without changing the core one-review-per-booking model.

---

## 17. Implementation Notes

Recommended implementation order:
1. Add `DriverReview` model and driver aggregate fields.
2. Add backend validator and review controller route.
3. Extend client current booking response with review state.
4. Add backend tests for review eligibility and aggregate updates.
5. Add frontend service, mutation hook, and review prompt component.
6. Add prompt to completed client booking surfaces.
7. Add driver aggregate rating display.
8. Add frontend tests.
9. Run backend tests, frontend tests, lint, and build.

Design pre-flight matrix:
- Rating control has stable dimensions across desktop and mobile.
- Rating values are accessible by keyboard and screen reader.
- Loading, success, empty, and error states are present.
- Prompt does not use nested cards or block trip details.
- Text fits inside controls at mobile widths.
- Frontend server state flows through services and TanStack Query, not Redux.

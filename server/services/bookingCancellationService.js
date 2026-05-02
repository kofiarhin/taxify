const mongoose = require("mongoose");
const AssignmentAttempt = require("../models/AssignmentAttempt");
const Booking = require("../models/Booking");
const {
  ASSIGNMENT_STATUSES,
  BOOKING_STATUSES,
} = require("../constants/statuses");
const { ApiError } = require("../utils/apiError");
const { releaseDriverFromAssignment } = require("./lifecycleService");
const { emitDomainEvent } = require("../socket");

const NON_CANCELLABLE_BOOKING_STATUSES = [
  BOOKING_STATUSES.IN_PROGRESS,
  BOOKING_STATUSES.TRIP_IN_PROGRESS,
  BOOKING_STATUSES.TRIP_ENDED,
  BOOKING_STATUSES.PAYMENT_PENDING,
  BOOKING_STATUSES.AWAITING_CLIENT_CONFIRMATION,
  BOOKING_STATUSES.AWAITING_DRIVER_PAYMENT_CONFIRMATION,
  BOOKING_STATUSES.PAID,
  BOOKING_STATUSES.COMPLETED,
];

const CANCELLABLE_ASSIGNMENT_STATUSES = [
  ASSIGNMENT_STATUSES.PENDING,
  ASSIGNMENT_STATUSES.ACCEPTED,
];

function isObjectIdLike(value) {
  return typeof value === "string" || value?.constructor?.name === "ObjectId";
}

function isTransactionUnsupported(error) {
  const message = error?.message ?? "";
  return (
    message.includes("Transaction numbers are only allowed") ||
    message.includes("replica set member or mongos") ||
    message.includes("This MongoDB deployment does not support retryable writes")
  );
}

async function loadBookingForCancellation(bookingOrId, session = null) {
  const bookingId = isObjectIdLike(bookingOrId) ? bookingOrId : bookingOrId?._id;
  const query = Booking.findById(bookingId);
  if (session) query.session(session);
  return query;
}

async function runCancellationUpdates(bookingOrId, options = {}, session = null) {
  const now = options.now ?? new Date();
  const booking = await loadBookingForCancellation(bookingOrId, session);
  if (!booking) throw new ApiError(404, "Booking not found");

  if (booking.status === BOOKING_STATUSES.CANCELLED) {
    return { booking, attempts: [], events: [] };
  }

  if (NON_CANCELLABLE_BOOKING_STATUSES.includes(booking.status)) {
    throw new ApiError(400, `Cannot cancel a booking with status ${booking.status}`);
  }

  const attemptsQuery = AssignmentAttempt.find({
    bookingId: booking._id,
    status: { $in: CANCELLABLE_ASSIGNMENT_STATUSES },
  }).sort({ createdAt: -1 });
  if (session) attemptsQuery.session(session);
  const attempts = await attemptsQuery;
  const events = [];

  for (const attempt of attempts) {
    attempt.status = ASSIGNMENT_STATUSES.CANCELLED;
    attempt.respondedAt = now;
    attempt.reason = attempt.reason || "Booking cancelled";
    await attempt.save({ session });

    await releaseDriverFromAssignment(attempt.driverId, attempt._id, {
      excludedBookingId: booking._id,
      excludedAssignmentId: attempt._id,
      now,
      session,
    });

    events.push({
      name: "assignment.cancelled",
      payload: {
        bookingId: booking._id.toString(),
        driverId: attempt.driverId.toString(),
        assignmentId: attempt._id.toString(),
      },
    });
  }

  booking.status = BOOKING_STATUSES.CANCELLED;
  booking.cancelledAt = booking.cancelledAt ?? now;
  booking.cancelReason = options.reason || booking.cancelReason || "";
  booking.assignedDriverId = null;
  booking.acceptedAt = null;
  booking.queueEnteredAt = null;
  await booking.save({ session });

  return { booking, attempts, events };
}

async function cancelBookingWithoutTransaction(bookingOrId, options = {}) {
  /*
   * MongoDB transactions require a replica set. Local standalone deployments
   * cannot provide atomic multi-document cancellation, so the fallback keeps
   * every update idempotent and guarded by current status checks.
   */
  return runCancellationUpdates(bookingOrId, options, null);
}

async function cancelBooking(bookingOrId, options = {}) {
  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {
      result = await runCancellationUpdates(bookingOrId, options, session);
    });
  } catch (error) {
    if (!isTransactionUnsupported(error)) {
      throw error;
    }
    result = await cancelBookingWithoutTransaction(bookingOrId, options);
  } finally {
    await session.endSession();
  }

  for (const event of result.events) {
    emitDomainEvent(event.name, event.payload);
  }

  return { booking: result.booking, attempts: result.attempts };
}

module.exports = {
  CANCELLABLE_ASSIGNMENT_STATUSES,
  NON_CANCELLABLE_BOOKING_STATUSES,
  cancelBooking,
  cancelBookingWithoutTransaction,
};

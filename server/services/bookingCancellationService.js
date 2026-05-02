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
  BOOKING_STATUSES.PAYMENT_PENDING,
  BOOKING_STATUSES.PAID,
  BOOKING_STATUSES.COMPLETED,
];

const CANCELLABLE_ASSIGNMENT_STATUSES = [
  ASSIGNMENT_STATUSES.PENDING,
  ASSIGNMENT_STATUSES.ACCEPTED,
];

async function cancelBooking(bookingOrId, options = {}) {
  const booking =
    typeof bookingOrId === "string" || bookingOrId?.constructor?.name === "ObjectId"
      ? await Booking.findById(bookingOrId)
      : bookingOrId;

  if (!booking) throw new ApiError(404, "Booking not found");

  if (
    booking.status !== BOOKING_STATUSES.CANCELLED &&
    NON_CANCELLABLE_BOOKING_STATUSES.includes(booking.status)
  ) {
    throw new ApiError(400, `Cannot cancel a booking with status ${booking.status}`);
  }

  const attempts = await AssignmentAttempt.find({
    bookingId: booking._id,
    status: { $in: CANCELLABLE_ASSIGNMENT_STATUSES },
  }).sort({ createdAt: -1 });

  for (const attempt of attempts) {
    attempt.status = ASSIGNMENT_STATUSES.CANCELLED;
    attempt.respondedAt = options.now ?? new Date();
    attempt.reason = attempt.reason || "Booking cancelled";
    await attempt.save();

    await releaseDriverFromAssignment(attempt.driverId, attempt._id, {
      excludedBookingId: booking._id,
      now: options.now,
    });

    emitDomainEvent("assignment.cancelled", {
      bookingId: booking._id.toString(),
      driverId: attempt.driverId.toString(),
      assignmentId: attempt._id.toString(),
    });
  }

  booking.status = BOOKING_STATUSES.CANCELLED;
  booking.cancelledAt = booking.cancelledAt ?? (options.now ?? new Date());
  booking.cancelReason = options.reason || booking.cancelReason || "";
  booking.assignedDriverId = null;
  booking.acceptedAt = null;
  booking.queueEnteredAt = null;
  await booking.save();

  return { booking, attempts };
}

module.exports = {
  CANCELLABLE_ASSIGNMENT_STATUSES,
  NON_CANCELLABLE_BOOKING_STATUSES,
  cancelBooking,
};

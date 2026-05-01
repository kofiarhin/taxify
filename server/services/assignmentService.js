const Booking = require("../models/Booking");
const DriverProfile = require("../models/DriverProfile");
const AssignmentAttempt = require("../models/AssignmentAttempt");
const {
  BOOKING_STATUSES,
  ASSIGNMENT_STATUSES,
  DRIVER_STATUSES,
  ASSIGNMENT_TIMEOUT_MS,
  ASSIGNMENT_MODES,
} = require("../constants/statuses");
const { ApiError } = require("../utils/apiError");

function generateBookingReference() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `TXF-${date}-${rand}`;
}

async function dispatchBooking(bookingId, mode = ASSIGNMENT_MODES.AUTO) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found");

  if (
    booking.status !== BOOKING_STATUSES.PENDING_ASSIGNMENT &&
    booking.status !== BOOKING_STATUSES.QUEUED
  ) {
    throw new ApiError(400, "Booking is not eligible for dispatch");
  }

  const eligibleDrivers = await DriverProfile.find({
    status: DRIVER_STATUSES.ACTIVE,
    currentAssignmentId: null,
  }).sort({ lastAssignedAt: 1, createdAt: 1 });

  if (eligibleDrivers.length === 0) {
    booking.status = BOOKING_STATUSES.QUEUED;
    if (!booking.queueEnteredAt) booking.queueEnteredAt = new Date();
    await booking.save();
    return { queued: true, booking };
  }

  const driver = eligibleDrivers[0];
  const attemptNumber =
    (await AssignmentAttempt.countDocuments({ bookingId: booking._id })) + 1;

  const attempt = await AssignmentAttempt.create({
    bookingId: booking._id,
    driverId: driver._id,
    attemptNumber,
    status: ASSIGNMENT_STATUSES.PENDING,
    assignedAt: new Date(),
    expiresAt: new Date(Date.now() + ASSIGNMENT_TIMEOUT_MS),
  });

  booking.status = BOOKING_STATUSES.ASSIGNED;
  booking.assignedDriverId = driver._id;
  booking.assignmentMode = mode;
  await booking.save();

  driver.currentAssignmentId = attempt._id;
  await driver.save();

  return { assigned: true, booking, attempt, driver };
}

async function acceptAssignment(attemptId, driverProfileId) {
  const attempt = await AssignmentAttempt.findById(attemptId);
  if (!attempt) throw new ApiError(404, "Assignment not found");
  if (attempt.driverId.toString() !== driverProfileId.toString()) {
    throw new ApiError(403, "Not your assignment");
  }
  if (attempt.status !== ASSIGNMENT_STATUSES.PENDING) {
    throw new ApiError(400, "Assignment is no longer pending");
  }
  if (attempt.expiresAt < new Date()) {
    attempt.status = ASSIGNMENT_STATUSES.TIMEOUT;
    attempt.respondedAt = new Date();
    await attempt.save();
    throw new ApiError(400, "Assignment has expired");
  }

  attempt.status = ASSIGNMENT_STATUSES.ACCEPTED;
  attempt.respondedAt = new Date();
  await attempt.save();

  const booking = await Booking.findById(attempt.bookingId);
  booking.status = BOOKING_STATUSES.ACCEPTED;
  booking.acceptedAt = new Date();
  await booking.save();

  return { attempt, booking };
}

async function rejectAssignment(attemptId, driverProfileId, reason = "") {
  const attempt = await AssignmentAttempt.findById(attemptId);
  if (!attempt) throw new ApiError(404, "Assignment not found");
  if (attempt.driverId.toString() !== driverProfileId.toString()) {
    throw new ApiError(403, "Not your assignment");
  }
  if (attempt.status !== ASSIGNMENT_STATUSES.PENDING) {
    throw new ApiError(400, "Assignment is no longer pending");
  }

  attempt.status = ASSIGNMENT_STATUSES.REJECTED;
  attempt.respondedAt = new Date();
  attempt.reason = reason;
  await attempt.save();

  const { clearDriverAssignment } = require("./driverStatusService");
  await clearDriverAssignment(driverProfileId);

  const booking = await Booking.findById(attempt.bookingId);

  const eligibleDrivers = await DriverProfile.find({
    status: DRIVER_STATUSES.ACTIVE,
    currentAssignmentId: null,
    _id: { $ne: driverProfileId },
  }).sort({ lastAssignedAt: 1, createdAt: 1 });

  if (eligibleDrivers.length === 0) {
    booking.status = BOOKING_STATUSES.QUEUED;
    if (!booking.queueEnteredAt) booking.queueEnteredAt = new Date();
    booking.assignedDriverId = null;
    await booking.save();
    return { queued: true, booking, attempt };
  }

  const nextDriver = eligibleDrivers[0];
  const attemptNumber =
    (await AssignmentAttempt.countDocuments({ bookingId: booking._id })) + 1;

  const nextAttempt = await AssignmentAttempt.create({
    bookingId: booking._id,
    driverId: nextDriver._id,
    attemptNumber,
    status: ASSIGNMENT_STATUSES.PENDING,
    assignedAt: new Date(),
    expiresAt: new Date(Date.now() + ASSIGNMENT_TIMEOUT_MS),
  });

  booking.status = BOOKING_STATUSES.ASSIGNED;
  booking.assignedDriverId = nextDriver._id;
  await booking.save();

  nextDriver.currentAssignmentId = nextAttempt._id;
  await nextDriver.save();

  return { reassigned: true, booking, attempt: nextAttempt };
}

async function getCurrentAssignmentForDriver(driverProfileId) {
  const booking = await Booking.findOne({
    assignedDriverId: driverProfileId,
    status: {
      $in: [
        BOOKING_STATUSES.ASSIGNED,
        BOOKING_STATUSES.ACCEPTED,
        BOOKING_STATUSES.IN_PROGRESS,
        BOOKING_STATUSES.PAYMENT_PENDING,
      ],
    },
  });

  if (!booking) return null;

  const attempt = await AssignmentAttempt.findOne({
    bookingId: booking._id,
    driverId: driverProfileId,
    status: { $in: [ASSIGNMENT_STATUSES.PENDING, ASSIGNMENT_STATUSES.ACCEPTED] },
  }).sort({ createdAt: -1 });

  return { booking, attempt };
}

module.exports = {
  generateBookingReference,
  dispatchBooking,
  acceptAssignment,
  rejectAssignment,
  getCurrentAssignmentForDriver,
};

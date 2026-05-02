const Booking = require("../models/Booking");
const DriverProfile = require("../models/DriverProfile");
const AssignmentAttempt = require("../models/AssignmentAttempt");
const { env } = require("../config/env");
const {
  BOOKING_STATUSES,
  ASSIGNMENT_STATUSES,
  DRIVER_STATUSES,
  ASSIGNMENT_MODES,
} = require("../constants/statuses");
const { ApiError } = require("../utils/apiError");
const { evaluateDriverLifecycle, releaseDriverFromAssignment } = require("./driverStatusService");
const { emitDomainEvent } = require("../socket");

function generateBookingReference() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `TXF-${date}-${rand}`;
}

async function dispatchBooking(bookingId, mode = ASSIGNMENT_MODES.AUTO, options = {}) {
  const excludeDriverIds = (options.excludeDriverIds ?? []).map((value) => value.toString());
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found");

  if (
    booking.status !== BOOKING_STATUSES.PENDING_ASSIGNMENT &&
    booking.status !== BOOKING_STATUSES.QUEUED
  ) {
    throw new ApiError(400, "Booking is not eligible for dispatch");
  }

  const candidateDrivers = await DriverProfile.find({
    status: DRIVER_STATUSES.ACTIVE,
    currentAssignmentId: null,
    ...(excludeDriverIds.length > 0 ? { _id: { $nin: excludeDriverIds } } : {}),
  }).sort({ lastAssignedAt: 1, createdAt: 1 });
  const eligibleDrivers = [];
  for (const candidate of candidateDrivers) {
    const evaluatedDriver = await evaluateDriverLifecycle(candidate._id);
    if (
      evaluatedDriver.status === DRIVER_STATUSES.ACTIVE &&
      !evaluatedDriver.currentAssignmentId
    ) {
      eligibleDrivers.push(evaluatedDriver);
    }
  }

  if (eligibleDrivers.length === 0) {
    booking.status = BOOKING_STATUSES.QUEUED;
    if (!booking.queueEnteredAt) booking.queueEnteredAt = new Date();
    booking.assignedDriverId = null;
    await booking.save();
    emitDomainEvent("booking.queued", { bookingId: booking._id.toString() });
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
    expiresAt: new Date(Date.now() + env.ASSIGNMENT_TIMEOUT_MS),
  });

  booking.status = BOOKING_STATUSES.ASSIGNED;
  booking.assignedDriverId = driver._id;
  booking.assignmentMode = mode;
  booking.queueEnteredAt = null;
  await booking.save();

  driver.currentAssignmentId = attempt._id;
  await driver.save();
  emitDomainEvent("booking.assigned", {
    bookingId: booking._id.toString(),
    driverId: driver._id.toString(),
    assignmentId: attempt._id.toString(),
  });

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
    await expireAssignmentAttempt(attempt, { reassign: true, excludeDriverIds: [driverProfileId] });
    throw new ApiError(400, "Assignment has expired");
  }

  attempt.status = ASSIGNMENT_STATUSES.ACCEPTED;
  attempt.respondedAt = new Date();
  await attempt.save();

  const booking = await Booking.findById(attempt.bookingId);
  booking.status = BOOKING_STATUSES.ACCEPTED;
  booking.acceptedAt = new Date();
  await booking.save();
  emitDomainEvent("driver.accepted", {
    bookingId: booking._id.toString(),
    driverId: driverProfileId.toString(),
    assignmentId: attempt._id.toString(),
  });

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

  const booking = await Booking.findById(attempt.bookingId);
  await releaseDriverFromAssignment(driverProfileId, attempt._id);
  emitDomainEvent("driver.rejected", {
    bookingId: booking._id.toString(),
    driverId: driverProfileId.toString(),
    assignmentId: attempt._id.toString(),
  });

  const dispatchResult = await requeueOrRedispatchBooking(booking, {
    excludeDriverIds: [driverProfileId],
    mode: ASSIGNMENT_MODES.QUEUE_RETRY,
  });

  return { ...dispatchResult, attempt };
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

async function requeueOrRedispatchBooking(booking, options = {}) {
  booking.status = BOOKING_STATUSES.PENDING_ASSIGNMENT;
  booking.assignedDriverId = null;
  booking.acceptedAt = null;
  await booking.save();
  return dispatchBooking(booking._id, options.mode ?? ASSIGNMENT_MODES.QUEUE_RETRY, {
    excludeDriverIds: options.excludeDriverIds ?? [],
  });
}

async function expireAssignmentAttempt(attemptOrId, options = {}) {
  const attempt =
    typeof attemptOrId === "string" || attemptOrId?.constructor?.name === "ObjectId"
      ? await AssignmentAttempt.findById(attemptOrId)
      : attemptOrId;

  if (!attempt) {
    return null;
  }

  if (attempt.status !== ASSIGNMENT_STATUSES.PENDING) {
    return { attempt };
  }

  attempt.status = ASSIGNMENT_STATUSES.TIMEOUT;
  attempt.respondedAt = options.now ?? new Date();
  attempt.reason = attempt.reason || "Assignment expired";
  await attempt.save();

  await releaseDriverFromAssignment(attempt.driverId, attempt._id);

  const booking = await Booking.findById(attempt.bookingId);
  if (!booking) {
    return { attempt, booking: null };
  }

  emitDomainEvent("booking.queued", {
    bookingId: booking._id.toString(),
    assignmentId: attempt._id.toString(),
    expired: true,
  });

  if (
    options.reassign !== false &&
    booking.status === BOOKING_STATUSES.ASSIGNED &&
    booking.assignedDriverId?.toString() === attempt.driverId.toString()
  ) {
    const result = await requeueOrRedispatchBooking(booking, {
      excludeDriverIds: options.excludeDriverIds ?? [attempt.driverId],
      mode: ASSIGNMENT_MODES.QUEUE_RETRY,
    });
    return { attempt, booking: result.booking, dispatchResult: result };
  }

  return { attempt, booking };
}

async function cancelActiveAssignmentForBooking(booking) {
  const attempt = await AssignmentAttempt.findOne({
    bookingId: booking._id,
    status: { $in: [ASSIGNMENT_STATUSES.PENDING, ASSIGNMENT_STATUSES.ACCEPTED] },
  }).sort({ createdAt: -1 });

  if (!attempt) {
    booking.assignedDriverId = null;
    booking.acceptedAt = null;
    await booking.save();
    return { booking, attempt: null };
  }

  attempt.status = ASSIGNMENT_STATUSES.CANCELLED;
  attempt.respondedAt = new Date();
  attempt.reason = attempt.reason || "Booking cancelled";
  await attempt.save();

  const activeBookingCount = await Booking.countDocuments({
    _id: { $ne: booking._id },
    assignedDriverId: attempt.driverId,
    status: {
      $in: [
        BOOKING_STATUSES.ASSIGNED,
        BOOKING_STATUSES.ACCEPTED,
        BOOKING_STATUSES.IN_PROGRESS,
        BOOKING_STATUSES.PAYMENT_PENDING,
      ],
    },
  });

  if (activeBookingCount === 0) {
    await releaseDriverFromAssignment(attempt.driverId, attempt._id);
  }

  booking.assignedDriverId = null;
  booking.acceptedAt = null;
  await booking.save();

  emitDomainEvent("assignment.cancelled", {
    bookingId: booking._id.toString(),
    driverId: attempt.driverId.toString(),
    assignmentId: attempt._id.toString(),
  });

  return { booking, attempt };
}

async function expirePendingAssignments(now = new Date()) {
  const expiredAttempts = await AssignmentAttempt.find({
    status: ASSIGNMENT_STATUSES.PENDING,
    expiresAt: { $lte: now },
  });

  const results = [];
  for (const attempt of expiredAttempts) {
    results.push(
      await expireAssignmentAttempt(attempt, {
        now,
        reassign: true,
        excludeDriverIds: [attempt.driverId],
      })
    );
  }
  return results;
}

module.exports = {
  generateBookingReference,
  dispatchBooking,
  acceptAssignment,
  rejectAssignment,
  getCurrentAssignmentForDriver,
  cancelActiveAssignmentForBooking,
  expireAssignmentAttempt,
  expirePendingAssignments,
};

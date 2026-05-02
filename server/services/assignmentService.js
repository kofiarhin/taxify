const Booking = require("../models/Booking");
const DriverProfile = require("../models/DriverProfile");
const AssignmentAttempt = require("../models/AssignmentAttempt");
const mongoose = require("mongoose");
const { env } = require("../config/env");
const {
  BOOKING_STATUSES,
  ASSIGNMENT_STATUSES,
  DRIVER_STATUSES,
  ASSIGNMENT_MODES,
  LIFECYCLE_REASONS,
} = require("../constants/statuses");
const { ApiError } = require("../utils/apiError");
const {
  evaluateDriverLifecycle,
  getEligibleDriverQuery,
  isDriverEligibleForDispatch,
  releaseDriverFromAssignment,
} = require("./lifecycleService");
const { cancelBooking } = require("./bookingCancellationService");
const { emitDomainEvent } = require("../socket");

function warnAssignment(message, metadata = {}) {
  console.warn(`[assignment] ${message}`, metadata);
}

function isTransactionUnsupported(error) {
  const message = error?.message ?? "";
  return (
    message.includes("Transaction numbers are only allowed") ||
    message.includes("replica set member or mongos") ||
    message.includes("This MongoDB deployment does not support retryable writes")
  );
}

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

  const candidateDrivers = await DriverProfile.find(
    getEligibleDriverQuery(excludeDriverIds)
  ).sort({ lastAssignedAt: 1, createdAt: 1 });
  const eligibleDrivers = [];
  for (const candidate of candidateDrivers) {
    if (await isDriverEligibleForDispatch(candidate)) {
      eligibleDrivers.push(candidate);
    }
  }

  if (eligibleDrivers.length === 0) {
    booking.status = BOOKING_STATUSES.QUEUED;
    if (!booking.queueEnteredAt) booking.queueEnteredAt = new Date();
    booking.assignedDriverId = null;
    await booking.save();
    warnAssignment("No eligible driver found; booking queued", {
      bookingId: booking._id.toString(),
      candidateDriverCount: candidateDrivers.length,
      eligibleDriverCount: 0,
      excludedDriverCount: excludeDriverIds.length,
    });
    emitDomainEvent("booking.queued", { bookingId: booking._id.toString() });
    return { queued: true, booking };
  }

  const driver = await evaluateDriverLifecycle(eligibleDrivers[0]._id, {
    now: options.now ?? new Date(),
  });
  if (!(await isDriverEligibleForDispatch(driver, { now: options.now ?? new Date() }))) {
    return dispatchBooking(booking._id, mode, {
      ...options,
      excludeDriverIds: [...excludeDriverIds, driver._id],
    });
  }
  const attemptNumber =
    (await AssignmentAttempt.countDocuments({ bookingId: booking._id })) + 1;

  const assignedAt = new Date();
  const expiresAt = new Date(Date.now() + env.ASSIGNMENT_TIMEOUT_MS);
  let attempt;
  let assignmentBooking;
  let assignmentDriver;

  async function persistAssignment(session = null) {
    const createPayload = {
      bookingId: booking._id,
      driverId: driver._id,
      attemptNumber,
      status: ASSIGNMENT_STATUSES.PENDING,
      assignedAt,
      expiresAt,
    };
    [attempt] = await AssignmentAttempt.create([createPayload], { session });

    const driverQuery = DriverProfile.findOne({
      _id: driver._id,
      status: DRIVER_STATUSES.ACTIVE,
      lifecycleReason: { $in: [null, LIFECYCLE_REASONS.NONE] },
      currentAssignmentId: null,
    });
    if (session) driverQuery.session(session);
    assignmentDriver = await driverQuery;

    if (!assignmentDriver) {
      throw new ApiError(409, "Selected driver is no longer available");
    }

    assignmentDriver.currentAssignmentId = attempt._id;
    assignmentDriver.status = DRIVER_STATUSES.BUSY;
    assignmentDriver.lastAssignedAt = assignedAt;
    await assignmentDriver.save({ session });

    const bookingQuery = Booking.findById(booking._id);
    if (session) bookingQuery.session(session);
    assignmentBooking = await bookingQuery;
    if (!assignmentBooking) throw new ApiError(404, "Booking not found");

    assignmentBooking.status = BOOKING_STATUSES.ASSIGNED;
    assignmentBooking.assignedDriverId = assignmentDriver._id;
    assignmentBooking.assignmentMode = mode;
    assignmentBooking.queueEnteredAt = null;
    await assignmentBooking.save({ session });
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await persistAssignment(session);
    });
  } catch (error) {
    if (!isTransactionUnsupported(error)) {
      warnAssignment("Assignment persistence failed", {
        bookingId: booking._id.toString(),
        driverId: driver._id.toString(),
        error: error.message,
      });
      throw error;
    }

    await persistAssignment();
  } finally {
    await session.endSession();
  }

  emitDomainEvent("booking.assigned", {
    bookingId: assignmentBooking._id.toString(),
    driverId: assignmentDriver._id.toString(),
    assignmentId: attempt._id.toString(),
  });

  return { assigned: true, booking: assignmentBooking, attempt, driver: assignmentDriver };
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
  const driver = await evaluateDriverLifecycle(driverProfileId);
  if (
    driver.status !== DRIVER_STATUSES.ACTIVE &&
    driver.status !== DRIVER_STATUSES.BUSY
  ) {
    throw new ApiError(403, "Driver is not eligible to accept assignments");
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

  const booking = await Booking.findById(attempt.bookingId);
  if (!booking) {
    await releaseDriverFromAssignment(attempt.driverId, attempt._id);
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
    await releaseDriverFromAssignment(attempt.driverId, attempt._id, {
      excludedBookingId: booking._id,
      excludedAssignmentId: attempt._id,
      now: options.now,
    });
    const result = await requeueOrRedispatchBooking(booking, {
      excludeDriverIds: options.excludeDriverIds ?? [attempt.driverId],
      mode: ASSIGNMENT_MODES.QUEUE_RETRY,
    });
    return { attempt, booking: result.booking, dispatchResult: result };
  }

  await releaseDriverFromAssignment(attempt.driverId, attempt._id);
  return { attempt, booking };
}

async function cancelActiveAssignmentForBooking(booking) {
  const { booking: cancelledBooking, attempts } = await cancelBooking(booking);
  return { booking: cancelledBooking, attempt: attempts[0] ?? null };
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

const Booking = require("../models/Booking");
const Trip = require("../models/Trip");
const AuditLog = require("../models/AuditLog");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");
const {
  dispatchBooking,
  generateBookingReference,
} = require("../services/assignmentService");
const { BOOKING_STATUSES, ASSIGNMENT_MODES } = require("../constants/statuses");
const { emitDomainEvent } = require("../socket");
const {
  getReviewStateForBooking,
  submitDriverReview: submitDriverReviewService,
} = require("../services/driverReviewService");

const CLIENT_ACTIVE_STATUSES = [
  BOOKING_STATUSES.PENDING_ASSIGNMENT,
  BOOKING_STATUSES.QUEUED,
  BOOKING_STATUSES.DRIVER_ASSIGNED,
  BOOKING_STATUSES.DRIVER_ACCEPTED,
  BOOKING_STATUSES.TRIP_IN_PROGRESS,
  BOOKING_STATUSES.TRIP_ENDED,
  BOOKING_STATUSES.AWAITING_CLIENT_CONFIRMATION,
  BOOKING_STATUSES.AWAITING_DRIVER_PAYMENT_CONFIRMATION,
  BOOKING_STATUSES.ASSIGNED,
  BOOKING_STATUSES.ACCEPTED,
  BOOKING_STATUSES.IN_PROGRESS,
  BOOKING_STATUSES.PAYMENT_PENDING,
  BOOKING_STATUSES.PAID,
  BOOKING_STATUSES.COMPLETED,
];

async function getClientBookingOrThrow(bookingId, userId) {
  const booking = await Booking.findOne({ _id: bookingId, clientId: userId });
  if (!booking) throw new ApiError(404, "Booking not found");
  return booking;
}

async function hydrateClientBooking(booking) {
  if (!booking) return null;

  const [populatedBooking, trip] = await Promise.all([
    Booking.findById(booking._id)
      .populate({
        path: "assignedDriverId",
        select: "vehicleMake vehicleModel vehiclePlate userId averageRating reviewCount",
        populate: { path: "userId", select: "fullName phone" },
      })
      .populate("clientId", "fullName email phone"),
    Trip.findOne({ bookingId: booking._id }).select(
      "startedAt endedAt durationMinutes distanceKm fare fareBreakdown commissionAmount paymentStatus clientConfirmedCompleteAt driverConfirmedPaymentAt"
    ),
  ]);

  const review = await getReviewStateForBooking(populatedBooking);

  return { booking: populatedBooking, trip, review };
}

const createClientBooking = asyncHandler(async (req, res) => {
  const body = req.validated.body;
  const booking = await Booking.create({
    ...body,
    bookingReference: generateBookingReference(),
    createdBy: req.user._id,
    clientId: req.user._id,
    customerName: req.user.fullName,
    customerPhone: req.user.phone,
    status: BOOKING_STATUSES.PENDING_ASSIGNMENT,
  });

  emitDomainEvent("client.booking.created", {
    bookingId: booking._id.toString(),
    clientId: req.user._id.toString(),
    status: booking.status,
    occurredAt: new Date().toISOString(),
  });
  emitDomainEvent("booking.created", { bookingId: booking._id.toString() });

  try {
    await dispatchBooking(booking._id, ASSIGNMENT_MODES.AUTO);
  } catch (error) {
    console.warn("[client-booking] Auto-dispatch failed after booking creation", {
      bookingId: booking._id.toString(),
      error: error.message,
    });
    booking.status = BOOKING_STATUSES.QUEUED;
    booking.assignedDriverId = null;
    booking.queueEnteredAt = booking.queueEnteredAt ?? new Date();
    await booking.save();
    emitDomainEvent("booking.queued", { bookingId: booking._id.toString(), dispatchError: true });
  }

  const hydrated = await hydrateClientBooking(await Booking.findById(booking._id));

  await AuditLog.create({
    actorUserId: req.user._id,
    action: "CLIENT_BOOKING_CREATED",
    entityType: "Booking",
    entityId: booking._id,
    metadata: { reference: booking.bookingReference, status: hydrated.booking.status },
  });

  res.status(201).json({ success: true, data: hydrated });
});

const getCurrentClientBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({
    clientId: req.user._id,
    status: { $in: CLIENT_ACTIVE_STATUSES },
  }).sort({ createdAt: -1 });

  const hydrated = await hydrateClientBooking(booking);
  res.json({ success: true, data: hydrated ?? { booking: null, trip: null } });
});

const confirmClientComplete = asyncHandler(async (req, res) => {
  const booking = await getClientBookingOrThrow(req.params.id, req.user._id);
  const allowedStatuses = [
    BOOKING_STATUSES.TRIP_ENDED,
    BOOKING_STATUSES.AWAITING_CLIENT_CONFIRMATION,
    BOOKING_STATUSES.PAYMENT_PENDING,
  ];

  if (booking.clientConfirmedAt) {
    const hydrated = await hydrateClientBooking(booking);
    return res.json({ success: true, data: hydrated });
  }

  if (!allowedStatuses.includes(booking.status)) {
    throw new ApiError(400, "Booking is not awaiting client confirmation");
  }

  const trip = await Trip.findOne({ bookingId: booking._id });
  if (!trip || !trip.endedAt) {
    throw new ApiError(400, "Trip must be ended before completion can be confirmed");
  }

  const now = new Date();
  booking.status = BOOKING_STATUSES.AWAITING_DRIVER_PAYMENT_CONFIRMATION;
  booking.clientConfirmedAt = now;
  await booking.save();

  trip.clientConfirmedCompleteAt = now;
  trip.paymentStatus = "AWAITING_DRIVER_CONFIRMATION";
  await trip.save();

  emitDomainEvent("client.confirmed_complete", {
    bookingId: booking._id.toString(),
    clientId: req.user._id.toString(),
    driverId: booking.assignedDriverId?.toString(),
    tripId: trip._id.toString(),
    status: booking.status,
    occurredAt: now.toISOString(),
  });

  await AuditLog.create({
    actorUserId: req.user._id,
    action: "CLIENT_CONFIRMED_COMPLETE",
    entityType: "Booking",
    entityId: booking._id,
    metadata: { tripId: trip._id },
  });

  const hydrated = await hydrateClientBooking(booking);
  res.json({ success: true, data: hydrated });
});

const submitDriverReview = asyncHandler(async (req, res) => {
  const result = await submitDriverReviewService({
    bookingId: req.validated.params.id,
    clientId: req.user._id,
    rating: req.validated.body.rating,
    comment: req.validated.body.comment,
  });

  emitDomainEvent("driver.reviewed", {
    bookingId: result.review.bookingId.toString(),
    driverId: result.review.driverId.toString(),
    clientId: result.review.clientId.toString(),
    rating: result.review.rating,
    averageRating: result.driverRating.averageRating,
    reviewCount: result.driverRating.reviewCount,
    occurredAt: new Date().toISOString(),
  });

  await AuditLog.create({
    actorUserId: req.user._id,
    action: "DRIVER_REVIEW_CREATED",
    entityType: "DriverReview",
    entityId: result.review.id,
    metadata: {
      bookingId: result.review.bookingId,
      driverId: result.review.driverId,
      rating: result.review.rating,
    },
  });

  res.status(201).json({ success: true, data: result });
});

module.exports = {
  createClientBooking,
  getCurrentClientBooking,
  confirmClientComplete,
  submitDriverReview,
};

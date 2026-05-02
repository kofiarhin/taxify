const Booking = require("../models/Booking");
const Trip = require("../models/Trip");
const DriverProfile = require("../models/DriverProfile");
const AuditLog = require("../models/AuditLog");
const { env } = require("../config/env");
const { asyncHandler } = require("../utils/asyncHandler");
const { getPagination } = require("../utils/pagination");
const { ApiError } = require("../utils/apiError");
const { setDriverOnTrip, returnDriverToAvailable } = require("../services/driverStatusService");
const { recordTripCommission } = require("../services/commissionService");
const { calculateFare } = require("../services/fareService");
const { BOOKING_STATUSES } = require("../constants/statuses");
const { emitDomainEvent } = require("../socket");

async function getDriverProfileForUser(userId) {
  const driver = await DriverProfile.findOne({ userId });
  if (!driver) throw new ApiError(404, "Driver profile not found");
  return driver;
}

const startTrip = asyncHandler(async (req, res) => {
  const driverProfile = await getDriverProfileForUser(req.user._id);
  const booking = await Booking.findById(req.params.bookingId);

  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.assignedDriverId?.toString() !== driverProfile._id.toString()) {
    throw new ApiError(403, "This booking is not assigned to you");
  }
  if (![BOOKING_STATUSES.ACCEPTED, BOOKING_STATUSES.DRIVER_ACCEPTED].includes(booking.status)) {
    throw new ApiError(400, "Booking must be accepted before starting the trip");
  }

  const trip = await Trip.create({
    bookingId: booking._id,
    driverId: driverProfile._id,
    startedAt: new Date(),
  });

  booking.status = BOOKING_STATUSES.TRIP_IN_PROGRESS;
  await booking.save();

  await setDriverOnTrip(driverProfile._id);
  emitDomainEvent("trip.started", {
    bookingId: booking._id.toString(),
    tripId: trip._id.toString(),
    driverId: driverProfile._id.toString(),
    status: booking.status,
    occurredAt: new Date().toISOString(),
  });

  await AuditLog.create({
    actorUserId: req.user._id,
    action: "TRIP_STARTED",
    entityType: "Trip",
    entityId: trip._id,
    metadata: { bookingId: booking._id },
  });

  res.status(201).json({ success: true, data: { trip, booking } });
});

const endTrip = asyncHandler(async (req, res) => {
  const driverProfile = await getDriverProfileForUser(req.user._id);
  const booking = await Booking.findById(req.params.bookingId);

  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.assignedDriverId?.toString() !== driverProfile._id.toString()) {
    throw new ApiError(403, "This booking is not assigned to you");
  }
  if (![BOOKING_STATUSES.IN_PROGRESS, BOOKING_STATUSES.TRIP_IN_PROGRESS].includes(booking.status)) {
    throw new ApiError(400, "Trip is not in progress");
  }

  const trip = await Trip.findOne({ bookingId: booking._id });
  if (!trip) throw new ApiError(404, "Trip record not found");

  const now = new Date();
  const { distanceKm = null, manualFare = null, fareNotes = "" } = req.validated.body;
  const fareResult = calculateFare({
    durationMinutes: Math.max(1, Math.ceil((now - trip.startedAt) / 60000)),
    distanceKm,
    manualFare,
    fareNotes,
  });

  trip.endedAt = now;
  trip.durationMinutes = Math.max(1, Math.ceil((now - trip.startedAt) / 60000));
  trip.distanceKm = distanceKm;
  trip.fare = fareResult.fare;
  trip.fareBreakdown = fareResult.breakdown;
  trip.isManualFareOverride = fareResult.isManualOverride;
  trip.fareNotes = fareResult.fareNotes;
  trip.commissionAmount = parseFloat((trip.fare * env.COMMISSION_RATE).toFixed(2));
  await trip.save();

  trip.paymentStatus = booking.clientId
    ? "PENDING_CLIENT_CONFIRMATION"
    : "AWAITING_DRIVER_CONFIRMATION";
  await trip.save();

  booking.status = booking.clientId
    ? BOOKING_STATUSES.AWAITING_CLIENT_CONFIRMATION
    : BOOKING_STATUSES.AWAITING_DRIVER_PAYMENT_CONFIRMATION;
  booking.finalFare = trip.fare;
  booking.completedAt = now;
  await booking.save();

  await AuditLog.create({
    actorUserId: req.user._id,
    action: "TRIP_ENDED",
    entityType: "Trip",
    entityId: trip._id,
    metadata: { fare: trip.fare, durationMinutes: trip.durationMinutes },
  });

  emitDomainEvent("trip.ended", {
    bookingId: booking._id.toString(),
    tripId: trip._id.toString(),
    driverId: driverProfile._id.toString(),
    clientId: booking.clientId?.toString(),
    status: booking.status,
    occurredAt: now.toISOString(),
  });
  res.json({ success: true, data: { trip, booking } });
});

const confirmPayment = asyncHandler(async (req, res) => {
  const driverProfile = await getDriverProfileForUser(req.user._id);
  const booking = await Booking.findById(req.params.bookingId);

  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.assignedDriverId?.toString() !== driverProfile._id.toString()) {
    throw new ApiError(403, "This booking is not assigned to you");
  }
  if (
    ![
      BOOKING_STATUSES.AWAITING_DRIVER_PAYMENT_CONFIRMATION,
      BOOKING_STATUSES.PAYMENT_PENDING,
    ].includes(booking.status)
  ) {
    throw new ApiError(400, "Booking is not awaiting driver payment confirmation");
  }

  if (!booking.clientConfirmedAt && booking.clientId) {
    throw new ApiError(400, "Client must confirm completion before payment can be recorded");
  }

  const trip = await Trip.findOne({ bookingId: booking._id });
  if (!trip) throw new ApiError(404, "Trip record not found");

  trip.paymentStatus = "PAID";
  trip.driverConfirmedPaymentAt = new Date();
  trip.paymentConfirmedAt = trip.driverConfirmedPaymentAt;
  await trip.save();

  booking.status = BOOKING_STATUSES.COMPLETED;
  booking.driverPaymentConfirmedAt = trip.driverConfirmedPaymentAt;
  booking.paymentRecordedAt = trip.driverConfirmedPaymentAt;
  booking.paidAt = trip.driverConfirmedPaymentAt;
  booking.completedAt = booking.completedAt ?? trip.driverConfirmedPaymentAt;
  await booking.save();

  await recordTripCommission(trip);
  await returnDriverToAvailable(driverProfile._id);
  emitDomainEvent("driver.confirmed_payment", {
    bookingId: booking._id.toString(),
    tripId: trip._id.toString(),
    driverId: driverProfile._id.toString(),
    clientId: booking.clientId?.toString(),
    status: booking.status,
    occurredAt: trip.driverConfirmedPaymentAt.toISOString(),
  });
  emitDomainEvent("booking.completed", {
    bookingId: booking._id.toString(),
    tripId: trip._id.toString(),
    driverId: driverProfile._id.toString(),
    clientId: booking.clientId?.toString(),
    status: booking.status,
    occurredAt: trip.driverConfirmedPaymentAt.toISOString(),
  });
  emitDomainEvent("payment.confirmed", {
    bookingId: booking._id.toString(),
    tripId: trip._id.toString(),
    driverId: driverProfile._id.toString(),
  });

  await AuditLog.create({
    actorUserId: req.user._id,
    action: "PAYMENT_CONFIRMED",
    entityType: "Trip",
    entityId: trip._id,
    metadata: { fare: trip.fare, commission: trip.commissionAmount },
  });

  res.json({ success: true, data: { trip, booking } });
});

const listTrips = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const [trips, total] = await Promise.all([
    Trip.find()
      .populate({ path: "bookingId", select: "bookingReference customerName pickupAddress dropoffAddress" })
      .populate({ path: "driverId", select: "vehicleMake vehicleModel vehiclePlate userId" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Trip.countDocuments(),
  ]);

  res.json({ success: true, data: { trips, pagination: { page, limit, total } } });
});

const getDriverTrips = asyncHandler(async (req, res) => {
  const driverProfile = await getDriverProfileForUser(req.user._id);
  const { page, limit, skip } = getPagination(req.query);

  const [trips, total] = await Promise.all([
    Trip.find({ driverId: driverProfile._id })
      .populate({ path: "bookingId", select: "bookingReference customerName pickupAddress dropoffAddress" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Trip.countDocuments({ driverId: driverProfile._id }),
  ]);

  res.json({ success: true, data: { trips, pagination: { page, limit, total } } });
});

module.exports = { startTrip, endTrip, confirmPayment, listTrips, getDriverTrips };

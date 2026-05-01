const Booking = require("../models/Booking");
const Trip = require("../models/Trip");
const DriverProfile = require("../models/DriverProfile");
const AuditLog = require("../models/AuditLog");
const { asyncHandler } = require("../utils/asyncHandler");
const { getPagination } = require("../utils/pagination");
const { ApiError } = require("../utils/apiError");
const { setDriverBusy, returnDriverToAvailable } = require("../services/driverStatusService");
const { recordTripCommission } = require("../services/commissionService");
const { BOOKING_STATUSES, DRIVER_STATUSES } = require("../constants/statuses");

const FARE_PER_MINUTE_GHS = 1;

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
  if (booking.status !== BOOKING_STATUSES.ACCEPTED) {
    throw new ApiError(400, "Booking must be accepted before starting the trip");
  }

  const trip = await Trip.create({
    bookingId: booking._id,
    driverId: driverProfile._id,
    startedAt: new Date(),
  });

  booking.status = BOOKING_STATUSES.IN_PROGRESS;
  await booking.save();

  await setDriverBusy(driverProfile._id);

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
  if (booking.status !== BOOKING_STATUSES.IN_PROGRESS) {
    throw new ApiError(400, "Trip is not in progress");
  }

  const trip = await Trip.findOne({ bookingId: booking._id });
  if (!trip) throw new ApiError(404, "Trip record not found");

  const now = new Date();
  trip.endedAt = now;
  trip.durationMinutes = Math.max(1, Math.ceil((now - trip.startedAt) / 60000));
  trip.fare = parseFloat((trip.durationMinutes * FARE_PER_MINUTE_GHS).toFixed(2));
  trip.commissionAmount = parseFloat((trip.fare * 0.1).toFixed(2));
  await trip.save();

  booking.status = BOOKING_STATUSES.PAYMENT_PENDING;
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

  res.json({ success: true, data: { trip, booking } });
});

const confirmPayment = asyncHandler(async (req, res) => {
  const driverProfile = await getDriverProfileForUser(req.user._id);
  const booking = await Booking.findById(req.params.bookingId);

  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.assignedDriverId?.toString() !== driverProfile._id.toString()) {
    throw new ApiError(403, "This booking is not assigned to you");
  }
  if (booking.status !== BOOKING_STATUSES.PAYMENT_PENDING) {
    throw new ApiError(400, "Booking is not awaiting payment confirmation");
  }

  const trip = await Trip.findOne({ bookingId: booking._id });
  if (!trip) throw new ApiError(404, "Trip record not found");

  trip.paymentStatus = "PAID";
  trip.paymentConfirmedAt = new Date();
  await trip.save();

  booking.status = BOOKING_STATUSES.PAID;
  booking.paidAt = new Date();
  await booking.save();

  await recordTripCommission(trip);
  await returnDriverToAvailable(driverProfile._id);

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

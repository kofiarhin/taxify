const DriverProfile = require("../models/DriverProfile");
const Booking = require("../models/Booking");
const { DRIVER_STATUSES, LIFECYCLE_REASONS, BOOKING_STATUSES } = require("../constants/statuses");
const { ApiError } = require("../utils/apiError");
const { asyncHandler } = require("../utils/asyncHandler");
const { registerDriver, getPendingDrivers, updateDriverStatus } = require("../services/userService");

const register = asyncHandler(async (req, res) => {
  const result = await registerDriver(req.validated.body);

  res.status(201).json({
    success: true,
    data: {
      userId: result.user._id,
      driverProfileId: result.driverProfile._id,
      status: result.driverProfile.status,
    },
  });
});

const getPending = asyncHandler(async (_req, res) => {
  const drivers = await getPendingDrivers();

  res.json({
    success: true,
    data: { drivers },
  });
});

const list = asyncHandler(async (_req, res) => {
  const drivers = await DriverProfile.find()
    .populate("userId", "fullName email phone role isActive")
    .populate("currentAssignmentId")
    .sort({ createdAt: -1 });

  const activeBookings = await Booking.find({
    assignedDriverId: { $in: drivers.map((driver) => driver._id) },
    status: {
      $in: [
        BOOKING_STATUSES.ASSIGNED,
        BOOKING_STATUSES.DRIVER_ASSIGNED,
        BOOKING_STATUSES.ACCEPTED,
        BOOKING_STATUSES.DRIVER_ACCEPTED,
        BOOKING_STATUSES.IN_PROGRESS,
        BOOKING_STATUSES.TRIP_IN_PROGRESS,
        BOOKING_STATUSES.TRIP_ENDED,
        BOOKING_STATUSES.PAYMENT_PENDING,
        BOOKING_STATUSES.AWAITING_CLIENT_CONFIRMATION,
        BOOKING_STATUSES.AWAITING_DRIVER_PAYMENT_CONFIRMATION,
      ],
    },
  }).select("bookingReference customerName pickupAddress dropoffAddress status assignedDriverId");

  const bookingByDriverId = new Map(
    activeBookings.map((booking) => [booking.assignedDriverId.toString(), booking])
  );

  res.json({
    success: true,
    data: {
      drivers: drivers.map((driver) => ({
        ...driver.toObject(),
        assignedBooking: bookingByDriverId.get(driver._id.toString()) ?? null,
      })),
    },
  });
});

const approve = asyncHandler(async (req, res) => {
  const driver = await updateDriverStatus(req.params.id, {
    status: DRIVER_STATUSES.ACTIVE,
    approvedBy: req.user._id,
    approvedAt: new Date(),
    lifecycleReason: LIFECYCLE_REASONS.NONE,
  });

  res.json({
    success: true,
    data: { driver },
  });
});

const suspend = asyncHandler(async (req, res) => {
  const driver = await updateDriverStatus(req.params.id, {
    status: DRIVER_STATUSES.SUSPENDED,
    suspendedAt: new Date(),
    suspensionReason: req.validated.body.reason || "",
    lifecycleReason: LIFECYCLE_REASONS.MANUAL,
  });

  res.json({
    success: true,
    data: { driver },
  });
});

const reactivate = asyncHandler(async (req, res) => {
  const driver = await updateDriverStatus(req.params.id, {
    status: DRIVER_STATUSES.ACTIVE,
    suspendedAt: null,
    suspensionReason: "",
    lifecycleReason: LIFECYCLE_REASONS.NONE,
  });

  res.json({
    success: true,
    data: { driver },
  });
});

const me = asyncHandler(async (req, res) => {
  const driver = await DriverProfile.findOne({ userId: req.user._id }).populate(
    "userId",
    "-passwordHash"
  );

  if (!driver) {
    throw new ApiError(404, "Driver profile not found");
  }

  res.json({
    success: true,
    data: { driver },
  });
});

const deactivate = asyncHandler(async (req, res) => {
  const driver = await updateDriverStatus(req.params.id, {
    status: DRIVER_STATUSES.DEACTIVATED,
    deactivatedAt: new Date(),
    deactivationReason: req.validated.body.reason || "",
    lifecycleReason: LIFECYCLE_REASONS.MANUAL,
  });

  res.json({
    success: true,
    data: { driver },
  });
});

module.exports = { register, list, getPending, approve, suspend, reactivate, deactivate, me };

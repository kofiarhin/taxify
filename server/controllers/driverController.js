const DriverProfile = require("../models/DriverProfile");
const { DRIVER_STATUSES } = require("../constants/statuses");
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

const approve = asyncHandler(async (req, res) => {
  const driver = await updateDriverStatus(req.params.id, {
    status: DRIVER_STATUSES.ACTIVE,
    approvedBy: req.user._id,
    approvedAt: new Date(),
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

module.exports = { register, getPending, approve, suspend, reactivate, me };

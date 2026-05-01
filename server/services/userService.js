const User = require("../models/User");
const DriverProfile = require("../models/DriverProfile");
const { ROLES } = require("../constants/roles");
const { DRIVER_STATUSES } = require("../constants/statuses");
const { ApiError } = require("../utils/apiError");
const { hashPassword } = require("./authService");

async function createStaffUser(payload) {
  const existingUser = await User.findOne({ email: payload.email.toLowerCase().trim() });

  if (existingUser) {
    throw new ApiError(409, "A user with this email already exists");
  }

  const passwordHash = await hashPassword(payload.password);

  return User.create({
    role: payload.role,
    fullName: payload.fullName,
    email: payload.email.toLowerCase().trim(),
    phone: payload.phone,
    passwordHash,
  });
}

async function registerDriver(payload) {
  const existingUser = await User.findOne({ email: payload.email.toLowerCase().trim() });

  if (existingUser) {
    throw new ApiError(409, "A user with this email already exists");
  }

  const passwordHash = await hashPassword(payload.password);

  const user = await User.create({
    role: ROLES.DRIVER,
    fullName: payload.fullName,
    email: payload.email.toLowerCase().trim(),
    phone: payload.phone,
    passwordHash,
  });

  const driverProfile = await DriverProfile.create({
    userId: user._id,
    status: DRIVER_STATUSES.PENDING_APPROVAL,
    licenseNumber: payload.licenseNumber,
    licenseExpiry: payload.licenseExpiry,
    vehicleMake: payload.vehicleMake,
    vehicleModel: payload.vehicleModel,
    vehiclePlate: payload.vehiclePlate,
    vehicleColor: payload.vehicleColor,
    nationalId: payload.nationalId,
    address: payload.address,
    emergencyContact: payload.emergencyContact,
  });

  return { user, driverProfile };
}

async function getPendingDrivers() {
  return DriverProfile.find({ status: DRIVER_STATUSES.PENDING_APPROVAL })
    .populate("userId", "-passwordHash")
    .sort({ createdAt: 1 });
}

async function updateDriverStatus(driverId, updates) {
  const driverProfile = await DriverProfile.findById(driverId).populate("userId", "-passwordHash");

  if (!driverProfile) {
    throw new ApiError(404, "Driver profile not found");
  }

  Object.assign(driverProfile, updates);
  await driverProfile.save();

  return driverProfile;
}

module.exports = { createStaffUser, registerDriver, getPendingDrivers, updateDriverStatus };

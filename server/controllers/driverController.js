const { z } = require('zod');
const DriverProfile = require('../models/DriverProfile');
const User = require('../models/User');
const { ROLES } = require('../constants/roles');
const { DRIVER_APPROVAL_STATUS, DRIVER_STATUS } = require('../constants/statuses');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

const onboardingSchema = z.object({
  licenseNumber: z.string().min(2).optional(),
  vehicleMake: z.string().min(1).optional(),
  vehicleModel: z.string().min(1).optional(),
  vehiclePlate: z.string().min(1).optional()
});

const statusSchema = z.object({
  lifecycleStatus: z.enum([DRIVER_STATUS.ACTIVE, DRIVER_STATUS.OFFLINE])
});

const adminStatusSchema = z.object({
  approvalStatus: z.enum(Object.values(DRIVER_APPROVAL_STATUS)).optional(),
  lifecycleStatus: z.enum(Object.values(DRIVER_STATUS)).optional()
});

const ensureDriverProfile = async (userId) => {
  const profile = await DriverProfile.findOne({ user: userId }).populate('user', 'name email phone role');
  if (!profile) throw new ApiError(404, 'Driver profile not found', 'DRIVER_NOT_FOUND');
  return profile;
};

const listDrivers = asyncHandler(async (_req, res) => {
  const drivers = await DriverProfile.find().populate('user', 'name email phone role').sort({ createdAt: -1 });
  res.json({ drivers });
});

const myProfile = asyncHandler(async (req, res) => {
  const profile = await ensureDriverProfile(req.user._id);
  res.json({ profile });
});

const updateOnboarding = asyncHandler(async (req, res) => {
  const data = onboardingSchema.parse(req.body);
  const profile = await DriverProfile.findOneAndUpdate(
    { user: req.user._id },
    data,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).populate('user', 'name email phone role');
  res.json({ profile });
});

const updateAvailability = asyncHandler(async (req, res) => {
  const data = statusSchema.parse(req.body);
  const profile = await ensureDriverProfile(req.user._id);

  if (profile.approvalStatus !== DRIVER_APPROVAL_STATUS.APPROVED) {
    throw new ApiError(409, 'Driver must be approved before becoming available', 'DRIVER_NOT_APPROVED');
  }

  if ([DRIVER_STATUS.ASSIGNED, DRIVER_STATUS.ON_TRIP].includes(profile.lifecycleStatus)) {
    throw new ApiError(409, 'Driver status is locked by an active booking', 'DRIVER_BUSY');
  }

  profile.lifecycleStatus = data.lifecycleStatus;
  await profile.save();
  res.json({ profile });
});

const updateDriverStatus = asyncHandler(async (req, res) => {
  const data = adminStatusSchema.parse(req.body);
  const profile = await DriverProfile.findById(req.params.driverId).populate('user', 'name email phone role');
  if (!profile) throw new ApiError(404, 'Driver profile not found', 'DRIVER_NOT_FOUND');

  if (data.approvalStatus) {
    profile.approvalStatus = data.approvalStatus;
    if (data.approvalStatus === DRIVER_APPROVAL_STATUS.APPROVED) {
      profile.approvedAt = new Date();
      profile.approvedBy = req.user._id;
      if (profile.lifecycleStatus === DRIVER_STATUS.OFFLINE) {
        profile.lifecycleStatus = DRIVER_STATUS.ACTIVE;
      }
    }
  }

  if (data.lifecycleStatus) {
    profile.lifecycleStatus = data.lifecycleStatus;
  }

  await profile.save();
  res.json({ profile });
});

const createStaffUser = asyncHandler(async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(8),
    role: z.enum([ROLES.ADMIN, ROLES.AGENT])
  });
  const data = schema.parse(req.body);
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new ApiError(409, 'Email is already registered', 'EMAIL_EXISTS');

  const user = await User.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: data.role,
    passwordHash: data.password
  });
  res.status(201).json({ user: user.toSafeObject() });
});

module.exports = {
  createStaffUser,
  listDrivers,
  myProfile,
  updateAvailability,
  updateDriverStatus,
  updateOnboarding
};

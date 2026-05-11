const { z } = require('zod');
const User = require('../models/User');
const DriverProfile = require('../models/DriverProfile');
const { ROLES } = require('../constants/roles');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { authResponse } = require('../services/authService');

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  role: z.enum([ROLES.CLIENT, ROLES.DRIVER]).default(ROLES.CLIENT)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const register = asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body);
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new ApiError(409, 'Email is already registered', 'EMAIL_EXISTS');

  const user = await User.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    passwordHash: data.password,
    role: data.role
  });

  if (data.role === ROLES.DRIVER) {
    await DriverProfile.create({ user: user._id });
  }

  res.status(201).json(authResponse(user));
});

const login = asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body);
  const user = await User.findOne({ email: data.email }).select('+passwordHash');
  if (!user || !(await user.comparePassword(data.password))) {
    throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  res.json(authResponse(user));
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

module.exports = { register, login, me };

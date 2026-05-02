const User = require("../models/User");
const { ROLES } = require("../constants/roles");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");
const {
  serializeUser,
  verifyCredentials,
  issueAccessToken,
  hashPassword,
} = require("../services/authService");

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;
  const user = await verifyCredentials(email, password);
  const token = issueAccessToken(user);

  res.json({
    success: true,
    data: {
      token,
      user: serializeUser(user),
    },
  });
});

const registerClient = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password } = req.validated.body;
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const user = await User.create({
    role: ROLES.CLIENT,
    fullName,
    email: normalizedEmail,
    phone,
    passwordHash: await hashPassword(password),
  });
  const token = issueAccessToken(user);

  res.status(201).json({
    success: true,
    data: {
      token,
      user: serializeUser(user),
    },
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

const logout = asyncHandler(async (_req, res) => {
  res.json({
    success: true,
    data: {
      message: "Logged out",
    },
  });
});

module.exports = { login, registerClient, me, logout };

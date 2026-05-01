const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { env } = require("../config/env");
const { ApiError } = require("../utils/apiError");

function serializeUser(user) {
  return {
    id: user._id,
    role: user.role,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function verifyCredentials(email, password) {
  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const passwordIsValid = await bcrypt.compare(password, user.passwordHash);

  if (!passwordIsValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Your account is inactive");
  }

  user.lastLoginAt = new Date();
  await user.save();

  return user;
}

function issueAccessToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

module.exports = { serializeUser, hashPassword, verifyCredentials, issueAccessToken };

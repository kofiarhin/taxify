const User = require("../models/User");
const { asyncHandler } = require("../utils/asyncHandler");
const { getPagination } = require("../utils/pagination");
const { createStaffUser } = require("../services/userService");
const { serializeUser } = require("../services/authService");

const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const [users, total] = await Promise.all([
    User.find().select("-passwordHash").sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(),
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: { page, limit, total },
    },
  });
});

const createUser = asyncHandler(async (req, res) => {
  const user = await createStaffUser(req.validated.body);

  res.status(201).json({
    success: true,
    data: {
      user: serializeUser(user),
    },
  });
});

module.exports = { listUsers, createUser };

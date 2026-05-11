const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

const auth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throw new ApiError(401, 'Authentication token is required', 'AUTH_REQUIRED');
  }

  const payload = jwt.verify(token, env.JWT_SECRET);
  const user = await User.findById(payload.sub);

  if (!user || user.status !== 'ACTIVE') {
    throw new ApiError(401, 'Invalid authentication token', 'AUTH_INVALID');
  }

  req.user = user;
  next();
});

module.exports = auth;

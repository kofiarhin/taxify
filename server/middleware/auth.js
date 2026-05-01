const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { env } = require("../config/env");
const { ApiError } = require("../utils/apiError");

async function auth(req, _res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(new ApiError(401, "Authentication required"));
  }

  const token = header.replace("Bearer ", "");

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("-passwordHash");

    if (!user || !user.isActive) {
      return next(new ApiError(401, "User is no longer active"));
    }

    req.user = user;
    return next();
  } catch (_error) {
    return next(new ApiError(401, "Invalid or expired token"));
  }
}

module.exports = { auth };

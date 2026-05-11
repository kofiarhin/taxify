const ApiError = require('../utils/apiError');

const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to access this resource', 'FORBIDDEN'));
  }
  return next();
};

module.exports = requireRole;

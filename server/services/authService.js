const jwt = require('jsonwebtoken');
const env = require('../config/env');

const signToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });

const authResponse = (user) => ({
  user: user.toSafeObject ? user.toSafeObject() : user,
  token: signToken(user)
});

module.exports = { signToken, authResponse };

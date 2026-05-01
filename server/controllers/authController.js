const { asyncHandler } = require("../utils/asyncHandler");
const { serializeUser, verifyCredentials, issueAccessToken } = require("../services/authService");

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

module.exports = { login, me, logout };

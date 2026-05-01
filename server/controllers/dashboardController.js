const { asyncHandler } = require("../utils/asyncHandler");
const { getSummary } = require("../services/dashboardService");

const summary = asyncHandler(async (_req, res) => {
  const data = await getSummary();
  res.json({ success: true, data });
});

module.exports = { summary };

const DriverProfile = require("../models/DriverProfile");
const AuditLog = require("../models/AuditLog");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");
const {
  getCurrentAssignmentForDriver,
  acceptAssignment,
  rejectAssignment,
} = require("../services/assignmentService");

const getMyAssignment = asyncHandler(async (req, res) => {
  const driverProfile = await DriverProfile.findOne({ userId: req.user._id });
  if (!driverProfile) throw new ApiError(404, "Driver profile not found");

  const result = await getCurrentAssignmentForDriver(driverProfile._id);
  res.json({ success: true, data: result ?? { booking: null, attempt: null } });
});

const accept = asyncHandler(async (req, res) => {
  const driverProfile = await DriverProfile.findOne({ userId: req.user._id });
  if (!driverProfile) throw new ApiError(404, "Driver profile not found");

  const { attempt, booking } = await acceptAssignment(req.params.id, driverProfile._id);

  await AuditLog.create({
    actorUserId: req.user._id,
    action: "ASSIGNMENT_ACCEPTED",
    entityType: "AssignmentAttempt",
    entityId: attempt._id,
    metadata: { bookingId: booking._id },
  });

  res.json({ success: true, data: { attempt, booking } });
});

const reject = asyncHandler(async (req, res) => {
  const driverProfile = await DriverProfile.findOne({ userId: req.user._id });
  if (!driverProfile) throw new ApiError(404, "Driver profile not found");

  const result = await rejectAssignment(
    req.params.id,
    driverProfile._id,
    req.body?.reason || ""
  );

  await AuditLog.create({
    actorUserId: req.user._id,
    action: "ASSIGNMENT_REJECTED",
    entityType: "AssignmentAttempt",
    entityId: req.params.id,
    metadata: { reason: req.body?.reason },
  });

  res.json({ success: true, data: result });
});

module.exports = { getMyAssignment, accept, reject };

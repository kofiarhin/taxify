const CommissionStatement = require("../models/CommissionStatement");
const DriverProfile = require("../models/DriverProfile");
const AuditLog = require("../models/AuditLog");
const { asyncHandler } = require("../utils/asyncHandler");
const { getPagination } = require("../utils/pagination");
const { ApiError } = require("../utils/apiError");
const {
  submitReceipt,
  approveStatement,
  settleStatement,
  rejectStatement,
} = require("../services/commissionService");
const {
  reconcileMonthlyCommissions,
} = require("../services/commissionReconciliationService");

const listCommissions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.driverId) filter.driverId = req.query.driverId;
  if (req.query.status) filter.status = req.query.status;

  const [statements, total] = await Promise.all([
    CommissionStatement.find(filter)
      .populate({ path: "driverId", populate: { path: "userId", select: "fullName email" } })
      .sort({ periodYear: -1, periodMonth: -1 })
      .skip(skip)
      .limit(limit),
    CommissionStatement.countDocuments(filter),
  ]);

  res.json({ success: true, data: { statements, pagination: { page, limit, total } } });
});

const getMyCommissions = asyncHandler(async (req, res) => {
  const driverProfile = await DriverProfile.findOne({ userId: req.user._id });
  if (!driverProfile) throw new ApiError(404, "Driver profile not found");

  const { page, limit, skip } = getPagination(req.query);
  const [statements, total] = await Promise.all([
    CommissionStatement.find({ driverId: driverProfile._id })
      .sort({ periodYear: -1, periodMonth: -1 })
      .skip(skip)
      .limit(limit),
    CommissionStatement.countDocuments({ driverId: driverProfile._id }),
  ]);

  res.json({ success: true, data: { statements, pagination: { page, limit, total } } });
});

const getCommission = asyncHandler(async (req, res) => {
  const statement = await CommissionStatement.findById(req.params.id).populate({
    path: "driverId",
    populate: { path: "userId", select: "fullName email" },
  });

  if (!statement) throw new ApiError(404, "Commission statement not found");
  res.json({ success: true, data: { statement } });
});

const uploadReceipt = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No receipt file uploaded");

  const driverProfile = await DriverProfile.findOne({ userId: req.user._id });
  if (!driverProfile) throw new ApiError(404, "Driver profile not found");

  const fileUrl = `/uploads/receipts/${req.file.filename}`;
  const statement = await submitReceipt(req.params.id, driverProfile._id, fileUrl);

  res.json({ success: true, data: { statement } });
});

const approveReceipt = asyncHandler(async (req, res) => {
  const statement = await approveStatement(
    req.params.id,
    req.user._id,
    req.body.notes || "",
    req.body.settleImmediately === true
  );

  await AuditLog.create({
    actorUserId: req.user._id,
    action: "COMMISSION_APPROVED",
    entityType: "CommissionStatement",
    entityId: statement._id,
    metadata: { driverId: statement.driverId },
  });

  res.json({ success: true, data: { statement } });
});

const settleReceipt = asyncHandler(async (req, res) => {
  const statement = await settleStatement(req.params.id, req.user._id, req.body.notes || "");

  await AuditLog.create({
    actorUserId: req.user._id,
    action: "COMMISSION_SETTLED",
    entityType: "CommissionStatement",
    entityId: statement._id,
    metadata: { driverId: statement.driverId },
  });

  res.json({ success: true, data: { statement } });
});

const rejectReceipt = asyncHandler(async (req, res) => {
  const statement = await rejectStatement(
    req.params.id,
    req.user._id,
    req.body.notes || ""
  );

  await AuditLog.create({
    actorUserId: req.user._id,
    action: "COMMISSION_REJECTED",
    entityType: "CommissionStatement",
    entityId: statement._id,
    metadata: { reason: req.body.notes },
  });

  res.json({ success: true, data: { statement } });
});

const reconcileCommissions = asyncHandler(async (req, res) => {
  const summary = await reconcileMonthlyCommissions();

  await AuditLog.create({
    actorUserId: req.user._id,
    action: "COMMISSION_RECONCILED",
    entityType: "CommissionStatement",
    entityId: null,
    metadata: summary,
  });

  res.json({ success: true, data: { summary } });
});

module.exports = {
  listCommissions,
  getMyCommissions,
  getCommission,
  uploadReceipt,
  approveReceipt,
  settleReceipt,
  rejectReceipt,
  reconcileCommissions,
};

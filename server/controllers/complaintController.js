const Complaint = require("../models/Complaint");
const AuditLog = require("../models/AuditLog");
const { asyncHandler } = require("../utils/asyncHandler");
const { getPagination } = require("../utils/pagination");
const { ApiError } = require("../utils/apiError");
const { COMPLAINT_STATUSES } = require("../constants/statuses");

const createComplaint = asyncHandler(async (req, res) => {
  const body = req.validated.body;
  const complaint = await Complaint.create({
    ...body,
    bookingId: body.bookingId || null,
    driverId: body.driverId || null,
    reportedByUserId: req.user._id,
  });

  res.status(201).json({ success: true, data: { complaint } });
});

const listComplaints = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [complaints, total] = await Promise.all([
    Complaint.find(filter)
      .populate("reportedByUserId", "fullName email role")
      .populate("assignedToUserId", "fullName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Complaint.countDocuments(filter),
  ]);

  res.json({ success: true, data: { complaints, pagination: { page, limit, total } } });
});

const getComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate("reportedByUserId", "fullName email role")
    .populate("assignedToUserId", "fullName");

  if (!complaint) throw new ApiError(404, "Complaint not found");
  res.json({ success: true, data: { complaint } });
});

const updateComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new ApiError(404, "Complaint not found");

  const { status, assignedToUserId, resolutionNotes } = req.validated.body;
  if (status) complaint.status = status;
  if (assignedToUserId !== undefined) complaint.assignedToUserId = assignedToUserId || null;
  if (resolutionNotes !== undefined) complaint.resolutionNotes = resolutionNotes;
  await complaint.save();

  res.json({ success: true, data: { complaint } });
});

const resolveComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new ApiError(404, "Complaint not found");

  if (complaint.status === COMPLAINT_STATUSES.RESOLVED) {
    throw new ApiError(400, "Complaint is already resolved");
  }

  complaint.status = COMPLAINT_STATUSES.RESOLVED;
  complaint.resolutionNotes = req.validated.body.resolutionNotes;
  complaint.resolvedAt = new Date();
  await complaint.save();

  await AuditLog.create({
    actorUserId: req.user._id,
    action: "COMPLAINT_RESOLVED",
    entityType: "Complaint",
    entityId: complaint._id,
    metadata: { resolutionNotes: complaint.resolutionNotes },
  });

  res.json({ success: true, data: { complaint } });
});

module.exports = { createComplaint, listComplaints, getComplaint, updateComplaint, resolveComplaint };

const { z } = require('zod');
const CommissionStatement = require('../models/CommissionStatement');
const DriverProfile = require('../models/DriverProfile');
const { ROLES } = require('../constants/roles');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

const receiptSchema = z.object({
  receiptReference: z.string().min(2),
  receiptNotes: z.string().optional()
});

const reviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  adminNotes: z.string().optional()
});

const listCommissions = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.month) filter.month = req.query.month;
  if (req.user.role === ROLES.DRIVER) {
    const profile = await DriverProfile.findOne({ user: req.user._id });
    filter.driver = profile?._id;
  }
  const commissions = await CommissionStatement.find(filter)
    .populate({ path: 'driver', populate: { path: 'user', select: 'name email phone' } })
    .populate('booking')
    .sort({ month: -1, createdAt: -1 });
  res.json({ commissions });
});

const submitReceipt = asyncHandler(async (req, res) => {
  const data = receiptSchema.parse(req.body);
  const profile = await DriverProfile.findOne({ user: req.user._id });
  const commission = await CommissionStatement.findById(req.params.commissionId);
  if (!commission) throw new ApiError(404, 'Commission record not found', 'COMMISSION_NOT_FOUND');
  if (commission.driver.toString() !== profile?._id.toString()) {
    throw new ApiError(403, 'Cannot update another driver commission', 'FORBIDDEN');
  }

  commission.receiptReference = data.receiptReference;
  commission.receiptNotes = data.receiptNotes;
  commission.status = 'SUBMITTED';
  commission.submittedAt = new Date();
  await commission.save();
  res.json({ commission });
});

const reviewReceipt = asyncHandler(async (req, res) => {
  const data = reviewSchema.parse(req.body);
  const commission = await CommissionStatement.findById(req.params.commissionId);
  if (!commission) throw new ApiError(404, 'Commission record not found', 'COMMISSION_NOT_FOUND');
  commission.status = data.status;
  commission.adminNotes = data.adminNotes;
  commission.reviewedAt = new Date();
  commission.reviewedBy = req.user._id;
  await commission.save();
  res.json({ commission });
});

module.exports = { listCommissions, reviewReceipt, submitReceipt };

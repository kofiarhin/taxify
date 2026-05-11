const { z } = require('zod');
const Booking = require('../models/Booking');
const Complaint = require('../models/Complaint');
const { ROLES } = require('../constants/roles');
const { BOOKING_STATUS } = require('../constants/statuses');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

const createSchema = z.object({
  booking: z.string().optional(),
  targetDriver: z.string().optional(),
  type: z.enum(['COMPLAINT', 'DISPUTE']).default('COMPLAINT'),
  title: z.string().min(3),
  description: z.string().min(5)
});

const updateSchema = z.object({
  status: z.enum(['OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED']).optional(),
  adminNotes: z.string().optional()
});

const createComplaint = asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);
  let booking;

  if (data.booking) {
    booking = await Booking.findById(data.booking);
    if (!booking) throw new ApiError(404, 'Booking not found', 'BOOKING_NOT_FOUND');
    if (req.user.role === ROLES.CLIENT && booking.client?.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Cannot complain on this booking', 'FORBIDDEN');
    }
  }

  const complaint = await Complaint.create({
    ...data,
    createdBy: req.user._id,
    targetDriver: data.targetDriver || booking?.assignedDriver
  });

  if (booking && data.type === 'DISPUTE') {
    booking.status = BOOKING_STATUS.DISPUTED;
    booking.disputedAt = new Date();
    await booking.save();
  }

  res.status(201).json({ complaint });
});

const listComplaints = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === ROLES.CLIENT) filter.createdBy = req.user._id;
  if (req.query.status) filter.status = req.query.status;
  const complaints = await Complaint.find(filter)
    .populate('createdBy', 'name email role')
    .populate('booking')
    .populate({ path: 'targetDriver', populate: { path: 'user', select: 'name email phone' } })
    .sort({ createdAt: -1 });
  res.json({ complaints });
});

const updateComplaint = asyncHandler(async (req, res) => {
  const data = updateSchema.parse(req.body);
  const complaint = await Complaint.findByIdAndUpdate(req.params.complaintId, data, { new: true });
  if (!complaint) throw new ApiError(404, 'Complaint not found', 'COMPLAINT_NOT_FOUND');
  res.json({ complaint });
});

module.exports = { createComplaint, listComplaints, updateComplaint };

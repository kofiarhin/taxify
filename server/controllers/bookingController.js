const { z } = require('zod');
const Booking = require('../models/Booking');
const DriverProfile = require('../models/DriverProfile');
const { ROLES } = require('../constants/roles');
const { BOOKING_STATUS, DRIVER_STATUS } = require('../constants/statuses');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { assignAvailableDriver, retryAssignment } = require('../services/assignmentService');

const optionalTrimmedString = () =>
  z
    .string()
    .trim()
    .transform((value) => (value.length > 0 ? value : undefined))
    .optional();

const bookingSchema = z.object({
  passengerName: optionalTrimmedString().pipe(z.string().min(2).optional()),
  passengerPhone: optionalTrimmedString(),
  pickupAddress: z.string().trim().min(3),
  dropoffAddress: z.string().trim().min(3)
});

const populateBooking = (query) =>
  query
    .populate('client', 'name email phone')
    .populate('createdBy', 'name email role')
    .populate({ path: 'assignedDriver', populate: { path: 'user', select: 'name email phone' } });

const createBooking = asyncHandler(async (req, res) => {
  const data = bookingSchema.parse(req.body);
  const isClient = req.user.role === ROLES.CLIENT;

  const booking = await Booking.create({
    client: isClient ? req.user._id : undefined,
    createdBy: req.user._id,
    source: isClient ? 'CLIENT_APP' : 'AGENT',
    passengerName: data.passengerName || req.user.name,
    passengerPhone: data.passengerPhone || req.user.phone,
    pickupAddress: data.pickupAddress,
    dropoffAddress: data.dropoffAddress
  });

  await assignAvailableDriver(booking);
  const hydrated = await populateBooking(Booking.findById(booking._id));
  res.status(201).json({ booking: hydrated });
});

const listBookings = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === ROLES.CLIENT) filter.client = req.user._id;
  if (req.user.role === ROLES.DRIVER) {
    const profile = await DriverProfile.findOne({ user: req.user._id });
    if (!profile) return res.json({ bookings: [] });
    filter.assignedDriver = profile?._id;
  }
  if (req.query.status) filter.status = req.query.status;

  const bookings = await populateBooking(Booking.find(filter).sort({ createdAt: -1 }).limit(100));
  res.json({ bookings });
});

const getBooking = asyncHandler(async (req, res) => {
  const booking = await populateBooking(Booking.findById(req.params.bookingId));
  if (!booking) throw new ApiError(404, 'Booking not found', 'BOOKING_NOT_FOUND');

  if (req.user.role === ROLES.CLIENT && booking.client?.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Cannot view this booking', 'FORBIDDEN');
  }

  if (req.user.role === ROLES.DRIVER) {
    const profile = await DriverProfile.findOne({ user: req.user._id });
    if (booking.assignedDriver?._id?.toString() !== profile?._id?.toString()) {
      throw new ApiError(403, 'Cannot view this booking', 'FORBIDDEN');
    }
  }

  res.json({ booking });
});

const retry = asyncHandler(async (req, res) => {
  const booking = await retryAssignment(req.params.bookingId);
  if (!booking) throw new ApiError(404, 'Booking not found', 'BOOKING_NOT_FOUND');
  const hydrated = await populateBooking(Booking.findById(booking._id));
  res.json({ booking: hydrated });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) throw new ApiError(404, 'Booking not found', 'BOOKING_NOT_FOUND');

  const cancellable = [
    BOOKING_STATUS.PENDING_ASSIGNMENT,
    BOOKING_STATUS.QUEUED,
    BOOKING_STATUS.DRIVER_ASSIGNED,
    BOOKING_STATUS.DRIVER_ACCEPTED
  ];
  if (!cancellable.includes(booking.status)) {
    throw new ApiError(409, 'Only pre-trip bookings can be cancelled', 'BOOKING_NOT_CANCELLABLE');
  }

  if (booking.assignedDriver) {
    await DriverProfile.findByIdAndUpdate(booking.assignedDriver, { lifecycleStatus: DRIVER_STATUS.ACTIVE });
  }

  booking.status = BOOKING_STATUS.CANCELLED;
  booking.cancelledAt = new Date();
  await booking.save();
  res.json({ booking });
});

const disputeBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) throw new ApiError(404, 'Booking not found', 'BOOKING_NOT_FOUND');
  booking.status = BOOKING_STATUS.DISPUTED;
  booking.disputedAt = new Date();
  await booking.save();
  res.json({ booking });
});

module.exports = { cancelBooking, createBooking, disputeBooking, getBooking, listBookings, retry };

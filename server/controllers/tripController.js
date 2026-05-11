const { z } = require('zod');
const Booking = require('../models/Booking');
const DriverProfile = require('../models/DriverProfile');
const Trip = require('../models/Trip');
const { ROLES } = require('../constants/roles');
const { BOOKING_STATUS, DRIVER_STATUS } = require('../constants/statuses');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { requeueBooking } = require('../services/assignmentService');
const { calculateFare } = require('../services/fareService');
const { createCommissionForBooking } = require('../services/commissionService');

const endTripSchema = z.object({
  distanceKm: z.coerce.number().min(0),
  durationMinutes: z.coerce.number().min(0)
});

const getAssigned = async (userId, bookingId) => {
  const profile = await DriverProfile.findOne({ user: userId });
  if (!profile) throw new ApiError(404, 'Driver profile not found', 'DRIVER_NOT_FOUND');
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, 'Booking not found', 'BOOKING_NOT_FOUND');
  if (booking.assignedDriver?.toString() !== profile._id.toString()) {
    throw new ApiError(403, 'Only the assigned driver can change this trip', 'FORBIDDEN');
  }
  return { booking, profile };
};

const accept = asyncHandler(async (req, res) => {
  const { booking, profile } = await getAssigned(req.user._id, req.params.bookingId);
  if (booking.status !== BOOKING_STATUS.DRIVER_ASSIGNED) {
    throw new ApiError(409, 'Booking is not awaiting driver acceptance', 'INVALID_STATUS');
  }
  booking.status = BOOKING_STATUS.DRIVER_ACCEPTED;
  booking.acceptedAt = new Date();
  await booking.save();
  profile.lifecycleStatus = DRIVER_STATUS.ASSIGNED;
  await profile.save();
  res.json({ booking });
});

const reject = asyncHandler(async (req, res) => {
  const { booking, profile } = await getAssigned(req.user._id, req.params.bookingId);
  if (booking.status !== BOOKING_STATUS.DRIVER_ASSIGNED) {
    throw new ApiError(409, 'Booking is not awaiting driver acceptance', 'INVALID_STATUS');
  }
  const updated = await requeueBooking(booking, profile);
  res.json({ booking: updated });
});

const start = asyncHandler(async (req, res) => {
  const { booking, profile } = await getAssigned(req.user._id, req.params.bookingId);
  if (booking.status !== BOOKING_STATUS.DRIVER_ACCEPTED) {
    throw new ApiError(409, 'Booking must be accepted before trip start', 'INVALID_STATUS');
  }
  booking.status = BOOKING_STATUS.TRIP_IN_PROGRESS;
  booking.startedAt = new Date();
  await booking.save();
  profile.lifecycleStatus = DRIVER_STATUS.ON_TRIP;
  await profile.save();
  await Trip.findOneAndUpdate(
    { booking: booking._id },
    { booking: booking._id, driver: profile._id, startedAt: booking.startedAt },
    { upsert: true, new: true }
  );
  res.json({ booking });
});

const end = asyncHandler(async (req, res) => {
  const data = endTripSchema.parse(req.body);
  const { booking, profile } = await getAssigned(req.user._id, req.params.bookingId);
  if (booking.status !== BOOKING_STATUS.TRIP_IN_PROGRESS) {
    throw new ApiError(409, 'Trip is not in progress', 'INVALID_STATUS');
  }
  const fare = calculateFare(data);
  booking.status = BOOKING_STATUS.AWAITING_CLIENT_CONFIRMATION;
  booking.endedAt = new Date();
  booking.distanceKm = data.distanceKm;
  booking.durationMinutes = data.durationMinutes;
  booking.fare = fare;
  await booking.save();
  await Trip.findOneAndUpdate(
    { booking: booking._id },
    {
      booking: booking._id,
      driver: profile._id,
      startedAt: booking.startedAt,
      endedAt: booking.endedAt,
      distanceKm: data.distanceKm,
      durationMinutes: data.durationMinutes,
      fare
    },
    { upsert: true, new: true }
  );
  res.json({ booking });
});

const confirmClient = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) throw new ApiError(404, 'Booking not found', 'BOOKING_NOT_FOUND');
  if (req.user.role !== ROLES.CLIENT || booking.client?.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Only the booking client can confirm completion', 'FORBIDDEN');
  }
  if (booking.status !== BOOKING_STATUS.AWAITING_CLIENT_CONFIRMATION) {
    throw new ApiError(409, 'Booking is not awaiting client confirmation', 'INVALID_STATUS');
  }
  booking.status = BOOKING_STATUS.AWAITING_DRIVER_PAYMENT_CONFIRMATION;
  booking.payment.status = 'CLIENT_CONFIRMED';
  booking.payment.clientConfirmedAt = new Date();
  await booking.save();
  res.json({ booking });
});

const confirmPayment = asyncHandler(async (req, res) => {
  const { booking, profile } = await getAssigned(req.user._id, req.params.bookingId);
  if (booking.status !== BOOKING_STATUS.AWAITING_DRIVER_PAYMENT_CONFIRMATION) {
    throw new ApiError(409, 'Booking is not awaiting driver cash confirmation', 'INVALID_STATUS');
  }
  booking.status = BOOKING_STATUS.COMPLETED;
  booking.payment.status = 'PAID';
  booking.payment.driverConfirmedAt = new Date();
  booking.completedAt = new Date();
  await booking.save();
  profile.lifecycleStatus = DRIVER_STATUS.ACTIVE;
  await profile.save();
  await createCommissionForBooking(booking);
  res.json({ booking });
});

module.exports = { accept, confirmClient, confirmPayment, end, reject, start };

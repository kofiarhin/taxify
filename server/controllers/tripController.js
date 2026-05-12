const { z } = require('zod');
const Booking = require('../models/Booking');
const DriverProfile = require('../models/DriverProfile');
const Trip = require('../models/Trip');
const { ROLES } = require('../constants/roles');
const { BOOKING_STATUS, DRIVER_STATUS } = require('../constants/statuses');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const realtime = require('../realtime/socket');
const { requeueBooking } = require('../services/assignmentService');
const { setBookingStatus, tryFinalizePaidBooking } = require('../services/bookingLifecycleService');
const { calculateFare } = require('../services/fareService');

const endTripSchema = z.object({
  distanceKm: z.coerce.number().min(0),
  durationMinutes: z.coerce.number().min(0)
});

const getAssignedDriver = async (userId, bookingId) => {
  const profile = await DriverProfile.findOne({ user: userId });
  if (!profile) throw new ApiError(404, 'Driver profile not found', 'DRIVER_NOT_FOUND');
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, 'Booking not found', 'BOOKING_NOT_FOUND');
  if (booking.assignedDriver?.toString() !== profile._id.toString()) {
    throw new ApiError(403, 'Only the assigned driver can change this trip', 'FORBIDDEN');
  }
  return { booking, profile };
};

const getClientBooking = async (user, bookingId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, 'Booking not found', 'BOOKING_NOT_FOUND');
  if (user.role !== ROLES.CLIENT || booking.client?.toString() !== user._id.toString()) {
    throw new ApiError(403, 'Only the booking client can perform this action', 'FORBIDDEN');
  }
  return booking;
};

const accept = asyncHandler(async (req, res) => {
  const { booking, profile } = await getAssignedDriver(req.user._id, req.params.bookingId);
  if (booking.status !== BOOKING_STATUS.DRIVER_ASSIGNED) {
    throw new ApiError(409, 'Booking is not awaiting driver acceptance', 'INVALID_STATUS');
  }
  setBookingStatus(booking, BOOKING_STATUS.DRIVER_ACCEPTED, { actor: req.user._id, note: 'Driver accepted booking' });
  booking.acceptedAt = new Date();
  await booking.save();
  profile.lifecycleStatus = DRIVER_STATUS.ASSIGNED;
  await profile.save();
  await realtime.emitPopulatedBookingEvent(booking, 'booking:accepted');
  res.json({ booking });
});

const reject = asyncHandler(async (req, res) => {
  const { booking, profile } = await getAssignedDriver(req.user._id, req.params.bookingId);
  if (booking.status !== BOOKING_STATUS.DRIVER_ASSIGNED) {
    throw new ApiError(409, 'Booking is not awaiting driver acceptance', 'INVALID_STATUS');
  }
  const updated = await requeueBooking(booking, profile);
  res.json({ booking: updated });
});

const start = asyncHandler(async (req, res) => {
  const { booking, profile } = await getAssignedDriver(req.user._id, req.params.bookingId);
  if (booking.status !== BOOKING_STATUS.DRIVER_ACCEPTED) {
    throw new ApiError(409, 'Booking must be accepted before trip start', 'INVALID_STATUS');
  }
  setBookingStatus(booking, BOOKING_STATUS.TRIP_IN_PROGRESS, { actor: req.user._id, note: 'Trip started' });
  booking.startedAt = new Date();
  await booking.save();
  profile.lifecycleStatus = DRIVER_STATUS.ON_TRIP;
  await profile.save();
  await Trip.findOneAndUpdate(
    { booking: booking._id },
    { booking: booking._id, driver: profile._id, startedAt: booking.startedAt },
    { upsert: true, new: true }
  );
  await realtime.emitPopulatedBookingEvent(booking, 'trip:started');
  res.json({ booking });
});

// Driver-side arrival mark: records distance, computes fare, sets driver arrival.
// Idempotent: returns current state if driver already marked.
const end = asyncHandler(async (req, res) => {
  const data = endTripSchema.parse(req.body);
  const { booking, profile } = await getAssignedDriver(req.user._id, req.params.bookingId);

  if (booking.arrival?.driverMarkedAt) {
    return res.json({ booking });
  }
  if (![BOOKING_STATUS.TRIP_IN_PROGRESS, BOOKING_STATUS.TRIP_AWAITING_ARRIVAL_ACK].includes(booking.status)) {
    throw new ApiError(409, 'Trip is not in progress', 'INVALID_STATUS');
  }

  const fare = calculateFare(data);
  const now = new Date();
  booking.arrival = booking.arrival || {};
  booking.arrival.driverMarkedAt = now;
  booking.endedAt = now;
  booking.distanceKm = data.distanceKm;
  booking.durationMinutes = data.durationMinutes;
  booking.fare = fare;

  const nextStatus = booking.arrival.clientMarkedAt
    ? BOOKING_STATUS.AWAITING_PAYMENT
    : BOOKING_STATUS.TRIP_AWAITING_ARRIVAL_ACK;
  setBookingStatus(booking, nextStatus, { actor: req.user._id, note: 'Driver marked trip ended' });

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
  await realtime.emitPopulatedBookingEvent(booking, 'trip:ended');
  res.json({ booking });
});

// Client-side arrival mark. Idempotent.
const clientArrived = asyncHandler(async (req, res) => {
  const booking = await getClientBooking(req.user, req.params.bookingId);
  if (booking.arrival?.clientMarkedAt) {
    return res.json({ booking });
  }
  if (![BOOKING_STATUS.TRIP_IN_PROGRESS, BOOKING_STATUS.TRIP_AWAITING_ARRIVAL_ACK].includes(booking.status)) {
    throw new ApiError(409, 'Trip is not awaiting arrival acknowledgement', 'INVALID_STATUS');
  }

  booking.arrival = booking.arrival || {};
  booking.arrival.clientMarkedAt = new Date();

  const nextStatus = booking.arrival.driverMarkedAt
    ? BOOKING_STATUS.AWAITING_PAYMENT
    : BOOKING_STATUS.TRIP_AWAITING_ARRIVAL_ACK;
  setBookingStatus(booking, nextStatus, { actor: req.user._id, note: 'Client confirmed trip ended' });

  await booking.save();
  await realtime.emitPopulatedBookingEvent(booking, 'trip:client_arrived');
  res.json({ booking });
});

// Runs finalize and emits the completion event when it transitions. Safe to call
// on already-finalized bookings (early-returns inside tryFinalizePaidBooking).
const attemptFinalize = async (booking, { actor, profile }) => {
  const before = booking.status;
  const finalized = await tryFinalizePaidBooking(booking, {
    actor,
    note: 'Both parties confirmed cash'
  });
  const transitioned =
    before !== BOOKING_STATUS.COMPLETED && finalized.status === BOOKING_STATUS.COMPLETED;
  if (transitioned) {
    if (profile) {
      profile.lifecycleStatus = DRIVER_STATUS.ACTIVE;
      await profile.save();
    }
    await realtime.emitPopulatedBookingEvent(finalized, 'booking:completed');
  }
  return finalized;
};

// Client confirms cash paid. Idempotent. Re-attempts finalize on repeat calls so
// a transient failure (e.g., commission write) does not strand the booking.
const clientPaid = asyncHandler(async (req, res) => {
  const booking = await getClientBooking(req.user, req.params.bookingId);
  const alreadyConfirmed = Boolean(booking.payment?.clientConfirmedAt);

  if (!alreadyConfirmed) {
    if (booking.status !== BOOKING_STATUS.AWAITING_PAYMENT) {
      throw new ApiError(409, 'Booking is not awaiting payment', 'INVALID_STATUS');
    }
    booking.payment.clientConfirmedAt = new Date();
    await booking.save();
    await realtime.emitPopulatedBookingEvent(booking, 'payment:client_confirmed');
  }

  const finalized = await attemptFinalize(booking, { actor: req.user._id });
  res.json({ booking: finalized });
});

// Driver confirms cash received. Idempotent. Re-attempts finalize on repeat calls.
const driverReceived = asyncHandler(async (req, res) => {
  const { booking, profile } = await getAssignedDriver(req.user._id, req.params.bookingId);
  const alreadyConfirmed = Boolean(booking.payment?.driverConfirmedAt);

  if (!alreadyConfirmed) {
    if (booking.status !== BOOKING_STATUS.AWAITING_PAYMENT) {
      throw new ApiError(409, 'Booking is not awaiting payment', 'INVALID_STATUS');
    }
    booking.payment.driverConfirmedAt = new Date();
    await booking.save();
    await realtime.emitPopulatedBookingEvent(booking, 'payment:driver_confirmed');
  }

  const finalized = await attemptFinalize(booking, { actor: req.user._id, profile });
  res.json({ booking: finalized });
});

module.exports = { accept, clientArrived, clientPaid, driverReceived, end, reject, start };

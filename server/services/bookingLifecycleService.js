const { BOOKING_STATUS, DRIVER_STATUS } = require('../constants/statuses');
const ApiError = require('../utils/apiError');
const DriverProfile = require('../models/DriverProfile');
const { createCommissionForBooking } = require('./commissionService');

const setBookingStatus = (booking, status, { actor, note } = {}) => {
  booking.status = status;
  booking.statusHistory = booking.statusHistory || [];
  booking.statusHistory.push({
    status,
    changedAt: new Date(),
    actor,
    note
  });
  return booking;
};

const driverPaymentConfirmed = (booking) => Boolean(booking.payment?.driverConfirmedAt);

const assertFinalizable = (booking) => {
  if (!booking.assignedDriver) {
    throw new ApiError(409, 'Booking must have an assigned driver before completion', 'BOOKING_NO_DRIVER');
  }
  if (!booking.fare?.total || booking.fare.total <= 0) {
    throw new ApiError(409, 'Booking must have a calculated fare before completion', 'BOOKING_NO_FARE');
  }
};

const finalizeNow = async (booking, { actor, note }) => {
  if (booking.status === BOOKING_STATUS.COMPLETED) return booking;

  const now = new Date();
  booking.payment.status = 'PAID';
  booking.completedAt = booking.completedAt || now;
  setBookingStatus(booking, BOOKING_STATUS.PAID, { actor, note: 'Cash payment recorded' });

  // Write commission before final completion; it is upsert-by-bookingId so
  // retries are safe and cannot duplicate commission statements.
  await createCommissionForBooking(booking);

  setBookingStatus(booking, BOOKING_STATUS.COMPLETED, { actor, note });
  await booking.save();
  await DriverProfile.findByIdAndUpdate(booking.assignedDriver, { lifecycleStatus: DRIVER_STATUS.ACTIVE });
  return booking;
};

const tryFinalizePaidBooking = async (booking, { actor, note = 'Booking completed' } = {}) => {
  if (!driverPaymentConfirmed(booking)) return booking;
  assertFinalizable(booking);
  return finalizeNow(booking, { actor, note });
};

const forceFinalizePaidBooking = async (booking, { actor, note = 'Admin completed booking' } = {}) => {
  assertFinalizable(booking);
  const now = new Date();
  if (!booking.payment.driverConfirmedAt) booking.payment.driverConfirmedAt = now;
  return finalizeNow(booking, { actor, note });
};

module.exports = {
  driverPaymentConfirmed,
  forceFinalizePaidBooking,
  setBookingStatus,
  tryFinalizePaidBooking
};

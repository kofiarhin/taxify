const AssignmentAttempt = require('../models/AssignmentAttempt');
const Booking = require('../models/Booking');
const DriverProfile = require('../models/DriverProfile');
const { BOOKING_STATUS, DRIVER_APPROVAL_STATUS, DRIVER_STATUS } = require('../constants/statuses');
const realtime = require('../realtime/socket');
const { setBookingStatus } = require('./bookingLifecycleService');

const recordAssignmentAttempt = async (payload) => {
  try {
    await AssignmentAttempt.create(payload);
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Failed to record assignment attempt', error);
    }
  }
};

const assignAvailableDriver = async (booking, options = {}) => {
  const excludedDriverIds = (options.excludeDriverIds || []).map((id) => id?.toString()).filter(Boolean);
  const driverFilter = {
    approvalStatus: DRIVER_APPROVAL_STATUS.APPROVED,
    lifecycleStatus: DRIVER_STATUS.ACTIVE
  };
  if (excludedDriverIds.length > 0) {
    driverFilter._id = { $nin: excludedDriverIds };
  }

  const driver = await DriverProfile.findOne(driverFilter).sort({ updatedAt: 1, createdAt: 1 });

  if (!driver) {
    setBookingStatus(booking, BOOKING_STATUS.QUEUED, {
      actor: options.actor,
      note: options.note || 'No approved active driver available'
    });
    booking.assignedDriver = undefined;
    await booking.save();
    await recordAssignmentAttempt({ booking: booking._id, status: 'NO_DRIVER', note: 'No approved active driver available' });
    if (!options.suppressRealtime) {
      await realtime.emitPopulatedBookingEvent(booking, 'booking:queued');
    }
    return booking;
  }

  setBookingStatus(booking, BOOKING_STATUS.DRIVER_ASSIGNED, {
    actor: options.actor,
    note: options.note || 'Driver assigned'
  });
  booking.assignedDriver = driver._id;
  await booking.save();

  driver.lifecycleStatus = DRIVER_STATUS.ASSIGNED;
  await driver.save();

  await recordAssignmentAttempt({ booking: booking._id, driver: driver._id, status: 'ASSIGNED' });
  if (!options.suppressRealtime) {
    await realtime.emitPopulatedBookingEvent(booking, 'booking:assigned');
  }
  return booking;
};

const assignQueuedBookingToDriver = async (driver, options = {}) => {
  if (
    !driver ||
    driver.approvalStatus !== DRIVER_APPROVAL_STATUS.APPROVED ||
    driver.lifecycleStatus !== DRIVER_STATUS.ACTIVE
  ) {
    return null;
  }

  const booking = await Booking.findOne({
    status: { $in: [BOOKING_STATUS.PENDING_ASSIGNMENT, BOOKING_STATUS.QUEUED] },
    $or: [{ assignedDriver: { $exists: false } }, { assignedDriver: null }]
  }).sort({ createdAt: 1, updatedAt: 1 });

  if (!booking) return null;

  setBookingStatus(booking, BOOKING_STATUS.DRIVER_ASSIGNED, {
    actor: options.actor,
    note: options.note || 'Queued booking assigned to available driver'
  });
  booking.assignedDriver = driver._id;
  await booking.save();

  driver.lifecycleStatus = DRIVER_STATUS.ASSIGNED;
  await driver.save();

  await recordAssignmentAttempt({
    booking: booking._id,
    driver: driver._id,
    status: 'ASSIGNED',
    note: options.note || 'Queued booking assigned to available driver'
  });

  if (!options.suppressRealtime) {
    await realtime.emitPopulatedBookingEvent(booking, 'booking:assigned');
  }

  return booking;
};

const requeueBooking = async (booking, driver, note = 'Driver rejected booking') => {
  const rejectedDriverId = driver?._id;
  if (driver) {
    driver.lifecycleStatus = DRIVER_STATUS.ACTIVE;
    await driver.save();
    await recordAssignmentAttempt({ booking: booking._id, driver: driver._id, status: 'REJECTED', note });
  }

  setBookingStatus(booking, BOOKING_STATUS.PENDING_ASSIGNMENT, { note });
  booking.assignedDriver = undefined;
  await booking.save();
  const rejectedPayload = await realtime.emitPopulatedBookingEvent(booking, 'booking:rejected');
  if (rejectedDriverId) {
    realtime.emitToDriver(rejectedDriverId, 'booking:rejected', rejectedPayload);
  }
  return assignAvailableDriver(booking, { excludeDriverIds: driver ? [driver._id] : [] });
};

const retryAssignment = async (bookingId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) return null;
  return assignAvailableDriver(booking);
};

const reassignBooking = async (booking, { actor } = {}) => {
  const previousDriverId = booking.assignedDriver;
  if (previousDriverId) {
    await DriverProfile.findByIdAndUpdate(previousDriverId, { lifecycleStatus: DRIVER_STATUS.ACTIVE });
    await recordAssignmentAttempt({
      booking: booking._id,
      driver: previousDriverId,
      status: 'REJECTED',
      note: 'Admin reassigned booking'
    });
  }

  setBookingStatus(booking, BOOKING_STATUS.PENDING_ASSIGNMENT, { actor, note: 'Admin requested reassignment' });
  booking.assignedDriver = undefined;
  await booking.save();
  const updated = await assignAvailableDriver(booking, {
    actor,
    excludeDriverIds: previousDriverId ? [previousDriverId] : [],
    note: 'Admin reassignment',
    suppressRealtime: true
  });
  await realtime.emitPopulatedBookingEvent(updated, 'booking:reassigned');
  return updated;
};

module.exports = { assignAvailableDriver, assignQueuedBookingToDriver, reassignBooking, requeueBooking, retryAssignment };

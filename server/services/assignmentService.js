const AssignmentAttempt = require('../models/AssignmentAttempt');
const Booking = require('../models/Booking');
const DriverProfile = require('../models/DriverProfile');
const { BOOKING_STATUS, DRIVER_APPROVAL_STATUS, DRIVER_STATUS } = require('../constants/statuses');

const recordAssignmentAttempt = async (payload) => {
  try {
    await AssignmentAttempt.create(payload);
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Failed to record assignment attempt', error);
    }
  }
};

const assignAvailableDriver = async (booking) => {
  const driver = await DriverProfile.findOne({
    approvalStatus: DRIVER_APPROVAL_STATUS.APPROVED,
    lifecycleStatus: DRIVER_STATUS.ACTIVE
  }).sort({ updatedAt: 1, createdAt: 1 });

  if (!driver) {
    booking.status = BOOKING_STATUS.QUEUED;
    booking.assignedDriver = undefined;
    await booking.save();
    await recordAssignmentAttempt({ booking: booking._id, status: 'NO_DRIVER', note: 'No approved active driver available' });
    return booking;
  }

  booking.status = BOOKING_STATUS.DRIVER_ASSIGNED;
  booking.assignedDriver = driver._id;
  await booking.save();

  driver.lifecycleStatus = DRIVER_STATUS.ASSIGNED;
  await driver.save();

  await recordAssignmentAttempt({ booking: booking._id, driver: driver._id, status: 'ASSIGNED' });
  return booking;
};

const requeueBooking = async (booking, driver, note = 'Driver rejected booking') => {
  if (driver) {
    driver.lifecycleStatus = DRIVER_STATUS.ACTIVE;
    await driver.save();
    await recordAssignmentAttempt({ booking: booking._id, driver: driver._id, status: 'REJECTED', note });
  }

  booking.status = BOOKING_STATUS.PENDING_ASSIGNMENT;
  booking.assignedDriver = undefined;
  await booking.save();
  return assignAvailableDriver(booking);
};

const retryAssignment = async (bookingId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) return null;
  return assignAvailableDriver(booking);
};

module.exports = { assignAvailableDriver, requeueBooking, retryAssignment };

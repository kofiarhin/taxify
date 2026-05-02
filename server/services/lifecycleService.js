const Booking = require("../models/Booking");
const CommissionStatement = require("../models/CommissionStatement");
const DriverProfile = require("../models/DriverProfile");
const { env } = require("../config/env");
const {
  BOOKING_STATUSES,
  COMMISSION_STATUSES,
  DRIVER_STATUSES,
} = require("../constants/statuses");
const { ApiError } = require("../utils/apiError");

const AUTO_SUSPENSION_REASON = "Overdue commission payment";
const AUTO_DEACTIVATION_REASON = "Long-term overdue commission payment";
const DAY_MS = 24 * 60 * 60 * 1000;

const ACTIVE_BOOKING_STATUSES = [
  BOOKING_STATUSES.ASSIGNED,
  BOOKING_STATUSES.ACCEPTED,
  BOOKING_STATUSES.IN_PROGRESS,
  BOOKING_STATUSES.PAYMENT_PENDING,
];

const UNPAID_COMMISSION_STATUSES = [
  COMMISSION_STATUSES.DUE,
  COMMISSION_STATUSES.SUBMITTED,
  COMMISSION_STATUSES.APPROVED,
  COMMISSION_STATUSES.REJECTED,
];

function getDaysOverdue(dueDate, now) {
  return Math.floor((now.getTime() - dueDate.getTime()) / DAY_MS);
}

function isAutoSuspended(driver) {
  return (
    driver.status === DRIVER_STATUSES.SUSPENDED &&
    driver.suspensionReason === AUTO_SUSPENSION_REASON
  );
}

function isAutoDeactivated(driver) {
  return (
    driver.status === DRIVER_STATUSES.DEACTIVATED &&
    driver.deactivationReason === AUTO_DEACTIVATION_REASON
  );
}

function getEligibleDriverQuery(excludeDriverIds = []) {
  return {
    status: DRIVER_STATUSES.ACTIVE,
    ...(excludeDriverIds.length > 0 ? { _id: { $nin: excludeDriverIds } } : {}),
  };
}

async function hasOtherActiveBooking(driverId, excludedBookingId = null) {
  return Boolean(
    await Booking.exists({
      ...(excludedBookingId ? { _id: { $ne: excludedBookingId } } : {}),
      assignedDriverId: driverId,
      status: { $in: ACTIVE_BOOKING_STATUSES },
    })
  );
}

async function clearStaleCurrentAssignment(driver) {
  if (!driver.currentAssignmentId) {
    return driver;
  }

  const hasActiveBooking = await hasOtherActiveBooking(driver._id);
  if (!hasActiveBooking) {
    driver.currentAssignmentId = null;
    await driver.save();
  }

  return driver;
}

function normalizeLifecycleOptions(options = {}) {
  if (options instanceof Date) {
    return { now: options };
  }
  return options;
}

async function applyCommissionLifecycleRules(driver, options = {}) {
  const normalizedOptions = normalizeLifecycleOptions(options);
  const now = normalizedOptions.now ?? new Date();

  if (!driver) {
    throw new ApiError(404, "Driver profile not found");
  }

  if (driver.status === DRIVER_STATUSES.DEACTIVATED && !isAutoDeactivated(driver)) {
    return driver;
  }

  const overdueStatement = await CommissionStatement.findOne({
    driverId: driver._id,
    status: { $in: UNPAID_COMMISSION_STATUSES },
    balanceDue: { $gt: 0 },
    dueDate: { $lte: now },
  })
    .sort({ dueDate: 1 })
    .lean();

  if (overdueStatement) {
    const daysOverdue = getDaysOverdue(overdueStatement.dueDate, now);

    if (daysOverdue >= env.COMMISSION_DEACTIVATE_AFTER_DAYS) {
      driver.status = DRIVER_STATUSES.DEACTIVATED;
      driver.deactivatedAt = driver.deactivatedAt ?? now;
      driver.deactivationReason = AUTO_DEACTIVATION_REASON;
      driver.currentAssignmentId = null;
      await driver.save();
      return driver;
    }

    if (daysOverdue >= env.COMMISSION_SUSPEND_AFTER_DAYS) {
      driver.status = DRIVER_STATUSES.SUSPENDED;
      driver.suspendedAt = driver.suspendedAt ?? now;
      driver.suspensionReason = AUTO_SUSPENSION_REASON;
      await driver.save();
      return driver;
    }
  }

  if (isAutoSuspended(driver) || isAutoDeactivated(driver)) {
    driver.status = DRIVER_STATUSES.ACTIVE;
    driver.suspendedAt = null;
    driver.suspensionReason = "";
    if (isAutoDeactivated(driver)) {
      driver.deactivatedAt = null;
      driver.deactivationReason = "";
    }
    await driver.save();
  }

  return driver;
}

async function evaluateDriverLifecycle(driverId, options = {}) {
  const normalizedOptions = normalizeLifecycleOptions(options);
  const driver = await DriverProfile.findById(driverId);
  if (!driver) throw new ApiError(404, "Driver profile not found");

  await applyCommissionLifecycleRules(driver, normalizedOptions);
  return clearStaleCurrentAssignment(driver);
}

async function evaluateAllDriverLifecycles(options = {}) {
  const normalizedOptions = normalizeLifecycleOptions(options);
  const drivers = await DriverProfile.find();
  const summary = {
    driversChecked: drivers.length,
    driversSuspended: 0,
    driversDeactivated: 0,
    errors: [],
  };

  for (const driver of drivers) {
    const previousStatus = driver.status;
    try {
      const evaluated = await applyCommissionLifecycleRules(driver, normalizedOptions);
      if (
        previousStatus !== DRIVER_STATUSES.SUSPENDED &&
        evaluated.status === DRIVER_STATUSES.SUSPENDED
      ) {
        summary.driversSuspended += 1;
      }
      if (
        previousStatus !== DRIVER_STATUSES.DEACTIVATED &&
        evaluated.status === DRIVER_STATUSES.DEACTIVATED
      ) {
        summary.driversDeactivated += 1;
      }
      await clearStaleCurrentAssignment(evaluated);
    } catch (error) {
      summary.errors.push({ driverId: driver._id.toString(), message: error.message });
    }
  }

  return summary;
}

async function isDriverEligibleForDispatch(driver, options = {}) {
  const normalizedOptions = normalizeLifecycleOptions(options);
  const evaluated = await evaluateDriverLifecycle(driver._id, normalizedOptions);

  if (evaluated.status !== DRIVER_STATUSES.ACTIVE) {
    return false;
  }

  if (evaluated.currentAssignmentId) {
    return false;
  }

  return !(await hasOtherActiveBooking(evaluated._id));
}

async function setDriverBusy(driverProfileId) {
  const driver = await DriverProfile.findById(driverProfileId);
  if (!driver) throw new ApiError(404, "Driver profile not found");
  driver.status = DRIVER_STATUSES.BUSY;
  await driver.save();
  return driver;
}

async function returnDriverToAvailable(driverProfileId) {
  const driver = await DriverProfile.findById(driverProfileId);
  if (!driver) throw new ApiError(404, "Driver profile not found");

  if (
    driver.status !== DRIVER_STATUSES.SUSPENDED &&
    driver.status !== DRIVER_STATUSES.DEACTIVATED
  ) {
    driver.status = DRIVER_STATUSES.ACTIVE;
  }
  driver.currentAssignmentId = null;
  driver.lastAssignedAt = new Date();
  await driver.save();
  return evaluateDriverLifecycle(driver._id);
}

async function releaseDriverFromAssignment(driverProfileId, assignmentId = null, options = {}) {
  const normalizedOptions = normalizeLifecycleOptions(options);
  const driver = await DriverProfile.findById(driverProfileId);
  if (!driver) throw new ApiError(404, "Driver profile not found");

  if (
    assignmentId &&
    driver.currentAssignmentId &&
    driver.currentAssignmentId.toString() !== assignmentId.toString()
  ) {
    return evaluateDriverLifecycle(driver._id, normalizedOptions);
  }

  driver.currentAssignmentId = null;
  if (
    driver.status !== DRIVER_STATUSES.SUSPENDED &&
    driver.status !== DRIVER_STATUSES.DEACTIVATED &&
    !(await hasOtherActiveBooking(driver._id, normalizedOptions.excludedBookingId))
  ) {
    driver.status = DRIVER_STATUSES.ACTIVE;
  }
  await driver.save();
  return evaluateDriverLifecycle(driver._id, normalizedOptions);
}

async function clearDriverAssignment(driverProfileId) {
  await DriverProfile.findByIdAndUpdate(driverProfileId, {
    currentAssignmentId: null,
  });
}

module.exports = {
  ACTIVE_BOOKING_STATUSES,
  AUTO_DEACTIVATION_REASON,
  AUTO_SUSPENSION_REASON,
  UNPAID_COMMISSION_STATUSES,
  applyCommissionLifecycleRules,
  clearDriverAssignment,
  evaluateAllDriverLifecycles,
  evaluateDriverLifecycle,
  getEligibleDriverQuery,
  hasOtherActiveBooking,
  isDriverEligibleForDispatch,
  normalizeLifecycleOptions,
  releaseDriverFromAssignment,
  returnDriverToAvailable,
  setDriverBusy,
  syncDriverSuspension: evaluateDriverLifecycle,
};

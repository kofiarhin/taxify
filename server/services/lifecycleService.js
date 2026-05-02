const Booking = require("../models/Booking");
const AssignmentAttempt = require("../models/AssignmentAttempt");
const DriverProfile = require("../models/DriverProfile");
const { env } = require("../config/env");
const {
  ASSIGNMENT_STATUSES,
  BOOKING_STATUSES,
  DRIVER_STATUSES,
  LIFECYCLE_REASONS,
} = require("../constants/statuses");
const { ApiError } = require("../utils/apiError");
const { getDriverCommissionDebtState } = require("./commissionDebtService");

const AUTO_SUSPENSION_REASON = "Overdue commission payment";
const AUTO_DEACTIVATION_REASON = "Long-term overdue commission payment";

const ACTIVE_BOOKING_STATUSES = [
  BOOKING_STATUSES.ASSIGNED,
  BOOKING_STATUSES.ACCEPTED,
  BOOKING_STATUSES.IN_PROGRESS,
  BOOKING_STATUSES.PAYMENT_PENDING,
];

const ACTIVE_ASSIGNMENT_STATUSES = [
  ASSIGNMENT_STATUSES.PENDING,
  ASSIGNMENT_STATUSES.ACCEPTED,
];

const UNPAID_COMMISSION_STATUSES = require("./commissionDebtService")
  .OUTSTANDING_COMMISSION_STATUSES;

function isCommissionSuspended(driver) {
  return (
    driver.status === DRIVER_STATUSES.SUSPENDED &&
    (driver.lifecycleReason === LIFECYCLE_REASONS.COMMISSION_OVERDUE ||
      driver.suspensionReason === AUTO_SUSPENSION_REASON)
  );
}

function isCommissionDeactivated(driver) {
  return (
    driver.status === DRIVER_STATUSES.DEACTIVATED &&
    (driver.lifecycleReason === LIFECYCLE_REASONS.COMMISSION_LONG_OVERDUE ||
      driver.deactivationReason === AUTO_DEACTIVATION_REASON)
  );
}

function isManualLifecycleBlock(driver) {
  if (driver.status === DRIVER_STATUSES.PENDING_APPROVAL) return true;
  if (driver.status === DRIVER_STATUSES.SUSPENDED && !isCommissionSuspended(driver)) {
    return true;
  }
  if (driver.status === DRIVER_STATUSES.DEACTIVATED && !isCommissionDeactivated(driver)) {
    return true;
  }
  return false;
}

function getEligibleDriverQuery(excludeDriverIds = []) {
  return {
    status: DRIVER_STATUSES.ACTIVE,
    lifecycleReason: { $in: [null, LIFECYCLE_REASONS.NONE] },
    ...(excludeDriverIds.length > 0 ? { _id: { $nin: excludeDriverIds } } : {}),
  };
}

function normalizeLifecycleOptions(options = {}) {
  if (options instanceof Date) {
    return { now: options };
  }
  return options;
}

function getLifecycleConfig(options = {}) {
  return {
    now: options.now ?? new Date(),
    suspendAfterDays:
      options.suspendAfterDays ?? env.COMMISSION_SUSPEND_AFTER_DAYS,
    deactivateAfterDays:
      options.deactivateAfterDays ?? env.COMMISSION_DEACTIVATE_AFTER_DAYS,
  };
}

function getDriverLifecycleState(driver, commissionSummary, config = {}) {
  const now = config.now ?? new Date();

  if (isManualLifecycleBlock(driver)) {
    return {
      status: driver.status,
      lifecycleReason:
        driver.lifecycleReason && driver.lifecycleReason !== LIFECYCLE_REASONS.NONE
          ? driver.lifecycleReason
          : LIFECYCLE_REASONS.MANUAL,
      clearAssignment: driver.status === DRIVER_STATUSES.DEACTIVATED,
      restoreAvailability: false,
      suspensionReason: driver.suspensionReason ?? "",
      deactivationReason: driver.deactivationReason ?? "",
    };
  }

  if (commissionSummary.hasDeactivateLevelDebt) {
    return {
      status: DRIVER_STATUSES.DEACTIVATED,
      lifecycleReason: LIFECYCLE_REASONS.COMMISSION_LONG_OVERDUE,
      clearAssignment: true,
      restoreAvailability: false,
      deactivatedAt: driver.deactivatedAt ?? now,
      deactivationReason: AUTO_DEACTIVATION_REASON,
      suspendedAt: driver.suspendedAt ?? null,
      suspensionReason: driver.suspensionReason ?? "",
    };
  }

  if (commissionSummary.hasSuspendLevelDebt) {
    return {
      status: DRIVER_STATUSES.SUSPENDED,
      lifecycleReason: LIFECYCLE_REASONS.COMMISSION_OVERDUE,
      clearAssignment: false,
      restoreAvailability: false,
      suspendedAt: driver.suspendedAt ?? now,
      suspensionReason: AUTO_SUSPENSION_REASON,
      deactivatedAt: driver.deactivatedAt ?? null,
      deactivationReason: driver.deactivationReason ?? "",
    };
  }

  if (isCommissionSuspended(driver) || isCommissionDeactivated(driver)) {
    return {
      status: DRIVER_STATUSES.ACTIVE,
      lifecycleReason: LIFECYCLE_REASONS.NONE,
      clearAssignment: false,
      restoreAvailability: true,
      suspendedAt: null,
      suspensionReason: "",
      deactivatedAt: null,
      deactivationReason: "",
    };
  }

  return {
    status: driver.status,
    lifecycleReason: driver.lifecycleReason ?? LIFECYCLE_REASONS.NONE,
    clearAssignment: false,
    restoreAvailability: false,
    suspendedAt: driver.suspendedAt ?? null,
    suspensionReason: driver.suspensionReason ?? "",
    deactivatedAt: driver.deactivatedAt ?? null,
    deactivationReason: driver.deactivationReason ?? "",
  };
}

async function hasOtherActiveBooking(driverId, excludedBookingId = null, options = {}) {
  const query = Booking.exists({
    ...(excludedBookingId ? { _id: { $ne: excludedBookingId } } : {}),
    assignedDriverId: driverId,
    status: { $in: ACTIVE_BOOKING_STATUSES },
  });
  if (options.session) query.session(options.session);
  return Boolean(await query);
}

async function hasActiveAssignment(driverId, excludedAssignmentId = null, options = {}) {
  const query = AssignmentAttempt.exists({
    ...(excludedAssignmentId ? { _id: { $ne: excludedAssignmentId } } : {}),
    driverId,
    status: { $in: ACTIVE_ASSIGNMENT_STATUSES },
  });
  if (options.session) query.session(options.session);
  return Boolean(await query);
}

async function canRestoreDriverAvailability(driver, options = {}) {
  if (
    driver.status === DRIVER_STATUSES.SUSPENDED ||
    driver.status === DRIVER_STATUSES.DEACTIVATED ||
    isManualLifecycleBlock(driver)
  ) {
    return false;
  }

  const [hasBooking, hasAssignment] = await Promise.all([
    hasOtherActiveBooking(driver._id, options.excludedBookingId, options),
    hasActiveAssignment(driver._id, options.excludedAssignmentId, options),
  ]);

  return !hasBooking && !hasAssignment;
}

async function clearStaleCurrentAssignment(driver, options = {}) {
  if (!driver.currentAssignmentId) {
    return driver;
  }

  const [hasBooking, hasAssignment] = await Promise.all([
    hasOtherActiveBooking(driver._id, null, options),
    hasActiveAssignment(driver._id, driver.currentAssignmentId, options),
  ]);

  if (!hasBooking && !hasAssignment) {
    driver.currentAssignmentId = null;
    await driver.save({ session: options.session });
  }

  return driver;
}

function applyLifecycleStateToDriver(driver, state) {
  driver.status = state.status;
  driver.lifecycleReason = state.lifecycleReason;

  if (state.suspendedAt !== undefined) driver.suspendedAt = state.suspendedAt;
  if (state.suspensionReason !== undefined) {
    driver.suspensionReason = state.suspensionReason;
  }
  if (state.deactivatedAt !== undefined) driver.deactivatedAt = state.deactivatedAt;
  if (state.deactivationReason !== undefined) {
    driver.deactivationReason = state.deactivationReason;
  }
  if (state.clearAssignment) {
    driver.currentAssignmentId = null;
  }
}

async function applyCommissionLifecycleRules(driver, options = {}) {
  const normalizedOptions = normalizeLifecycleOptions(options);
  const config = getLifecycleConfig(normalizedOptions);

  if (!driver) {
    throw new ApiError(404, "Driver profile not found");
  }

  const commissionSummary =
    normalizedOptions.commissionSummary ??
    (await getDriverCommissionDebtState(driver._id, {
      ...config,
      session: normalizedOptions.session,
    }));
  const nextState = getDriverLifecycleState(driver, commissionSummary, config);

  applyLifecycleStateToDriver(driver, nextState);
  await driver.save({ session: normalizedOptions.session });
  return driver;
}

async function evaluateDriverLifecycle(driverId, options = {}) {
  const normalizedOptions = normalizeLifecycleOptions(options);
  const query = DriverProfile.findById(driverId);
  if (normalizedOptions.session) query.session(normalizedOptions.session);
  const driver = await query;
  if (!driver) throw new ApiError(404, "Driver profile not found");

  await applyCommissionLifecycleRules(driver, normalizedOptions);
  return clearStaleCurrentAssignment(driver, normalizedOptions);
}

async function evaluateAllDriverLifecycles(options = {}) {
  const normalizedOptions = normalizeLifecycleOptions(options);
  const query = DriverProfile.find();
  if (normalizedOptions.session) query.session(normalizedOptions.session);
  const drivers = await query;
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
      await clearStaleCurrentAssignment(evaluated, normalizedOptions);
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

  if (evaluated.lifecycleReason && evaluated.lifecycleReason !== LIFECYCLE_REASONS.NONE) {
    return false;
  }

  if (evaluated.currentAssignmentId) {
    return false;
  }

  const [hasBooking, hasAssignment] = await Promise.all([
    hasOtherActiveBooking(evaluated._id, null, normalizedOptions),
    hasActiveAssignment(evaluated._id, null, normalizedOptions),
  ]);

  return !hasBooking && !hasAssignment;
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

  if (!isManualLifecycleBlock(driver)) {
    driver.status = DRIVER_STATUSES.ACTIVE;
    driver.lifecycleReason = driver.lifecycleReason ?? LIFECYCLE_REASONS.NONE;
  }
  driver.currentAssignmentId = null;
  driver.lastAssignedAt = new Date();
  await driver.save();
  return evaluateDriverLifecycle(driver._id);
}

async function releaseDriverFromAssignment(driverProfileId, assignmentId = null, options = {}) {
  const normalizedOptions = normalizeLifecycleOptions(options);
  const query = DriverProfile.findById(driverProfileId);
  if (normalizedOptions.session) query.session(normalizedOptions.session);
  const driver = await query;
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
    await canRestoreDriverAvailability(driver, {
      ...normalizedOptions,
      excludedAssignmentId: assignmentId,
    })
  ) {
    driver.status = DRIVER_STATUSES.ACTIVE;
    driver.lifecycleReason = driver.lifecycleReason ?? LIFECYCLE_REASONS.NONE;
  }
  await driver.save({ session: normalizedOptions.session });
  return evaluateDriverLifecycle(driver._id, normalizedOptions);
}

async function clearDriverAssignment(driverProfileId) {
  await DriverProfile.findByIdAndUpdate(driverProfileId, {
    currentAssignmentId: null,
  });
}

module.exports = {
  ACTIVE_ASSIGNMENT_STATUSES,
  ACTIVE_BOOKING_STATUSES,
  AUTO_DEACTIVATION_REASON,
  AUTO_SUSPENSION_REASON,
  UNPAID_COMMISSION_STATUSES,
  applyCommissionLifecycleRules,
  canRestoreDriverAvailability,
  clearDriverAssignment,
  evaluateAllDriverLifecycles,
  evaluateDriverLifecycle,
  getDriverLifecycleState,
  getEligibleDriverQuery,
  hasActiveAssignment,
  hasOtherActiveBooking,
  isDriverEligibleForDispatch,
  normalizeLifecycleOptions,
  releaseDriverFromAssignment,
  returnDriverToAvailable,
  setDriverBusy,
  syncDriverSuspension: evaluateDriverLifecycle,
};

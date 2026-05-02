const DriverProfile = require("../models/DriverProfile");
const CommissionStatement = require("../models/CommissionStatement");
const { env } = require("../config/env");
const { DRIVER_STATUSES, COMMISSION_STATUSES } = require("../constants/statuses");
const { ApiError } = require("../utils/apiError");

const AUTO_SUSPENSION_REASON = "Overdue commission payment";
const AUTO_DEACTIVATION_REASON = "Long-term overdue commission payment";
const DAY_MS = 24 * 60 * 60 * 1000;

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

  if (driver.status === DRIVER_STATUSES.DEACTIVATED) {
    return driver;
  }

  if (driver.status !== DRIVER_STATUSES.SUSPENDED) {
    driver.status = DRIVER_STATUSES.ACTIVE;
  }
  driver.currentAssignmentId = null;
  driver.lastAssignedAt = new Date();
  await driver.save();
  return syncDriverSuspension(driver._id);
}

async function releaseDriverFromAssignment(driverProfileId, assignmentId = null) {
  const driver = await DriverProfile.findById(driverProfileId);
  if (!driver) throw new ApiError(404, "Driver profile not found");

  if (
    assignmentId &&
    driver.currentAssignmentId &&
    driver.currentAssignmentId.toString() !== assignmentId.toString()
  ) {
    return driver;
  }

  driver.currentAssignmentId = null;
  if (driver.status === DRIVER_STATUSES.BUSY) {
    await driver.save();
    return driver;
  }
  if (driver.status !== DRIVER_STATUSES.SUSPENDED && driver.status !== DRIVER_STATUSES.DEACTIVATED) {
    driver.status = DRIVER_STATUSES.ACTIVE;
  }
  await driver.save();
  return syncDriverSuspension(driver._id);
}

function getDaysOverdue(dueDate, now) {
  return Math.floor((now.getTime() - dueDate.getTime()) / DAY_MS);
}

async function evaluateDriverLifecycle(driverProfileId, now = new Date()) {
  const driver = await DriverProfile.findById(driverProfileId);
  if (!driver) throw new ApiError(404, "Driver profile not found");

  if (driver.status === DRIVER_STATUSES.DEACTIVATED) {
    return driver;
  }

  const overdueStatement = await CommissionStatement.findOne({
    driverId: driverProfileId,
    status: {
      $in: [
        COMMISSION_STATUSES.DUE,
        COMMISSION_STATUSES.SUBMITTED,
        COMMISSION_STATUSES.APPROVED,
        COMMISSION_STATUSES.REJECTED,
      ],
    },
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

    if (daysOverdue < env.COMMISSION_SUSPEND_AFTER_DAYS) {
      if (
        driver.status === DRIVER_STATUSES.SUSPENDED &&
        driver.suspensionReason === AUTO_SUSPENSION_REASON
      ) {
        driver.status = DRIVER_STATUSES.ACTIVE;
        driver.suspendedAt = null;
        driver.suspensionReason = "";
        await driver.save();
      }
      return driver;
    }

    driver.status = DRIVER_STATUSES.SUSPENDED;
    driver.suspendedAt = driver.suspendedAt ?? now;
    driver.suspensionReason = AUTO_SUSPENSION_REASON;
    await driver.save();
    return driver;
  }

  if (
    driver.status === DRIVER_STATUSES.SUSPENDED &&
    driver.suspensionReason === AUTO_SUSPENSION_REASON
  ) {
    driver.status = DRIVER_STATUSES.ACTIVE;
    driver.suspendedAt = null;
    driver.suspensionReason = "";
    await driver.save();
  }

  return driver;
}

const syncDriverSuspension = evaluateDriverLifecycle;

async function clearDriverAssignment(driverProfileId) {
  await DriverProfile.findByIdAndUpdate(driverProfileId, {
    currentAssignmentId: null,
  });
}

module.exports = {
  AUTO_SUSPENSION_REASON,
  AUTO_DEACTIVATION_REASON,
  setDriverBusy,
  returnDriverToAvailable,
  releaseDriverFromAssignment,
  clearDriverAssignment,
  evaluateDriverLifecycle,
  syncDriverSuspension,
};

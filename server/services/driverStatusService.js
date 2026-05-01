const DriverProfile = require("../models/DriverProfile");
const CommissionStatement = require("../models/CommissionStatement");
const { DRIVER_STATUSES } = require("../constants/statuses");
const { ApiError } = require("../utils/apiError");

const AUTO_SUSPENSION_REASON = "Overdue commission payment";

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
    return driver;
  }
  if (driver.status !== DRIVER_STATUSES.SUSPENDED && driver.status !== DRIVER_STATUSES.DEACTIVATED) {
    driver.status = DRIVER_STATUSES.ACTIVE;
  }
  await driver.save();
  return syncDriverSuspension(driver._id);
}

async function syncDriverSuspension(driverProfileId, now = new Date()) {
  const driver = await DriverProfile.findById(driverProfileId);
  if (!driver) throw new ApiError(404, "Driver profile not found");

  if (driver.status === DRIVER_STATUSES.DEACTIVATED) {
    return driver;
  }

  const overdueStatement = await CommissionStatement.findOne({
    driverId: driverProfileId,
    status: { $in: ["DUE", "SUBMITTED", "APPROVED", "REJECTED"] },
    balanceDue: { $gt: 0 },
    dueDate: { $lt: now },
  })
    .sort({ dueDate: 1 })
    .lean();

  if (overdueStatement) {
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

async function clearDriverAssignment(driverProfileId) {
  await DriverProfile.findByIdAndUpdate(driverProfileId, {
    currentAssignmentId: null,
  });
}

module.exports = {
  AUTO_SUSPENSION_REASON,
  setDriverBusy,
  returnDriverToAvailable,
  releaseDriverFromAssignment,
  clearDriverAssignment,
  syncDriverSuspension,
};

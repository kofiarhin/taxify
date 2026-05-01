const DriverProfile = require("../models/DriverProfile");
const { DRIVER_STATUSES } = require("../constants/statuses");
const { ApiError } = require("../utils/apiError");

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
    driver.status === DRIVER_STATUSES.SUSPENDED ||
    driver.status === DRIVER_STATUSES.DEACTIVATED
  ) {
    return driver;
  }

  driver.status =
    driver.commissionDebt > 0 ? DRIVER_STATUSES.SUSPENDED : DRIVER_STATUSES.ACTIVE;
  driver.currentAssignmentId = null;
  driver.lastAssignedAt = new Date();
  await driver.save();
  return driver;
}

async function clearDriverAssignment(driverProfileId) {
  await DriverProfile.findByIdAndUpdate(driverProfileId, {
    currentAssignmentId: null,
  });
}

module.exports = { setDriverBusy, returnDriverToAvailable, clearDriverAssignment };

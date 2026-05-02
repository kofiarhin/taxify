const { env } = require("../config/env");
const { ApiError } = require("../utils/apiError");

function roundMoney(value) {
  return Number(value.toFixed(2));
}

function assertNonNegativeNumber(value, fieldName) {
  if (value === undefined || value === null) {
    return;
  }

  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    throw new ApiError(400, `${fieldName} must be a non-negative number`);
  }
}

function calculateFare({
  durationMinutes,
  distanceKm = null,
  manualFare = null,
  fareNotes = "",
} = {}) {
  assertNonNegativeNumber(durationMinutes, "durationMinutes");
  assertNonNegativeNumber(distanceKm, "distanceKm");
  assertNonNegativeNumber(manualFare, "manualFare");

  if (manualFare !== null && manualFare !== undefined) {
    return {
      fare: roundMoney(manualFare),
      isManualOverride: true,
      fareNotes,
      breakdown: {
        baseFare: 0,
        durationFare: 0,
        distanceFare: 0,
        manualFare: roundMoney(manualFare),
      },
    };
  }

  const safeDuration = durationMinutes ?? 0;
  const safeDistance = distanceKm ?? 0;
  const baseFare = env.FARE_BASE;
  const durationFare = safeDuration * env.FARE_PER_MINUTE;
  const distanceFare = safeDistance * env.FARE_PER_KM;

  return {
    fare: roundMoney(baseFare + durationFare + distanceFare),
    isManualOverride: false,
    fareNotes,
    breakdown: {
      baseFare: roundMoney(baseFare),
      durationFare: roundMoney(durationFare),
      distanceFare: roundMoney(distanceFare),
      manualFare: null,
    },
  };
}

module.exports = {
  calculateFare,
};

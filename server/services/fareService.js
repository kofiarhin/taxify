const env = require('../config/env');

const calculateFare = ({ distanceKm, durationMinutes }) => {
  const baseFare = env.FARE_BASE;
  const perKm = env.FARE_PER_KM;
  const perMinute = env.FARE_PER_MINUTE;
  const total = baseFare + Number(distanceKm) * perKm + Number(durationMinutes) * perMinute;

  return {
    baseFare,
    perKm,
    perMinute,
    total: Number(total.toFixed(2))
  };
};

module.exports = { calculateFare };

const env = require('../config/env');
const CommissionStatement = require('../models/CommissionStatement');

const monthKey = (date = new Date()) => date.toISOString().slice(0, 7);

const createCommissionForBooking = async (booking) => {
  if (!booking.assignedDriver || !booking.fare?.total) return null;
  const commissionAmount = Number((booking.fare.total * env.COMMISSION_RATE).toFixed(2));

  return CommissionStatement.findOneAndUpdate(
    { booking: booking._id },
    {
      booking: booking._id,
      driver: booking.assignedDriver,
      month: monthKey(booking.completedAt || new Date()),
      fareTotal: booking.fare.total,
      commissionRate: env.COMMISSION_RATE,
      commissionAmount
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

module.exports = { createCommissionForBooking, monthKey };

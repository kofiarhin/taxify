const Booking = require('../models/Booking');
const CommissionStatement = require('../models/CommissionStatement');
const DriverProfile = require('../models/DriverProfile');
const { BOOKING_STATUS, DRIVER_APPROVAL_STATUS, DRIVER_STATUS } = require('../constants/statuses');
const asyncHandler = require('../utils/asyncHandler');

const adminSummary = asyncHandler(async (_req, res) => {
  const [
    totalBookings,
    completedBookings,
    cancelledBookings,
    disputedBookings,
    queuedBookings,
    revenueAgg,
    commissionAgg,
    activeDrivers,
    pendingDriverApprovals,
    ratingAgg
  ] = await Promise.all([
    Booking.countDocuments(),
    Booking.countDocuments({ status: BOOKING_STATUS.COMPLETED }),
    Booking.countDocuments({ status: BOOKING_STATUS.CANCELLED }),
    Booking.countDocuments({ status: BOOKING_STATUS.DISPUTED }),
    Booking.countDocuments({ status: BOOKING_STATUS.QUEUED }),
    Booking.aggregate([{ $match: { status: BOOKING_STATUS.COMPLETED } }, { $group: { _id: null, total: { $sum: '$fare.total' } } }]),
    CommissionStatement.aggregate([{ $group: { _id: null, total: { $sum: '$commissionAmount' } } }]),
    DriverProfile.countDocuments({ approvalStatus: DRIVER_APPROVAL_STATUS.APPROVED, lifecycleStatus: DRIVER_STATUS.ACTIVE }),
    DriverProfile.countDocuments({ approvalStatus: DRIVER_APPROVAL_STATUS.PENDING }),
    DriverProfile.aggregate([
      { $match: { reviewCount: { $gt: 0 } } },
      { $group: { _id: null, average: { $avg: '$ratingAverage' } } }
    ])
  ]);

  res.json({
    summary: {
      totalBookings,
      completedBookings,
      cancelledBookings,
      disputedBookings,
      queuedBookings,
      totalRevenue: Number((revenueAgg[0]?.total || 0).toFixed(2)),
      totalCommission: Number((commissionAgg[0]?.total || 0).toFixed(2)),
      activeDrivers,
      pendingDriverApprovals,
      averageDriverRating: ratingAgg[0]?.average ? Number(ratingAgg[0].average.toFixed(2)) : null
    }
  });
});

module.exports = { adminSummary };

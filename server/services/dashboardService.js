const Booking = require("../models/Booking");
const Trip = require("../models/Trip");
const DriverProfile = require("../models/DriverProfile");
const Complaint = require("../models/Complaint");
const CommissionStatement = require("../models/CommissionStatement");
const { BOOKING_STATUSES, DRIVER_STATUSES, COMPLAINT_STATUSES, COMMISSION_STATUSES } = require("../constants/statuses");

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

async function getSummary() {
  const today = startOfDay();
  const todayEnd = endOfDay();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [
    bookingsToday,
    activeTrips,
    completedToday,
    queueCount,
    cashToday,
    openComplaints,
    suspendedDrivers,
    totalDrivers,
    commissionDue,
    acceptanceStats,
  ] = await Promise.all([
    Booking.countDocuments({ createdAt: { $gte: today, $lte: todayEnd } }),
    Booking.countDocuments({ status: { $in: [BOOKING_STATUSES.IN_PROGRESS, BOOKING_STATUSES.TRIP_IN_PROGRESS] } }),
    Booking.countDocuments({
      status: { $in: [BOOKING_STATUSES.PAID, BOOKING_STATUSES.COMPLETED] },
      completedAt: { $gte: today, $lte: todayEnd },
    }),
    Booking.countDocuments({ status: BOOKING_STATUSES.QUEUED }),
    Trip.aggregate([
      {
        $match: {
          paymentStatus: "PAID",
          paymentConfirmedAt: { $gte: today, $lte: todayEnd },
        },
      },
      { $group: { _id: null, total: { $sum: "$fare" } } },
    ]),
    Complaint.countDocuments({ status: COMPLAINT_STATUSES.OPEN }),
    DriverProfile.countDocuments({ status: DRIVER_STATUSES.SUSPENDED }),
    DriverProfile.countDocuments({
      status: { $in: [DRIVER_STATUSES.ACTIVE, DRIVER_STATUSES.BUSY, DRIVER_STATUSES.ASSIGNED, DRIVER_STATUSES.ON_TRIP] },
    }),
    CommissionStatement.aggregate([
      {
        $match: {
          periodMonth: currentMonth,
          periodYear: currentYear,
          status: {
            $in: [
              COMMISSION_STATUSES.DUE,
              COMMISSION_STATUSES.SUBMITTED,
              COMMISSION_STATUSES.APPROVED,
              COMMISSION_STATUSES.REJECTED,
            ],
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$balanceDue" } } },
    ]),
    Trip.aggregate([
      {
        $lookup: {
          from: "assignmentattempts",
          localField: "bookingId",
          foreignField: "bookingId",
          as: "attempts",
        },
      },
      { $unwind: "$attempts" },
      {
        $group: {
          _id: "$attempts.status",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const queuedBookings = await Booking.find({ status: BOOKING_STATUSES.QUEUED })
    .select("queueEnteredAt")
    .lean();
  const avgQueueWait =
    queuedBookings.length > 0
      ? Math.round(
          queuedBookings.reduce(
            (sum, b) => sum + (Date.now() - new Date(b.queueEnteredAt).getTime()),
            0
          ) /
            queuedBookings.length /
            60000
        )
      : 0;

  const acceptedCount =
    acceptanceStats.find((s) => s._id === "ACCEPTED")?.count ?? 0;
  const rejectedCount =
    acceptanceStats.find((s) => s._id === "REJECTED")?.count ?? 0;
  const totalResponded = acceptedCount + rejectedCount;

  return {
    bookingsToday,
    activeTrips,
    completedToday,
    queueCount,
    avgQueueWaitMinutes: avgQueueWait,
    driverAcceptanceRate:
      totalResponded > 0 ? Math.round((acceptedCount / totalResponded) * 100) : 0,
    driverRejectionRate:
      totalResponded > 0 ? Math.round((rejectedCount / totalResponded) * 100) : 0,
    cashCollectedToday: cashToday[0]?.total ?? 0,
    commissionDueThisMonth: commissionDue[0]?.total ?? 0,
    suspendedDrivers,
    activeDrivers: totalDrivers,
    openComplaints,
  };
}

module.exports = { getSummary };

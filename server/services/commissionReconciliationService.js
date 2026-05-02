const CommissionStatement = require("../models/CommissionStatement");
const DriverProfile = require("../models/DriverProfile");
const Trip = require("../models/Trip");
const { env } = require("../config/env");
const { COMMISSION_STATUSES } = require("../constants/statuses");
const { evaluateAllDriverLifecycles } = require("./lifecycleService");

function roundMoney(value) {
  return Number((value ?? 0).toFixed(2));
}

function getStatementPeriod(dateValue) {
  const date = new Date(dateValue);
  return {
    month: date.getUTCMonth() + 1,
    year: date.getUTCFullYear(),
  };
}

function getStatementDueDate(periodMonth, periodYear) {
  const monthEnd = new Date(Date.UTC(periodYear, periodMonth, 0, 23, 59, 59, 999));
  monthEnd.setUTCDate(monthEnd.getUTCDate() + env.COMMISSION_PAYMENT_GRACE_DAYS);
  return monthEnd;
}

function normalizeSettlement(statement) {
  statement.balanceDue = Math.max(
    0,
    roundMoney(statement.commissionTotal - statement.amountPaid)
  );
}

async function recalculateDriverDebt(driverId) {
  const [result] = await CommissionStatement.aggregate([
    {
      $match: {
        driverId,
        status: { $ne: COMMISSION_STATUSES.SETTLED },
        balanceDue: { $gt: 0 },
      },
    },
    { $group: { _id: "$driverId", balanceDue: { $sum: "$balanceDue" } } },
  ]);

  await DriverProfile.findByIdAndUpdate(driverId, {
    commissionDebt: roundMoney(result?.balanceDue ?? 0),
  });
}

async function upsertStatementFromTrips(driverId, periodMonth, periodYear, trips) {
  const grossTripRevenue = roundMoney(
    trips.reduce((sum, trip) => sum + (trip.fare ?? 0), 0)
  );
  const commissionTotal = roundMoney(
    trips.reduce(
      (sum, trip) => sum + (trip.commissionAmount ?? (trip.fare ?? 0) * env.COMMISSION_RATE),
      0
    )
  );

  let statement = await CommissionStatement.findOne({
    driverId,
    periodMonth,
    periodYear,
  });

  if (!statement) {
    statement = await CommissionStatement.create({
      driverId,
      periodMonth,
      periodYear,
      tripIds: trips.map((trip) => trip._id),
      grossTripRevenue,
      commissionRate: env.COMMISSION_RATE,
      commissionTotal,
      amountPaid: 0,
      balanceDue: commissionTotal,
      dueDate: getStatementDueDate(periodMonth, periodYear),
      status: commissionTotal > 0 ? COMMISSION_STATUSES.DUE : COMMISSION_STATUSES.SETTLED,
    });
    return { statement, created: true, updated: false };
  }

  const nextTripIds = trips.map((trip) => trip._id);
  const changed =
    statement.grossTripRevenue !== grossTripRevenue ||
    statement.commissionTotal !== commissionTotal ||
    statement.tripIds.length !== nextTripIds.length ||
    statement.tripIds.some((tripId, index) => tripId.toString() !== nextTripIds[index].toString());

  statement.tripIds = nextTripIds;
  statement.grossTripRevenue = grossTripRevenue;
  statement.commissionRate = env.COMMISSION_RATE;
  statement.commissionTotal = commissionTotal;
  normalizeSettlement(statement);

  if (statement.balanceDue === 0 && statement.status !== COMMISSION_STATUSES.SETTLED) {
    statement.status = COMMISSION_STATUSES.SETTLED;
    statement.settledAt = statement.settledAt ?? new Date();
  }
  if (statement.balanceDue > 0 && statement.status === COMMISSION_STATUSES.SETTLED) {
    statement.status = COMMISSION_STATUSES.DUE;
    statement.settledAt = null;
  }

  await statement.save();
  return { statement, created: false, updated: changed };
}

async function reconcileMonthlyCommissions({ now = new Date() } = {}) {
  const summary = {
    driversChecked: 0,
    statementsCreated: 0,
    statementsUpdated: 0,
    driversSuspended: 0,
    driversDeactivated: 0,
    errors: [],
  };

  const paidTrips = await Trip.find({
    paymentStatus: "PAID",
    fare: { $ne: null },
    driverId: { $ne: null },
  }).sort({ paymentConfirmedAt: 1, endedAt: 1 });

  const groups = new Map();
  for (const trip of paidTrips) {
    const { month, year } = getStatementPeriod(
      trip.endedAt ?? trip.paymentConfirmedAt ?? trip.createdAt
    );
    const key = `${trip.driverId.toString()}:${year}:${month}`;
    if (!groups.has(key)) {
      groups.set(key, {
        driverId: trip.driverId,
        periodMonth: month,
        periodYear: year,
        trips: [],
      });
    }
    groups.get(key).trips.push(trip);
  }

  for (const group of groups.values()) {
    try {
      const result = await upsertStatementFromTrips(
        group.driverId,
        group.periodMonth,
        group.periodYear,
        group.trips
      );
      summary.statementsCreated += result.created ? 1 : 0;
      summary.statementsUpdated += result.updated ? 1 : 0;
      await recalculateDriverDebt(group.driverId);
    } catch (error) {
      summary.errors.push({
        driverId: group.driverId.toString(),
        periodMonth: group.periodMonth,
        periodYear: group.periodYear,
        message: error.message,
      });
    }
  }

  const allDrivers = await DriverProfile.find().select("_id");
  for (const driver of allDrivers) {
    await recalculateDriverDebt(driver._id);
  }

  const lifecycleSummary = await evaluateAllDriverLifecycles({ now });
  summary.driversChecked = lifecycleSummary.driversChecked;
  summary.driversSuspended = lifecycleSummary.driversSuspended;
  summary.driversDeactivated = lifecycleSummary.driversDeactivated;
  summary.errors.push(...lifecycleSummary.errors);

  return summary;
}

module.exports = {
  getStatementDueDate,
  getStatementPeriod,
  reconcileMonthlyCommissions,
  recalculateDriverDebt,
  upsertStatementFromTrips,
};

const CommissionStatement = require("../models/CommissionStatement");
const DriverProfile = require("../models/DriverProfile");
const Trip = require("../models/Trip");
const { env } = require("../config/env");
const { COMMISSION_STATUSES } = require("../constants/statuses");
const { ApiError } = require("../utils/apiError");
const { evaluateDriverLifecycle, syncDriverSuspension } = require("./lifecycleService");
const {
  reconcileMonthlyCommissions: reconcileCommissions,
} = require("./commissionReconciliationService");
const { emitDomainEvent } = require("../socket");

const COMMISSION_TRANSITIONS = {
  [COMMISSION_STATUSES.DUE]: [COMMISSION_STATUSES.SUBMITTED],
  [COMMISSION_STATUSES.SUBMITTED]: [
    COMMISSION_STATUSES.APPROVED,
    COMMISSION_STATUSES.REJECTED,
    COMMISSION_STATUSES.SETTLED,
  ],
  [COMMISSION_STATUSES.APPROVED]: [COMMISSION_STATUSES.SETTLED],
  [COMMISSION_STATUSES.REJECTED]: [COMMISSION_STATUSES.SUBMITTED],
  [COMMISSION_STATUSES.SETTLED]: [],
};

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

function assertTransition(currentStatus, nextStatus) {
  const allowedTransitions = COMMISSION_TRANSITIONS[currentStatus] ?? [];
  if (!allowedTransitions.includes(nextStatus)) {
    throw new ApiError(
      400,
      `Invalid commission status transition: ${currentStatus} -> ${nextStatus}`
    );
  }
}

function normalizeSettlement(statement) {
  statement.balanceDue = Math.max(0, Number((statement.commissionTotal - statement.amountPaid).toFixed(2)));
}

function roundMoney(value) {
  return Number(value.toFixed(2));
}

async function reduceDriverDebt(driverId, amount) {
  if (amount <= 0) {
    return;
  }

  const driver = await DriverProfile.findById(driverId);
  if (!driver) {
    throw new ApiError(404, "Driver profile not found");
  }

  driver.commissionDebt = Math.max(0, Number((driver.commissionDebt - amount).toFixed(2)));
  await driver.save();
}

async function recordTripCommission(trip) {
  const { month, year } = getStatementPeriod(trip.endedAt ?? trip.paymentConfirmedAt ?? new Date());
  const commission = roundMoney(trip.commissionAmount ?? trip.fare * env.COMMISSION_RATE);

  let statement = await CommissionStatement.findOne({
    driverId: trip.driverId,
    periodMonth: month,
    periodYear: year,
  });

  if (!statement) {
    statement = await CommissionStatement.create({
      driverId: trip.driverId,
      periodMonth: month,
      periodYear: year,
      tripIds: [trip._id],
      grossTripRevenue: trip.fare,
      commissionRate: env.COMMISSION_RATE,
      commissionTotal: commission,
      balanceDue: commission,
      dueDate: getStatementDueDate(month, year),
      status: COMMISSION_STATUSES.DUE,
    });
  } else {
    if (!statement.tripIds.some((tripId) => tripId.toString() === trip._id.toString())) {
      statement.tripIds.push(trip._id);
      statement.grossTripRevenue = roundMoney(statement.grossTripRevenue + trip.fare);
      statement.commissionTotal = roundMoney(statement.commissionTotal + commission);
    }
    normalizeSettlement(statement);
    if (statement.status === COMMISSION_STATUSES.SETTLED) {
      statement.status = COMMISSION_STATUSES.DUE;
      statement.settledAt = null;
    }
    await statement.save();
  }

  await DriverProfile.findByIdAndUpdate(trip.driverId, {
    $inc: { commissionDebt: commission },
  });

  await syncDriverSuspension(trip.driverId);
  emitDomainEvent("commission.updated", { statementId: statement._id.toString(), driverId: trip.driverId.toString() });

  return statement;
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
      status:
        commissionTotal > 0 ? COMMISSION_STATUSES.DUE : COMMISSION_STATUSES.SETTLED,
    });
    return { statement, created: true };
  }

  statement.tripIds = trips.map((trip) => trip._id);
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

  return { statement, created: false };
}

async function reconcileMonthlyCommissions({ now = new Date() } = {}) {
  const summary = await reconcileCommissions({ now });
  return {
    ...summary,
    createdCount: summary.statementsCreated,
    updatedCount: summary.statementsUpdated,
    driverCount: summary.driversChecked,
  };
}

async function submitReceipt(statementId, driverProfileId, fileUrl) {
  const statement = await CommissionStatement.findOne({
    _id: statementId,
    driverId: driverProfileId,
  });

  if (!statement) throw new ApiError(404, "Commission statement not found");
  assertTransition(statement.status, COMMISSION_STATUSES.SUBMITTED);

  statement.receiptFileUrl = fileUrl;
  statement.submittedAt = new Date();
  statement.status = COMMISSION_STATUSES.SUBMITTED;
  statement.rejectionReason = "";
  await statement.save();
  emitDomainEvent("commission.updated", {
    statementId: statement._id.toString(),
    driverId: statement.driverId.toString(),
  });

  return statement;
}

async function approveStatement(statementId, reviewerUserId, notes = "", settleImmediately = false) {
  const statement = await CommissionStatement.findById(statementId);
  if (!statement) throw new ApiError(404, "Commission statement not found");

  assertTransition(
    statement.status,
    settleImmediately ? COMMISSION_STATUSES.SETTLED : COMMISSION_STATUSES.APPROVED
  );

  const previousBalance = statement.balanceDue;
  statement.status = settleImmediately
    ? COMMISSION_STATUSES.SETTLED
    : COMMISSION_STATUSES.APPROVED;
  statement.reviewedAt = new Date();
  statement.reviewedBy = reviewerUserId;
  statement.reviewNotes = notes;
  statement.approvedAt = new Date();
  statement.rejectionReason = "";

  if (settleImmediately) {
    statement.amountPaid = statement.commissionTotal;
    statement.balanceDue = 0;
    statement.settledAt = new Date();
  }

  await statement.save();

  if (settleImmediately && previousBalance > 0) {
    await reduceDriverDebt(statement.driverId, previousBalance);
  }

  await syncDriverSuspension(statement.driverId);
  emitDomainEvent("commission.updated", {
    statementId: statement._id.toString(),
    driverId: statement.driverId.toString(),
  });

  return statement;
}

async function settleStatement(statementId, reviewerUserId, notes = "") {
  const statement = await CommissionStatement.findById(statementId);
  if (!statement) throw new ApiError(404, "Commission statement not found");

  assertTransition(statement.status, COMMISSION_STATUSES.SETTLED);

  const previousBalance = statement.balanceDue;
  statement.status = COMMISSION_STATUSES.SETTLED;
  statement.amountPaid = statement.commissionTotal;
  statement.balanceDue = 0;
  statement.reviewedAt = new Date();
  statement.reviewedBy = reviewerUserId;
  statement.reviewNotes = notes;
  statement.settledAt = new Date();
  await statement.save();

  if (previousBalance > 0) {
    await reduceDriverDebt(statement.driverId, previousBalance);
  }

  await syncDriverSuspension(statement.driverId);
  emitDomainEvent("commission.updated", {
    statementId: statement._id.toString(),
    driverId: statement.driverId.toString(),
  });

  return statement;
}

async function rejectStatement(statementId, reviewerUserId, reason = "") {
  const statement = await CommissionStatement.findById(statementId);
  if (!statement) throw new ApiError(404, "Commission statement not found");

  assertTransition(statement.status, COMMISSION_STATUSES.REJECTED);

  statement.status = COMMISSION_STATUSES.REJECTED;
  statement.reviewedAt = new Date();
  statement.reviewedBy = reviewerUserId;
  statement.reviewNotes = reason;
  statement.rejectionReason = reason;
  await statement.save();

  await syncDriverSuspension(statement.driverId);
  emitDomainEvent("commission.updated", {
    statementId: statement._id.toString(),
    driverId: statement.driverId.toString(),
  });

  return statement;
}

module.exports = {
  COMMISSION_TRANSITIONS,
  getStatementPeriod,
  getStatementDueDate,
  reconcileMonthlyCommissions,
  recordTripCommission,
  submitReceipt,
  approveStatement,
  settleStatement,
  rejectStatement,
};

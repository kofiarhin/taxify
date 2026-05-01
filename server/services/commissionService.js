const CommissionStatement = require("../models/CommissionStatement");
const DriverProfile = require("../models/DriverProfile");
const { COMMISSION_STATUSES, COMMISSION_RATE } = require("../constants/statuses");

async function recordTripCommission(trip) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const commission = trip.commissionAmount ?? trip.fare * COMMISSION_RATE;

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
      commissionRate: COMMISSION_RATE,
      commissionTotal: commission,
      balanceDue: commission,
      status: COMMISSION_STATUSES.DUE,
    });
  } else {
    statement.tripIds.push(trip._id);
    statement.grossTripRevenue += trip.fare;
    statement.commissionTotal += commission;
    statement.balanceDue = statement.commissionTotal - statement.amountPaid;
    if (statement.status === COMMISSION_STATUSES.SETTLED) {
      statement.status = COMMISSION_STATUSES.DUE;
    }
    await statement.save();
  }

  await DriverProfile.findByIdAndUpdate(trip.driverId, {
    $inc: { commissionDebt: commission },
  });

  return statement;
}

async function submitReceipt(statementId, driverProfileId, fileUrl) {
  const statement = await CommissionStatement.findOne({
    _id: statementId,
    driverId: driverProfileId,
  });

  if (!statement) throw new Error("Commission statement not found");
  if (statement.status === COMMISSION_STATUSES.SETTLED) {
    throw new Error("Statement is already settled");
  }

  statement.receiptFileUrl = fileUrl;
  statement.submittedAt = new Date();
  statement.status = COMMISSION_STATUSES.SUBMITTED;
  await statement.save();

  return statement;
}

async function approveStatement(statementId, reviewerUserId, notes = "") {
  const statement = await CommissionStatement.findById(statementId);
  if (!statement) throw new Error("Commission statement not found");

  const previousBalance = statement.balanceDue;

  statement.status = COMMISSION_STATUSES.SETTLED;
  statement.amountPaid = statement.commissionTotal;
  statement.balanceDue = 0;
  statement.reviewedAt = new Date();
  statement.reviewedBy = reviewerUserId;
  statement.reviewNotes = notes;
  await statement.save();

  await DriverProfile.findByIdAndUpdate(statement.driverId, {
    $inc: { commissionDebt: -previousBalance },
  });

  return statement;
}

async function rejectStatement(statementId, reviewerUserId, notes = "") {
  const statement = await CommissionStatement.findById(statementId);
  if (!statement) throw new Error("Commission statement not found");

  statement.status = COMMISSION_STATUSES.DUE;
  statement.receiptFileUrl = null;
  statement.submittedAt = null;
  statement.reviewedAt = new Date();
  statement.reviewedBy = reviewerUserId;
  statement.reviewNotes = notes;
  await statement.save();

  return statement;
}

module.exports = { recordTripCommission, submitReceipt, approveStatement, rejectStatement };

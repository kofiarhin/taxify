const CommissionStatement = require("../models/CommissionStatement");
const { env } = require("../config/env");
const { COMMISSION_STATUSES } = require("../constants/statuses");

const DAY_MS = 24 * 60 * 60 * 1000;

const OUTSTANDING_COMMISSION_STATUSES = [
  COMMISSION_STATUSES.DUE,
  COMMISSION_STATUSES.SUBMITTED,
  COMMISSION_STATUSES.APPROVED,
  COMMISSION_STATUSES.REJECTED,
];

function roundMoney(value) {
  return Number((value ?? 0).toFixed(2));
}

function getDaysOverdue(dueDate, now = new Date()) {
  if (!dueDate || dueDate > now) return 0;
  return Math.floor((now.getTime() - dueDate.getTime()) / DAY_MS);
}

function buildCommissionDebtState(statements, config = {}) {
  const now = config.now ?? new Date();
  const suspendAfterDays =
    config.suspendAfterDays ?? env.COMMISSION_SUSPEND_AFTER_DAYS;
  const deactivateAfterDays =
    config.deactivateAfterDays ?? env.COMMISSION_DEACTIVATE_AFTER_DAYS;

  let totalOutstanding = 0;
  let oldestOverdueDate = null;

  for (const statement of statements) {
    const balanceDue = Number(statement.balanceDue ?? 0);
    if (balanceDue <= 0) continue;

    totalOutstanding += balanceDue;
    if (statement.dueDate && statement.dueDate <= now) {
      if (!oldestOverdueDate || statement.dueDate < oldestOverdueDate) {
        oldestOverdueDate = statement.dueDate;
      }
    }
  }

  const daysOverdue = oldestOverdueDate
    ? getDaysOverdue(oldestOverdueDate, now)
    : 0;

  return {
    totalOutstanding: roundMoney(totalOutstanding),
    oldestOverdueDate,
    daysOverdue,
    hasSuspendLevelDebt: daysOverdue >= suspendAfterDays,
    hasDeactivateLevelDebt: daysOverdue >= deactivateAfterDays,
  };
}

async function getDriverCommissionDebtState(driverId, options = {}) {
  const query = CommissionStatement.find({
    driverId,
    status: { $in: OUTSTANDING_COMMISSION_STATUSES },
    balanceDue: { $gt: 0 },
  }).sort({ dueDate: 1 });

  if (options.session) query.session(options.session);

  const statements = await query.lean();
  return buildCommissionDebtState(statements, options);
}

module.exports = {
  OUTSTANDING_COMMISSION_STATUSES,
  buildCommissionDebtState,
  getDaysOverdue,
  getDriverCommissionDebtState,
};

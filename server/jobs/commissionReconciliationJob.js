const connectDatabase = require("../config/db");
const { env } = require("../config/env");
const {
  reconcileMonthlyCommissions,
} = require("../services/commissionReconciliationService");

async function runCommissionReconciliationJob(options = {}) {
  return reconcileMonthlyCommissions(options);
}

function startCommissionReconciliationSchedule() {
  if (env.NODE_ENV === "test") {
    return null;
  }

  let cron;
  try {
    cron = require("node-cron");
  } catch (_error) {
    return null;
  }

  return cron.schedule(env.COMMISSION_RECONCILIATION_CRON, () => {
    runCommissionReconciliationJob().catch((error) => {
      console.error("Commission reconciliation failed", error);
    });
  });
}

if (require.main === module) {
  connectDatabase()
    .then(() => runCommissionReconciliationJob())
    .then((summary) => {
      console.log(JSON.stringify(summary, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error("Commission reconciliation failed", error);
      process.exit(1);
    });
}

module.exports = {
  runCommissionReconciliationJob,
  startCommissionReconciliationSchedule,
};

const http = require("http");
const app = require("./app");
const connectDatabase = require("./config/db");
const { env } = require("./config/env");
const { seedDemoUsers } = require("./services/seedService");
const { initializeSocket } = require("./socket");
const { expirePendingAssignments } = require("./services/assignmentService");

let assignmentSweepHandle = null;

function startAssignmentSweepJob() {
  if (env.NODE_ENV === "test") {
    return null;
  }

  assignmentSweepHandle = setInterval(() => {
    expirePendingAssignments().catch((error) => {
      console.error("Assignment sweep failed", error);
    });
  }, env.ASSIGNMENT_SWEEP_INTERVAL_MS);

  return assignmentSweepHandle;
}

async function startServer() {
  await connectDatabase();

  if (env.NODE_ENV !== "production" && env.DEMO_SEED_ENABLED) {
    await seedDemoUsers();
  }

  const server = http.createServer(app);
  initializeSocket(server);
  startAssignmentSweepJob();

  server.listen(env.PORT, () => {
    console.log(`Taxify API listening on port ${env.PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});

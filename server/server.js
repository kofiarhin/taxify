const app = require("./app");
const connectDatabase = require("./config/db");
const { env } = require("./config/env");
const { seedDemoUsers } = require("./services/seedService");

async function startServer() {
  await connectDatabase();

  if (env.NODE_ENV !== "production" && env.DEMO_SEED_ENABLED) {
    await seedDemoUsers();
  }

  app.listen(env.PORT, () => {
    console.log(`Taxify API listening on port ${env.PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});

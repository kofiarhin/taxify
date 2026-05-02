const mongoose = require("mongoose");
const connectDatabase = require("../config/db");
const { seedDemoUsers } = require("../services/seedService");

async function run() {
  await connectDatabase();
  const seededUsers = await seedDemoUsers();

  console.log("Database cleared.");
  console.log("Seeded users:");
  for (const user of seededUsers) {
    console.log(`- ${user.role}: ${user.email} / ${user.password}`);
  }
}

run()
  .then(async () => {
    await mongoose.disconnect();
  })
  .catch(async (error) => {
    console.error("Failed to seed users", error);
    await mongoose.disconnect();
    process.exit(1);
  });

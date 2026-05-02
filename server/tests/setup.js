process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/taxify-test";
process.env.JWT_SECRET = "test-secret-key";
process.env.JWT_EXPIRES_IN = "1d";
process.env.CLIENT_URL = "http://localhost:5173,http://localhost:5174";
process.env.DEMO_SEED_ENABLED = "false";
process.env.ASSIGNMENT_TIMEOUT_MS = "60000";
process.env.ASSIGNMENT_SWEEP_INTERVAL_MS = "1000";
process.env.COMMISSION_RATE = "0.1";
process.env.COMMISSION_PAYMENT_GRACE_DAYS = "7";
process.env.COMMISSION_SUSPEND_AFTER_DAYS = "30";
process.env.COMMISSION_DEACTIVATE_AFTER_DAYS = "60";
process.env.COMMISSION_RECONCILIATION_CRON = "0 2 * * *";
process.env.FARE_BASE = "5";
process.env.FARE_PER_MINUTE = "1";
process.env.FARE_PER_KM = "2";

const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = mongoServer.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
  jest.clearAllMocks();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

require('dotenv').config();
const mongoose = require('mongoose');
const { connectIfNeeded, seedE2eData } = require('./e2eSeed');

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required to seed E2E data outside npm run test:e2e');
  }

  process.env.NODE_ENV = process.env.NODE_ENV || 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'e2e-secret-with-enough-length';
  process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
  process.env.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5173';
  process.env.FARE_BASE = process.env.FARE_BASE || '10';
  process.env.FARE_PER_KM = process.env.FARE_PER_KM || '3';
  process.env.FARE_PER_MINUTE = process.env.FARE_PER_MINUTE || '1';
  process.env.COMMISSION_RATE = process.env.COMMISSION_RATE || '0.1';

  await connectIfNeeded(process.env.MONGO_URI);
  const state = await seedE2eData();
  console.log('Seeded Taxify E2E data.');
  console.log(`Admin: ${state.credentials.admin.email}`);
  console.log(`Agent: ${state.credentials.agent.email}`);
  console.log(`Client: ${state.credentials.client.email}`);
  console.log(`Driver: ${state.credentials.driver.email}`);
};

run()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error.message || error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });

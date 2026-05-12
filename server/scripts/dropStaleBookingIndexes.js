require('dotenv').config();
const mongoose = require('mongoose');
const connectDb = require('../config/db');
const Booking = require('../models/Booking');

const KEEP_INDEXES = new Set(['_id_']);

const run = async () => {
  await connectDb();
  const collection = Booking.collection;
  const existing = await collection.indexes();
  const schemaKeys = new Set(
    Object.values(Booking.schema.indexes()).map(([keys]) => JSON.stringify(keys))
  );
  Booking.schema.eachPath((path, schemaType) => {
    if (schemaType.options?.unique || schemaType.options?.index) {
      schemaKeys.add(JSON.stringify({ [path]: 1 }));
    }
  });

  const stale = existing.filter((index) => {
    if (KEEP_INDEXES.has(index.name)) return false;
    const keyJson = JSON.stringify(index.key);
    return !schemaKeys.has(keyJson);
  });

  if (stale.length === 0) {
    console.log('No stale indexes on bookings collection.');
    return;
  }

  for (const index of stale) {
    console.log(`Dropping stale index ${index.name} (${JSON.stringify(index.key)})`);
    await collection.dropIndex(index.name);
  }
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

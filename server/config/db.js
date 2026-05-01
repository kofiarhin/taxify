const mongoose = require("mongoose");
const { env } = require("./env");

async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(env.MONGODB_URI);
  return mongoose.connection;
}

module.exports = connectDatabase;

const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'DriverProfile', required: true },
    startedAt: Date,
    endedAt: Date,
    distanceKm: Number,
    durationMinutes: Number,
    fare: {
      baseFare: Number,
      perKm: Number,
      perMinute: Number,
      total: Number
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trip', tripSchema);

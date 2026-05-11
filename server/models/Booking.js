const mongoose = require('mongoose');
const { BOOKING_STATUS } = require('../constants/statuses');

const bookingSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    source: { type: String, enum: ['CLIENT_APP', 'AGENT'], required: true },
    passengerName: { type: String, required: true, trim: true },
    passengerPhone: { type: String, trim: true },
    pickupAddress: { type: String, required: true, trim: true },
    dropoffAddress: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING_ASSIGNMENT,
      index: true
    },
    assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'DriverProfile' },
    distanceKm: { type: Number, default: null },
    durationMinutes: { type: Number, default: null },
    fare: {
      baseFare: { type: Number, default: 10 },
      perKm: { type: Number, default: 3 },
      perMinute: { type: Number, default: 1 },
      total: { type: Number, default: 0 }
    },
    payment: {
      method: { type: String, enum: ['CASH'], default: 'CASH' },
      status: { type: String, enum: ['UNPAID', 'CLIENT_CONFIRMED', 'PAID'], default: 'UNPAID' },
      clientConfirmedAt: Date,
      driverConfirmedAt: Date
    },
    acceptedAt: Date,
    startedAt: Date,
    endedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    disputedAt: Date
  },
  { timestamps: true }
);

bookingSchema.index({ client: 1, createdAt: -1 });
bookingSchema.index({ assignedDriver: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);

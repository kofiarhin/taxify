const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DriverProfile",
      required: true,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    durationMinutes: {
      type: Number,
      default: null,
    },
    fare: {
      type: Number,
      default: null,
    },
    commissionAmount: {
      type: Number,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID"],
      default: "PENDING",
    },
    paymentConfirmedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

tripSchema.index({ driverId: 1, createdAt: -1 });
tripSchema.index({ paymentStatus: 1 });

module.exports = mongoose.models.Trip || mongoose.model("Trip", tripSchema);

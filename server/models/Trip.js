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
    distanceKm: {
      type: Number,
      default: null,
    },
    fare: {
      type: Number,
      default: null,
    },
    fareBreakdown: {
      baseFare: {
        type: Number,
        default: 0,
      },
      durationFare: {
        type: Number,
        default: 0,
      },
      distanceFare: {
        type: Number,
        default: 0,
      },
      manualFare: {
        type: Number,
        default: null,
      },
    },
    isManualFareOverride: {
      type: Boolean,
      default: false,
    },
    fareNotes: {
      type: String,
      default: "",
    },
    commissionAmount: {
      type: Number,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PENDING_CLIENT_CONFIRMATION", "AWAITING_DRIVER_CONFIRMATION", "PAID"],
      default: "PENDING",
    },
    clientConfirmedCompleteAt: {
      type: Date,
      default: null,
    },
    driverConfirmedPaymentAt: {
      type: Date,
      default: null,
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

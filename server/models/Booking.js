const mongoose = require("mongoose");
const { BOOKING_STATUSES, ASSIGNMENT_MODES } = require("../constants/statuses");

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    pickupAddress: {
      type: String,
      required: true,
      trim: true,
    },
    dropoffAddress: {
      type: String,
      required: true,
      trim: true,
    },
    pickupTime: {
      type: Date,
      required: true,
    },
    specialInstructions: {
      type: String,
      default: "",
      trim: true,
    },
    estimatedFare: {
      type: Number,
      default: null,
    },
    finalFare: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUSES),
      default: BOOKING_STATUSES.PENDING_ASSIGNMENT,
    },
    assignmentMode: {
      type: String,
      enum: Object.values(ASSIGNMENT_MODES),
      default: ASSIGNMENT_MODES.AUTO,
    },
    assignedDriverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DriverProfile",
      default: null,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelReason: {
      type: String,
      default: "",
    },
    queueEnteredAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ assignedDriverId: 1 });
bookingSchema.index({ createdBy: 1 });

module.exports = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

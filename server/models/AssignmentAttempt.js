const mongoose = require("mongoose");
const { ASSIGNMENT_STATUSES } = require("../constants/statuses");

const assignmentAttemptSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DriverProfile",
      required: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ASSIGNMENT_STATUSES),
      default: ASSIGNMENT_STATUSES.PENDING,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

assignmentAttemptSchema.index({ bookingId: 1 });
assignmentAttemptSchema.index({ driverId: 1, status: 1 });

module.exports =
  mongoose.models.AssignmentAttempt ||
  mongoose.model("AssignmentAttempt", assignmentAttemptSchema);

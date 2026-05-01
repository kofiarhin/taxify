const mongoose = require("mongoose");
const { COMPLAINT_STATUSES, COMPLAINT_PRIORITIES } = require("../constants/statuses");

const complaintSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DriverProfile",
      default: null,
    },
    reportedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customerName: {
      type: String,
      default: "",
      trim: true,
    },
    customerPhone: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: Object.values(COMPLAINT_PRIORITIES),
      default: COMPLAINT_PRIORITIES.MEDIUM,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(COMPLAINT_STATUSES),
      default: COMPLAINT_STATUSES.OPEN,
    },
    assignedToUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolutionNotes: {
      type: String,
      default: "",
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

complaintSchema.index({ status: 1, createdAt: -1 });
complaintSchema.index({ reportedByUserId: 1 });

module.exports = mongoose.models.Complaint || mongoose.model("Complaint", complaintSchema);

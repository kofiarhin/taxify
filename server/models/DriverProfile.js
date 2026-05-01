const mongoose = require("mongoose");
const { DRIVER_STATUSES } = require("../constants/statuses");

const driverProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: Object.values(DRIVER_STATUSES),
      default: DRIVER_STATUSES.PENDING_APPROVAL,
    },
    licenseNumber: {
      type: String,
      required: true,
      trim: true,
    },
    licenseExpiry: {
      type: Date,
      required: true,
    },
    vehicleMake: {
      type: String,
      required: true,
      trim: true,
    },
    vehicleModel: {
      type: String,
      required: true,
      trim: true,
    },
    vehiclePlate: {
      type: String,
      required: true,
      trim: true,
    },
    vehicleColor: {
      type: String,
      required: true,
      trim: true,
    },
    nationalId: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    emergencyContact: {
      type: String,
      required: true,
      trim: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    suspendedAt: {
      type: Date,
      default: null,
    },
    suspensionReason: {
      type: String,
      default: "",
    },
    deactivatedAt: {
      type: Date,
      default: null,
    },
    deactivationReason: {
      type: String,
      default: "",
    },
    currentAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssignmentAttempt",
      default: null,
    },
    lastAssignedAt: {
      type: Date,
      default: null,
    },
    commissionDebt: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.DriverProfile || mongoose.model("DriverProfile", driverProfileSchema);

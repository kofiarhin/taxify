const mongoose = require("mongoose");
const { COMMISSION_STATUSES, COMMISSION_RATE } = require("../constants/statuses");

const commissionStatementSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DriverProfile",
      required: true,
    },
    periodMonth: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    periodYear: {
      type: Number,
      required: true,
    },
    tripIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Trip",
      },
    ],
    grossTripRevenue: {
      type: Number,
      default: 0,
    },
    commissionRate: {
      type: Number,
      default: COMMISSION_RATE,
    },
    commissionTotal: {
      type: Number,
      default: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    balanceDue: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(COMMISSION_STATUSES),
      default: COMMISSION_STATUSES.DUE,
    },
    receiptFileUrl: {
      type: String,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewNotes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

commissionStatementSchema.index({ driverId: 1, periodYear: -1, periodMonth: -1 });
commissionStatementSchema.index(
  { driverId: 1, periodMonth: 1, periodYear: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.CommissionStatement ||
  mongoose.model("CommissionStatement", commissionStatementSchema);

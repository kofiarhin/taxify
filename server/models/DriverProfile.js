const mongoose = require('mongoose');
const { DRIVER_APPROVAL_STATUS, DRIVER_STATUS } = require('../constants/statuses');

const driverProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    approvalStatus: {
      type: String,
      enum: Object.values(DRIVER_APPROVAL_STATUS),
      default: DRIVER_APPROVAL_STATUS.PENDING
    },
    lifecycleStatus: {
      type: String,
      enum: Object.values(DRIVER_STATUS),
      default: DRIVER_STATUS.OFFLINE
    },
    licenseNumber: { type: String, trim: true },
    vehicleMake: { type: String, trim: true },
    vehicleModel: { type: String, trim: true },
    vehiclePlate: { type: String, trim: true },
    ratingAverage: { type: Number, default: null },
    reviewCount: { type: Number, default: 0 },
    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

driverProfileSchema.index({ approvalStatus: 1, lifecycleStatus: 1, createdAt: 1 });

module.exports = mongoose.model('DriverProfile', driverProfileSchema);

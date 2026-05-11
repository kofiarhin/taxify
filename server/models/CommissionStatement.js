const mongoose = require('mongoose');

const commissionStatementSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'DriverProfile', required: true },
    month: { type: String, required: true, index: true },
    fareTotal: { type: Number, required: true },
    commissionRate: { type: Number, default: 0.1 },
    commissionAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED'],
      default: 'PENDING'
    },
    receiptReference: { type: String, trim: true },
    receiptNotes: { type: String, trim: true },
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adminNotes: { type: String, trim: true }
  },
  { timestamps: true }
);

commissionStatementSchema.index({ driver: 1, month: 1 });

module.exports = mongoose.model('CommissionStatement', commissionStatementSchema);

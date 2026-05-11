const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'DriverProfile' },
    type: { type: String, enum: ['COMPLAINT', 'DISPUTE'], default: 'COMPLAINT' },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    status: { type: String, enum: ['OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED'], default: 'OPEN' },
    adminNotes: { type: String, trim: true }
  },
  { timestamps: true }
);

complaintSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);

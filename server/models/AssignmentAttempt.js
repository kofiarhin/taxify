const mongoose = require('mongoose');

const assignmentAttemptSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'DriverProfile' },
    status: { type: String, enum: ['ASSIGNED', 'NO_DRIVER', 'REJECTED'], required: true },
    note: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('AssignmentAttempt', assignmentAttemptSchema);

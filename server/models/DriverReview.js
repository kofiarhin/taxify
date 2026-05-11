const mongoose = require('mongoose');

const driverReviewSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'DriverProfile', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    feedback: { type: String, trim: true, maxlength: 1000 }
  },
  { timestamps: true }
);

driverReviewSchema.index({ driver: 1, createdAt: -1 });

module.exports = mongoose.model('DriverReview', driverReviewSchema);

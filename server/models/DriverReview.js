const mongoose = require("mongoose");

const driverReviewSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
      index: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DriverProfile",
      required: true,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number.",
      },
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

driverReviewSchema.index({ driverId: 1, createdAt: -1 });
driverReviewSchema.index({ clientId: 1, createdAt: -1 });

module.exports =
  mongoose.models.DriverReview || mongoose.model("DriverReview", driverReviewSchema);

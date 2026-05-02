const Booking = require("../models/Booking");
const DriverProfile = require("../models/DriverProfile");
const DriverReview = require("../models/DriverReview");
const { BOOKING_STATUSES } = require("../constants/statuses");
const { ApiError } = require("../utils/apiError");

function serializeReview(review) {
  return {
    id: review._id,
    bookingId: review.bookingId,
    driverId: review.driverId,
    clientId: review.clientId,
    rating: review.rating,
    comment: review.comment ?? null,
    createdAt: review.createdAt,
  };
}

async function getReviewStateForBooking(booking) {
  if (!booking || !booking.clientId || !booking.assignedDriverId) {
    return { eligible: false, submitted: false, rating: null };
  }

  const existingReview = await DriverReview.findOne({ bookingId: booking._id }).select(
    "rating comment createdAt"
  );

  if (existingReview) {
    return {
      eligible: false,
      submitted: true,
      rating: existingReview.rating,
      comment: existingReview.comment ?? null,
      createdAt: existingReview.createdAt,
    };
  }

  return {
    eligible: booking.status === BOOKING_STATUSES.COMPLETED,
    submitted: false,
    rating: null,
  };
}

async function submitDriverReview({ bookingId, clientId, rating, comment }) {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (!booking.clientId || booking.clientId.toString() !== clientId.toString()) {
    throw new ApiError(403, "Booking does not belong to this client");
  }

  if (booking.status !== BOOKING_STATUSES.COMPLETED) {
    throw new ApiError(422, "Only completed trips can be reviewed.");
  }

  if (!booking.assignedDriverId) {
    throw new ApiError(422, "Only trips with an assigned driver can be reviewed.");
  }

  const existingReview = await DriverReview.findOne({ bookingId: booking._id });
  if (existingReview) {
    throw new ApiError(409, "This trip has already been reviewed.");
  }

  let review;
  try {
    review = await DriverReview.create({
      bookingId: booking._id,
      driverId: booking.assignedDriverId,
      clientId,
      rating,
      comment: comment || null,
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "This trip has already been reviewed.");
    }
    throw error;
  }

  const driverProfile = await DriverProfile.findById(booking.assignedDriverId);
  if (!driverProfile) {
    throw new ApiError(404, "Driver profile not found");
  }

  driverProfile.ratingTotal = (driverProfile.ratingTotal || 0) + rating;
  driverProfile.reviewCount = (driverProfile.reviewCount || 0) + 1;
  driverProfile.averageRating = driverProfile.ratingTotal / driverProfile.reviewCount;
  await driverProfile.save();

  return {
    review: serializeReview(review),
    driverRating: {
      averageRating: driverProfile.averageRating,
      reviewCount: driverProfile.reviewCount,
    },
  };
}

module.exports = {
  getReviewStateForBooking,
  submitDriverReview,
};

const { z } = require('zod');
const Booking = require('../models/Booking');
const DriverProfile = require('../models/DriverProfile');
const DriverReview = require('../models/DriverReview');
const { BOOKING_STATUS } = require('../constants/statuses');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { refreshDriverRating } = require('../services/driverReviewService');

const reviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  feedback: z.string().max(1000).optional()
});

const createReview = asyncHandler(async (req, res) => {
  const data = reviewSchema.parse(req.body);
  const booking = await Booking.findById(req.params.bookingId);

  if (!booking) throw new ApiError(404, 'Booking not found', 'BOOKING_NOT_FOUND');
  if (booking.client?.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Only the booking client can review this driver', 'FORBIDDEN');
  }
  if (booking.status !== BOOKING_STATUS.COMPLETED) {
    throw new ApiError(409, 'Only completed bookings can be reviewed', 'BOOKING_NOT_COMPLETED');
  }

  try {
    const review = await DriverReview.create({
      booking: booking._id,
      client: req.user._id,
      driver: booking.assignedDriver,
      rating: data.rating,
      feedback: data.feedback
    });
    await refreshDriverRating(booking.assignedDriver);
    res.status(201).json({ review });
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, 'This booking already has a driver review', 'REVIEW_EXISTS');
    }
    throw error;
  }
});

const listDriverReviews = asyncHandler(async (req, res) => {
  const driver = await DriverProfile.findById(req.params.driverId);
  if (!driver) throw new ApiError(404, 'Driver profile not found', 'DRIVER_NOT_FOUND');
  const reviews = await DriverReview.find({ driver: driver._id })
    .populate('client', 'name')
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ reviews, summary: { ratingAverage: driver.ratingAverage, reviewCount: driver.reviewCount } });
});

module.exports = { createReview, listDriverReviews };

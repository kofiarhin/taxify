const Booking = require("../models/Booking");
const AuditLog = require("../models/AuditLog");
const { asyncHandler } = require("../utils/asyncHandler");
const { getPagination } = require("../utils/pagination");
const { ApiError } = require("../utils/apiError");
const {
  cancelActiveAssignmentForBooking,
  dispatchBooking,
  generateBookingReference,
} = require("../services/assignmentService");
const { BOOKING_STATUSES, ASSIGNMENT_MODES } = require("../constants/statuses");
const { emitDomainEvent } = require("../socket");

const createBooking = asyncHandler(async (req, res) => {
  const body = req.validated.body;
  const booking = await Booking.create({
    ...body,
    bookingReference: generateBookingReference(),
    createdBy: req.user._id,
    status: BOOKING_STATUSES.PENDING_ASSIGNMENT,
  });

  emitDomainEvent("booking.created", { bookingId: booking._id.toString() });
  await dispatchBooking(booking._id, ASSIGNMENT_MODES.AUTO);
  const refreshed = await Booking.findById(booking._id);

  await AuditLog.create({
    actorUserId: req.user._id,
    action: "BOOKING_CREATED",
    entityType: "Booking",
    entityId: booking._id,
    metadata: { reference: booking.bookingReference, status: refreshed.status },
  });

  res.status(201).json({ success: true, data: { booking: refreshed } });
});

const listBookings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.validated.query.status) filter.status = req.validated.query.status;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate("assignedDriverId", "vehicleMake vehicleModel vehiclePlate userId")
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);

  res.json({ success: true, data: { bookings, pagination: { page, limit, total } } });
});

const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("assignedDriverId", "vehicleMake vehicleModel vehiclePlate userId")
    .populate("createdBy", "fullName email");

  if (!booking) throw new ApiError(404, "Booking not found");
  res.json({ success: true, data: { booking } });
});

const getQueue = asyncHandler(async (_req, res) => {
  const bookings = await Booking.find({ status: BOOKING_STATUSES.QUEUED })
    .populate("createdBy", "fullName")
    .sort({ queueEnteredAt: 1 });

  res.json({ success: true, data: { bookings } });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, "Booking not found");

  if (booking.status === BOOKING_STATUSES.CANCELLED) {
    return res.json({ success: true, data: { booking } });
  }

  const nonCancellable = [
    BOOKING_STATUSES.IN_PROGRESS,
    BOOKING_STATUSES.PAYMENT_PENDING,
    BOOKING_STATUSES.PAID,
    BOOKING_STATUSES.COMPLETED,
  ];
  if (nonCancellable.includes(booking.status)) {
    throw new ApiError(400, `Cannot cancel a booking with status ${booking.status}`);
  }

  if (
    booking.status === BOOKING_STATUSES.ASSIGNED ||
    booking.status === BOOKING_STATUSES.ACCEPTED
  ) {
    await cancelActiveAssignmentForBooking(booking);
  }

  booking.status = BOOKING_STATUSES.CANCELLED;
  booking.cancelledAt = new Date();
  booking.cancelReason = req.validated.body.reason || "";
  booking.queueEnteredAt = null;
  await booking.save();

  await AuditLog.create({
    actorUserId: req.user._id,
    action: "BOOKING_CANCELLED",
    entityType: "Booking",
    entityId: booking._id,
    metadata: { reason: booking.cancelReason },
  });

  res.json({ success: true, data: { booking } });
});

const retryAssignment = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, "Booking not found");

  if (booking.status !== BOOKING_STATUSES.QUEUED) {
    throw new ApiError(400, "Only queued bookings can be retried");
  }

  booking.status = BOOKING_STATUSES.PENDING_ASSIGNMENT;
  await booking.save();

  await dispatchBooking(booking._id, ASSIGNMENT_MODES.QUEUE_RETRY);
  const refreshed = await Booking.findById(booking._id);

  res.json({ success: true, data: { booking: refreshed } });
});

module.exports = { createBooking, listBookings, getBooking, getQueue, cancelBooking, retryAssignment };

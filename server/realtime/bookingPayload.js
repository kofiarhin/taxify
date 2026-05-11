const Booking = require('../models/Booking');

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'token',
  'tokens',
  'refreshToken',
  'resetPasswordToken',
  'resetPasswordExpires',
  '__v'
]);

const toId = (value) => value?._id?.toString?.() || value?.toString?.();

const toIsoTimestamp = (value) => {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

const sanitizeValue = (value) => {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (!value || typeof value !== 'object') return value;
  if (value.constructor?.name === 'ObjectId' || value._bsontype === 'ObjectId' || value._bsontype === 'ObjectID') {
    return toId(value);
  }

  const source =
    typeof value.toSafeObject === 'function'
      ? value.toSafeObject()
      : typeof value.toObject === 'function'
        ? value.toObject({ virtuals: false })
        : value;

  return Object.entries(source).reduce((safe, [key, entryValue]) => {
    if (SENSITIVE_KEYS.has(key)) return safe;
    safe[key] = sanitizeValue(entryValue);
    return safe;
  }, {});
};

const serializeBookingForRealtime = (booking) => {
  if (!booking) return undefined;
  return sanitizeValue(booking);
};

const populateBookingForRealtime = async (bookingOrId) => {
  const bookingId = toId(bookingOrId);
  if (!bookingId) return bookingOrId;

  return Booking.findById(bookingId)
    .populate('client', 'name email phone')
    .populate('createdBy', 'name email role')
    .populate({ path: 'assignedDriver', populate: { path: 'user', select: 'name email phone' } });
};

const buildBookingPayload = (booking, event, payload = {}) => {
  const serializedBooking = payload.booking
    ? serializeBookingForRealtime(payload.booking)
    : serializeBookingForRealtime(booking);
  const bookingId = toId(payload.bookingId) || toId(serializedBooking?._id) || toId(booking);
  const status = payload.status || serializedBooking?.status || booking?.status;

  return {
    type: payload.type || event,
    bookingId,
    status,
    ...(serializedBooking ? { booking: serializedBooking } : {}),
    timestamp: toIsoTimestamp(payload.timestamp)
  };
};

module.exports = {
  buildBookingPayload,
  populateBookingForRealtime,
  serializeBookingForRealtime,
  toId
};

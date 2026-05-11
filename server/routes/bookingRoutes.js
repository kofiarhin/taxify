const express = require('express');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { ROLES } = require('../constants/roles');
const {
  cancelBooking,
  completeOverride,
  createBooking,
  disputeBooking,
  getBooking,
  listBookings,
  reassign,
  retry
} = require('../controllers/bookingController');

const router = express.Router();

router.use(auth);
router.get('/', listBookings);
router.post('/', requireRole(ROLES.CLIENT, ROLES.AGENT), createBooking);
router.get('/:bookingId', getBooking);
router.post('/:bookingId/retry-assignment', requireRole(ROLES.ADMIN, ROLES.AGENT), retry);
router.post('/:bookingId/reassign', requireRole(ROLES.ADMIN), reassign);
router.post('/:bookingId/complete', requireRole(ROLES.ADMIN), completeOverride);
router.post('/:bookingId/cancel', requireRole(ROLES.ADMIN, ROLES.AGENT), cancelBooking);
router.post('/:bookingId/dispute', requireRole(ROLES.ADMIN), disputeBooking);

module.exports = router;

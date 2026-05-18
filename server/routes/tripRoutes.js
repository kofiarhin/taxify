const express = require('express');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { ROLES } = require('../constants/roles');
const {
  accept,
  clientArrived,
  clientConfirmCompletion,
  clientPaid,
  driverReceived,
  end,
  reject,
  start
} = require('../controllers/tripController');

const router = express.Router();

router.use(auth);
router.post('/:bookingId/accept', requireRole(ROLES.DRIVER), accept);
router.post('/:bookingId/reject', requireRole(ROLES.DRIVER), reject);
router.post('/:bookingId/start', requireRole(ROLES.DRIVER), start);
router.post('/:bookingId/end', requireRole(ROLES.DRIVER), end);
router.post('/:bookingId/client-confirmed', requireRole(ROLES.CLIENT), clientConfirmCompletion);
router.post('/:bookingId/client-arrived', requireRole(ROLES.CLIENT), clientArrived);
router.post('/:bookingId/client-paid', requireRole(ROLES.CLIENT), clientPaid);
router.post('/:bookingId/driver-received', requireRole(ROLES.DRIVER), driverReceived);

module.exports = router;

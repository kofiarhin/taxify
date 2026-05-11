const express = require('express');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { ROLES } = require('../constants/roles');
const { accept, confirmClient, confirmPayment, end, reject, start } = require('../controllers/tripController');

const router = express.Router();

router.use(auth);
router.post('/:bookingId/accept', requireRole(ROLES.DRIVER), accept);
router.post('/:bookingId/reject', requireRole(ROLES.DRIVER), reject);
router.post('/:bookingId/start', requireRole(ROLES.DRIVER), start);
router.post('/:bookingId/end', requireRole(ROLES.DRIVER), end);
router.post('/:bookingId/client-confirm', requireRole(ROLES.CLIENT), confirmClient);
router.post('/:bookingId/payment-confirm', requireRole(ROLES.DRIVER), confirmPayment);

module.exports = router;

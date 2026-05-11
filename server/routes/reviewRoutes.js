const express = require('express');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { ROLES } = require('../constants/roles');
const { createReview, listDriverReviews } = require('../controllers/reviewController');

const router = express.Router();

router.get('/drivers/:driverId', listDriverReviews);
router.post('/bookings/:bookingId', auth, requireRole(ROLES.CLIENT), createReview);

module.exports = router;

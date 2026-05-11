const express = require('express');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { ROLES } = require('../constants/roles');
const {
  listDrivers,
  myProfile,
  updateAvailability,
  updateDriverStatus,
  updateOnboarding
} = require('../controllers/driverController');

const router = express.Router();

router.use(auth);
router.get('/', requireRole(ROLES.ADMIN, ROLES.AGENT), listDrivers);
router.get('/me', requireRole(ROLES.DRIVER), myProfile);
router.patch('/me/onboarding', requireRole(ROLES.DRIVER), updateOnboarding);
router.patch('/me/availability', requireRole(ROLES.DRIVER), updateAvailability);
router.patch('/:driverId/status', requireRole(ROLES.ADMIN), updateDriverStatus);

module.exports = router;

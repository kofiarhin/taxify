const express = require('express');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { ROLES } = require('../constants/roles');
const { createStaffUser } = require('../controllers/driverController');
const { listUsers } = require('../controllers/userController');

const router = express.Router();

router.use(auth, requireRole(ROLES.ADMIN));
router.get('/', listUsers);
router.post('/staff', createStaffUser);

module.exports = router;

const express = require('express');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { ROLES } = require('../constants/roles');
const { adminSummary } = require('../controllers/dashboardController');

const router = express.Router();

router.get('/admin', auth, requireRole(ROLES.ADMIN), adminSummary);

module.exports = router;

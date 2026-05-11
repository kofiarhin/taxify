const express = require('express');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { ROLES } = require('../constants/roles');
const { listCommissions, reviewReceipt, submitReceipt } = require('../controllers/commissionController');

const router = express.Router();

router.use(auth);
router.get('/', requireRole(ROLES.ADMIN, ROLES.DRIVER), listCommissions);
router.patch('/:commissionId/receipt', requireRole(ROLES.DRIVER), submitReceipt);
router.patch('/:commissionId/review', requireRole(ROLES.ADMIN), reviewReceipt);

module.exports = router;

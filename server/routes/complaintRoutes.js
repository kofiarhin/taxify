const express = require('express');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { ROLES } = require('../constants/roles');
const { createComplaint, listComplaints, updateComplaint } = require('../controllers/complaintController');

const router = express.Router();

router.use(auth);
router.get('/', requireRole(ROLES.ADMIN, ROLES.AGENT, ROLES.CLIENT), listComplaints);
router.post('/', requireRole(ROLES.CLIENT, ROLES.AGENT), createComplaint);
router.patch('/:complaintId', requireRole(ROLES.ADMIN), updateComplaint);

module.exports = router;

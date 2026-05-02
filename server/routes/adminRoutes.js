const express = require("express");
const { ROLES } = require("../constants/roles");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const { reconcileCommissions } = require("../controllers/commissionController");

const router = express.Router();

router.use(auth);
router.post("/commission/reconcile", requireRole(ROLES.ADMIN), reconcileCommissions);

module.exports = router;

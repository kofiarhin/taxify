const express = require("express");
const { ROLES } = require("../constants/roles");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const { summary } = require("../controllers/dashboardController");

const router = express.Router();

router.use(auth);
router.use(requireRole(ROLES.ADMIN));

router.get("/summary", summary);

module.exports = router;

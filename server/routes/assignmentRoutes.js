const express = require("express");
const { ROLES } = require("../constants/roles");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const { getMyAssignment, accept, reject } = require("../controllers/assignmentController");

const router = express.Router();

router.use(auth);
router.use(requireRole(ROLES.DRIVER));

router.get("/me", getMyAssignment);
router.post("/:id/accept", accept);
router.post("/:id/reject", reject);

module.exports = router;

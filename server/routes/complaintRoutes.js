const express = require("express");
const { ROLES } = require("../constants/roles");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const { validateRequest } = require("../middleware/validateRequest");
const { complaintValidationSchemas } = require("../validators/complaintValidators");
const {
  createComplaint,
  listComplaints,
  getComplaint,
  updateComplaint,
  resolveComplaint,
} = require("../controllers/complaintController");

const router = express.Router();

router.use(auth);
router.use(requireRole(ROLES.ADMIN, ROLES.AGENT));

router.get("/", listComplaints);
router.post("/", validateRequest(complaintValidationSchemas.create), createComplaint);
router.get("/:id", getComplaint);
router.patch(
  "/:id",
  requireRole(ROLES.ADMIN),
  validateRequest(complaintValidationSchemas.update),
  updateComplaint
);
router.post(
  "/:id/resolve",
  requireRole(ROLES.ADMIN),
  validateRequest(complaintValidationSchemas.resolve),
  resolveComplaint
);

module.exports = router;

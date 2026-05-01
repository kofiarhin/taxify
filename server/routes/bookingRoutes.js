const express = require("express");
const { ROLES } = require("../constants/roles");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const { validateRequest } = require("../middleware/validateRequest");
const { bookingValidationSchemas } = require("../validators/bookingValidators");
const {
  createBooking,
  listBookings,
  getBooking,
  getQueue,
  cancelBooking,
  retryAssignment,
} = require("../controllers/bookingController");

const router = express.Router();

router.use(auth);

router.get("/queue", requireRole(ROLES.ADMIN, ROLES.AGENT), getQueue);

router.get(
  "/",
  requireRole(ROLES.ADMIN, ROLES.AGENT),
  validateRequest(bookingValidationSchemas.list),
  listBookings
);

router.post(
  "/",
  requireRole(ROLES.ADMIN, ROLES.AGENT),
  validateRequest(bookingValidationSchemas.create),
  createBooking
);

router.get("/:id", requireRole(ROLES.ADMIN, ROLES.AGENT), getBooking);

router.post(
  "/:id/cancel",
  requireRole(ROLES.ADMIN, ROLES.AGENT),
  validateRequest(bookingValidationSchemas.cancel),
  cancelBooking
);

router.post("/:id/retry-assignment", requireRole(ROLES.ADMIN, ROLES.AGENT), retryAssignment);

module.exports = router;

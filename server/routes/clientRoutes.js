const express = require("express");
const { ROLES } = require("../constants/roles");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const { validateRequest } = require("../middleware/validateRequest");
const { clientValidationSchemas } = require("../validators/clientValidators");
const { driverReviewValidationSchemas } = require("../validators/driverReviewValidators");
const {
  createClientBooking,
  getCurrentClientBooking,
  confirmClientComplete,
  submitDriverReview,
} = require("../controllers/clientController");

const router = express.Router();

router.use(auth);
router.use(requireRole(ROLES.CLIENT));

router.post("/bookings", validateRequest(clientValidationSchemas.createBooking), createClientBooking);
router.get("/bookings/current", getCurrentClientBooking);
router.post(
  "/bookings/:id/confirm-complete",
  validateRequest(clientValidationSchemas.bookingId),
  confirmClientComplete
);
router.post(
  "/bookings/:id/review",
  validateRequest(driverReviewValidationSchemas.submit),
  submitDriverReview
);

module.exports = router;

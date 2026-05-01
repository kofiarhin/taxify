const express = require("express");
const { ROLES } = require("../constants/roles");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const { validateRequest } = require("../middleware/validateRequest");
const { tripValidationSchemas } = require("../validators/tripValidators");
const { startTrip, endTrip, confirmPayment, listTrips, getDriverTrips } = require("../controllers/tripController");

const router = express.Router();

router.use(auth);

router.get("/", requireRole(ROLES.ADMIN), listTrips);

router.get("/mine", requireRole(ROLES.DRIVER), getDriverTrips);

router.post(
  "/:bookingId/start",
  requireRole(ROLES.DRIVER),
  validateRequest(tripValidationSchemas.bookingId),
  startTrip
);

router.post(
  "/:bookingId/end",
  requireRole(ROLES.DRIVER),
  validateRequest(tripValidationSchemas.endTrip),
  endTrip
);

router.post(
  "/:bookingId/confirm-cash-payment",
  requireRole(ROLES.DRIVER),
  validateRequest(tripValidationSchemas.bookingId),
  confirmPayment
);

module.exports = router;

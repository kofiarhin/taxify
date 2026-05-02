const express = require("express");
const { z } = require("zod");
const { ROLES } = require("../constants/roles");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const { validateRequest } = require("../middleware/validateRequest");
const { driverValidationSchemas } = require("../validators/driverValidators");
const {
  register,
  list,
  getPending,
  approve,
  suspend,
  reactivate,
  deactivate,
  me,
} = require("../controllers/driverController");

const router = express.Router();

const driverActionSchema = z.object({
  body: z.object({
    reason: z.string().min(3).optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.object({}),
});

router.post("/register", validateRequest(driverValidationSchemas.register), register);
router.get("/me", auth, requireRole(ROLES.DRIVER), me);
router.get("/", auth, requireRole(ROLES.ADMIN), list);
router.get("/pending", auth, requireRole(ROLES.ADMIN), getPending);
router.post("/:id/approve", auth, requireRole(ROLES.ADMIN), validateRequest(driverActionSchema), approve);
router.post("/:id/suspend", auth, requireRole(ROLES.ADMIN), validateRequest(driverActionSchema), suspend);
router.post("/:id/reactivate", auth, requireRole(ROLES.ADMIN), validateRequest(driverActionSchema), reactivate);
router.post("/:id/deactivate", auth, requireRole(ROLES.ADMIN), validateRequest(driverActionSchema), deactivate);

module.exports = router;

const express = require("express");
const { z } = require("zod");
const { ROLES } = require("../constants/roles");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const { validateRequest } = require("../middleware/validateRequest");
const { listUsers, createUser } = require("../controllers/userController");

const router = express.Router();

const createUserSchema = z.object({
  body: z.object({
    role: z.enum([ROLES.ADMIN, ROLES.AGENT]),
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(7),
    password: z.string().min(8),
  }),
  params: z.object({}),
  query: z.object({}),
});

router.use(auth, requireRole(ROLES.ADMIN));
router.get("/", listUsers);
router.post("/", validateRequest(createUserSchema), createUser);

module.exports = router;

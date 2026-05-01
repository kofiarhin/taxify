const express = require("express");
const { z } = require("zod");
const { auth } = require("../middleware/auth");
const { validateRequest } = require("../middleware/validateRequest");
const { login, logout, me } = require("../controllers/authController");

const router = express.Router();

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
  params: z.object({}),
  query: z.object({}),
});

router.post("/login", validateRequest(loginSchema), login);
router.post("/logout", logout);
router.get("/me", auth, me);

module.exports = router;

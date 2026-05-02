const express = require("express");
const { z } = require("zod");
const { auth } = require("../middleware/auth");
const { validateRequest } = require("../middleware/validateRequest");
const { login, registerClient, logout, me } = require("../controllers/authController");

const router = express.Router();

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
  params: z.object({}),
  query: z.object({}),
});

const registerClientSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).max(120),
    email: z.string().email(),
    phone: z.string().min(7).max(40),
    password: z.string().min(8),
  }),
  params: z.object({}),
  query: z.object({}),
});

router.post("/login", validateRequest(loginSchema), login);
router.post("/register-client", validateRequest(registerClientSchema), registerClient);
router.post("/logout", logout);
router.get("/me", auth, me);

module.exports = router;

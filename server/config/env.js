const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config();

function parseAllowedOrigins(value) {
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().min(8, "JWT_SECRET must be at least 8 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CLIENT_URL: z
    .string()
    .default("http://localhost:5173,http://localhost:5174")
    .transform(parseAllowedOrigins),
  DEMO_SEED_ENABLED: z.string().default("true").transform((value) => value === "true"),
  ASSIGNMENT_TIMEOUT_MS: z.coerce.number().int().positive().default(5 * 60 * 1000),
  ASSIGNMENT_SWEEP_INTERVAL_MS: z.coerce.number().int().positive().default(30 * 1000),
  COMMISSION_RATE: z.coerce.number().positive().default(0.1),
  COMMISSION_PAYMENT_GRACE_DAYS: z.coerce.number().int().nonnegative().default(7),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration", parsedEnv.error.flatten().fieldErrors);
  throw new Error("Environment validation failed");
}

module.exports = { env: parsedEnv.data };

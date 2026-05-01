const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const rateLimit = require("express-rate-limit");
const { env } = require("./config/env");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const driverRoutes = require("./routes/driverRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const tripRoutes = require("./routes/tripRoutes");
const commissionRoutes = require("./routes/commissionRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const { notFound } = require("./middleware/notFound");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.CLIENT_URL.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan(env.NODE_ENV === "test" ? "tiny" : "dev"));
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/v1/health", (_req, res) => {
  res.json({
    success: true,
    data: { status: "ok", timestamp: new Date().toISOString() },
  });
});

app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/drivers", driverRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/assignments", assignmentRoutes);
app.use("/api/v1/trips", tripRoutes);
app.use("/api/v1/commissions", commissionRoutes);
app.use("/api/v1/complaints", complaintRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

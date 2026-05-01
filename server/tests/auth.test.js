process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key";
process.env.JWT_EXPIRES_IN = "1d";
process.env.CLIENT_URL = "http://localhost:5173,http://localhost:5174";
process.env.DEMO_SEED_ENABLED = "false";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/taxify-test";

jest.mock("../models/User", () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
}));

const bcrypt = require("bcryptjs");
const request = require("supertest");
const app = require("../app");
const User = require("../models/User");

describe("auth flow", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("logs in an active admin user", async () => {
    const passwordHash = await bcrypt.hash("TaxifyPass123", 10);
    const fakeUser = {
      _id: "6812af83566757d63aeb0001",
      role: "ADMIN",
      fullName: "Mara Ellison",
      email: "admin@taxify.local",
      phone: "+1 (312) 847-1928",
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      passwordHash,
      save: jest.fn().mockResolvedValue(true),
    };

    User.findOne.mockResolvedValue(fakeUser);

    const response = await request(app).post("/api/v1/auth/login").send({
      email: "admin@taxify.local",
      password: "TaxifyPass123",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.token).toBeTruthy();
    expect(response.body.data.user.email).toBe("admin@taxify.local");
  });

  it("rejects access to /auth/me without a token", async () => {
    const response = await request(app).get("/api/v1/auth/me");

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });
});

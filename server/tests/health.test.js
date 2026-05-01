process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key";
process.env.JWT_EXPIRES_IN = "1d";
process.env.CLIENT_URL = "http://localhost:5173,http://localhost:5174";
process.env.DEMO_SEED_ENABLED = "false";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/taxify-test";

const request = require("supertest");
const app = require("../app");

describe("GET /api/v1/health", () => {
  it("returns a healthy response", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("ok");
  });
});

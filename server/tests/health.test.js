const { request, app } = require("./helpers/testUtils");

describe("GET /api/v1/health", () => {
  it("returns a healthy response", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("ok");
  });
});

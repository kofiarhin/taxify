const { request, app, createUser } = require("./helpers/testUtils");

describe("auth flow", () => {
  it("logs in an active admin user", async () => {
    await createUser({
      role: "ADMIN",
      fullName: "Mara Ellison",
      email: "admin@taxify.local",
      password: "TaxifyPass123",
    });

    const response = await request(app).post("/api/v1/auth/login").send({
      email: "admin@taxify.local",
      password: "TaxifyPass123",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeTruthy();
    expect(response.body.data.user.email).toBe("admin@taxify.local");
  });

  it("rejects access to /auth/me without a token", async () => {
    const response = await request(app).get("/api/v1/auth/me");

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("registers a client account without exposing password hashes", async () => {
    const response = await request(app).post("/api/v1/auth/register-client").send({
      fullName: "Avery Mensah",
      email: "avery.client@taxify.local",
      phone: "+1 (312) 847-3049",
      password: "TaxifyPass123",
    });

    expect(response.statusCode).toBe(201);
    expect(response.body.data.token).toBeTruthy();
    expect(response.body.data.user.role).toBe("CLIENT");
    expect(response.body.data.user.passwordHash).toBeUndefined();
  });
});

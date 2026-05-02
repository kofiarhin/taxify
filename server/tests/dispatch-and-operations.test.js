const Booking = require("../models/Booking");
const Trip = require("../models/Trip");
const Complaint = require("../models/Complaint");
const AssignmentAttempt = require("../models/AssignmentAttempt");
const CommissionStatement = require("../models/CommissionStatement");
const DriverProfile = require("../models/DriverProfile");
const { cancelBooking: cancelBookingService } = require("../services/bookingCancellationService");
const { expirePendingAssignments } = require("../services/assignmentService");
const { syncDriverSuspension } = require("../services/driverStatusService");
const { reconcileMonthlyCommissions } = require("../services/commissionService");
const { getDriverLifecycleState } = require("../services/lifecycleService");
const {
  app,
  request,
  createAuthenticatedRequest,
  createDriverAccount,
  getAuthHeader,
} = require("./helpers/testUtils");
const { ROLES } = require("../constants/roles");
const {
  BOOKING_STATUSES,
  DRIVER_STATUSES,
  ASSIGNMENT_STATUSES,
  COMMISSION_STATUSES,
  LIFECYCLE_REASONS,
} = require("../constants/statuses");

function bookingPayload(overrides = {}) {
  return {
    customerName: "Nadia Mercer",
    customerPhone: "+1 (415) 882-1093",
    pickupAddress: "12 Market Road, London",
    dropoffAddress: "88 Bishopsgate, London",
    pickupTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    estimatedFare: 18.5,
    specialInstructions: "Call on arrival",
    ...overrides,
  };
}

async function createBookingVia(role, payload = bookingPayload()) {
  const actor = await createAuthenticatedRequest(role);
  const response = await request(app)
    .post("/api/v1/bookings")
    .set(actor.headers)
    .send(payload);

  return { actor, response };
}

describe("dispatch and operations flow", () => {
  it("allows admin and agent booking creation", async () => {
    const driver = await createDriverAccount();

    const adminCreate = await createBookingVia(ROLES.ADMIN);
    expect(adminCreate.response.statusCode).toBe(201);
    expect(adminCreate.response.body.data.booking.status).toBe(BOOKING_STATUSES.ASSIGNED);

    driver.driverProfile.currentAssignmentId = null;
    await driver.driverProfile.save();

    const agentCreate = await createBookingVia(ROLES.AGENT, bookingPayload({ customerName: "Elias Stone" }));
    expect(agentCreate.response.statusCode).toBe(201);
    expect(agentCreate.response.body.data.booking.customerName).toBe("Elias Stone");
  });

  it("auto-assigns when an active driver exists and queues when none exists", async () => {
    const { driverProfile } = await createDriverAccount();
    const assigned = await createBookingVia(ROLES.AGENT);
    const attempt = await AssignmentAttempt.findOne({
      bookingId: assigned.response.body.data.booking._id,
      driverId: driverProfile._id,
    });
    const refreshedDriver = await DriverProfile.findById(driverProfile._id);

    expect(assigned.response.body.data.booking.status).toBe(BOOKING_STATUSES.ASSIGNED);
    expect(String(assigned.response.body.data.booking.assignedDriverId)).toBe(String(driverProfile._id));
    expect(attempt.status).toBe(ASSIGNMENT_STATUSES.PENDING);
    expect(refreshedDriver.status).toBe(DRIVER_STATUSES.BUSY);
    expect(String(refreshedDriver.currentAssignmentId)).toBe(String(attempt._id));
    expect(refreshedDriver.lastAssignedAt).toBeInstanceOf(Date);

    await DriverProfile.deleteMany({});

    const queued = await createBookingVia(ROLES.AGENT, bookingPayload({ customerName: "Lina Frost" }));
    expect(queued.response.body.data.booking.status).toBe(BOOKING_STATUSES.QUEUED);
  });

  it("does not assign a driver with an active pending assignment", async () => {
    const busyDriver = await createDriverAccount({ vehiclePlate: "TX-BUSY" });
    const availableDriver = await createDriverAccount({ vehiclePlate: "TX-FREE" });
    const existingBooking = await Booking.create({
      ...bookingPayload({ customerName: "Existing Customer" }),
      bookingReference: "TXF-EXISTING",
      createdBy: busyDriver.user._id,
      status: BOOKING_STATUSES.ASSIGNED,
      assignedDriverId: busyDriver.driverProfile._id,
    });
    const pendingAttempt = await AssignmentAttempt.create({
      bookingId: existingBooking._id,
      driverId: busyDriver.driverProfile._id,
      attemptNumber: 1,
      status: ASSIGNMENT_STATUSES.PENDING,
      expiresAt: new Date(Date.now() + 60000),
    });
    await DriverProfile.findByIdAndUpdate(busyDriver.driverProfile._id, {
      status: DRIVER_STATUSES.BUSY,
      currentAssignmentId: pendingAttempt._id,
    });

    const created = await createBookingVia(ROLES.AGENT);

    expect(created.response.statusCode).toBe(201);
    expect(created.response.body.data.booking.status).toBe(BOOKING_STATUSES.ASSIGNED);
    expect(String(created.response.body.data.booking.assignedDriverId)).toBe(
      String(availableDriver.driverProfile._id)
    );
  });

  it("excludes suspended drivers from auto-dispatch", async () => {
    await createDriverAccount({ status: DRIVER_STATUSES.SUSPENDED });

    const queued = await createBookingVia(ROLES.AGENT);

    expect(queued.response.statusCode).toBe(201);
    expect(queued.response.body.data.booking.status).toBe(BOOKING_STATUSES.QUEUED);
    expect(queued.response.body.data.booking.assignedDriverId).toBeNull();
  });

  it("excludes deactivated drivers from auto-dispatch", async () => {
    await createDriverAccount({ status: DRIVER_STATUSES.DEACTIVATED });

    const queued = await createBookingVia(ROLES.AGENT);

    expect(queued.response.statusCode).toBe(201);
    expect(queued.response.body.data.booking.status).toBe(BOOKING_STATUSES.QUEUED);
    expect(queued.response.body.data.booking.assignedDriverId).toBeNull();
  });

  it("lists real driver profiles for admins without password hashes", async () => {
    const admin = await createAuthenticatedRequest(ROLES.ADMIN);
    const driver = await createDriverAccount({ vehiclePlate: "TX-LIST" });

    const response = await request(app)
      .get("/api/v1/drivers")
      .set(admin.headers);

    expect(response.statusCode).toBe(200);
    expect(response.body.data.drivers).toHaveLength(1);
    expect(response.body.data.drivers[0]._id).toBe(String(driver.driverProfile._id));
    expect(response.body.data.drivers[0].status).toBe(DRIVER_STATUSES.ACTIVE);
    expect(response.body.data.drivers[0].userId.email).toBe(driver.user.email);
    expect(response.body.data.drivers[0].userId.passwordHash).toBeUndefined();
    expect(response.body.data.drivers[0]).toHaveProperty("currentAssignmentId");
  });

  it("requeues expired assignments and restores driver availability", async () => {
    const expiredDriver = await createDriverAccount({ vehiclePlate: "TX-EXP1" });
    const nextDriver = await createDriverAccount({ vehiclePlate: "TX-EXP2" });
    const created = await createBookingVia(ROLES.AGENT);

    const booking = await Booking.findById(created.response.body.data.booking._id);
    const attempt = await AssignmentAttempt.findOne({ bookingId: booking._id, driverId: expiredDriver.driverProfile._id });

    attempt.expiresAt = new Date(Date.now() - 1000);
    await attempt.save();

    const results = await expirePendingAssignments(new Date());
    expect(results).toHaveLength(1);

    const refreshedAttempt = await AssignmentAttempt.findById(attempt._id);
    const refreshedBooking = await Booking.findById(booking._id);
    const refreshedExpiredDriver = await DriverProfile.findById(expiredDriver.driverProfile._id);
    const refreshedNextDriver = await DriverProfile.findById(nextDriver.driverProfile._id);

    expect(refreshedAttempt.status).toBe("TIMEOUT");
    expect(refreshedBooking.status).toBe(BOOKING_STATUSES.ASSIGNED);
    expect(String(refreshedBooking.assignedDriverId)).toBe(String(refreshedNextDriver._id));
    expect(refreshedExpiredDriver.status).toBe(DRIVER_STATUSES.ACTIVE);
    expect(refreshedExpiredDriver.currentAssignmentId).toBeNull();
    expect(refreshedNextDriver.currentAssignmentId).not.toBeNull();
  });

  it("lets a driver accept, reject, start, and end trips with fare calculation", async () => {
    const firstDriver = await createDriverAccount({ vehiclePlate: "TX-DRV1" });
    const secondDriver = await createDriverAccount({ vehiclePlate: "TX-DRV2" });
    const created = await createBookingVia(ROLES.ADMIN);
    const bookingId = created.response.body.data.booking._id;
    const firstAttempt = await AssignmentAttempt.findOne({ bookingId, driverId: firstDriver.driverProfile._id });

    const rejectResponse = await request(app)
      .post(`/api/v1/assignments/${firstAttempt._id}/reject`)
      .set(getAuthHeader(firstDriver.user))
      .send({ reason: "Too far away" });

    expect(rejectResponse.statusCode).toBe(200);

    const reassignedAttempt = await AssignmentAttempt.findOne({
      bookingId,
      driverId: secondDriver.driverProfile._id,
      status: "PENDING",
    });
    expect(reassignedAttempt).toBeTruthy();

    const acceptResponse = await request(app)
      .post(`/api/v1/assignments/${reassignedAttempt._id}/accept`)
      .set(getAuthHeader(secondDriver.user))
      .send({});

    expect(acceptResponse.statusCode).toBe(200);
    expect(acceptResponse.body.data.booking.status).toBe(BOOKING_STATUSES.ACCEPTED);

    const startResponse = await request(app)
      .post(`/api/v1/trips/${bookingId}/start`)
      .set(getAuthHeader(secondDriver.user))
      .send({});

    expect(startResponse.statusCode).toBe(201);

    const trip = await Trip.findOne({ bookingId });
    trip.startedAt = new Date(Date.now() - 15 * 60 * 1000);
    await trip.save();

    const endResponse = await request(app)
      .post(`/api/v1/trips/${bookingId}/end`)
      .set(getAuthHeader(secondDriver.user))
      .send({});

    expect(endResponse.statusCode).toBe(200);
    expect(endResponse.body.data.trip.durationMinutes).toBeGreaterThanOrEqual(15);
    expect(endResponse.body.data.trip.fare).toBeGreaterThanOrEqual(20);
    expect(endResponse.body.data.booking.status).toBe(BOOKING_STATUSES.PAYMENT_PENDING);
  });

  it("calculates fare with base plus duration when distance is omitted", async () => {
    const driver = await createDriverAccount();
    const created = await createBookingVia(ROLES.AGENT);
    const bookingId = created.response.body.data.booking._id;
    const attempt = await AssignmentAttempt.findOne({ bookingId, driverId: driver.driverProfile._id });

    await request(app)
      .post(`/api/v1/assignments/${attempt._id}/accept`)
      .set(getAuthHeader(driver.user))
      .send({});
    await request(app)
      .post(`/api/v1/trips/${bookingId}/start`)
      .set(getAuthHeader(driver.user))
      .send({});

    const trip = await Trip.findOne({ bookingId });
    trip.startedAt = new Date(Date.now() - 12 * 60 * 1000);
    await trip.save();

    const endResponse = await request(app)
      .post(`/api/v1/trips/${bookingId}/end`)
      .set(getAuthHeader(driver.user))
      .send({});

    expect(endResponse.statusCode).toBe(200);
    expect(endResponse.body.data.trip.fare).toBeGreaterThanOrEqual(17);
    expect(endResponse.body.data.trip.fareBreakdown.baseFare).toBe(5);
    expect(endResponse.body.data.trip.fareBreakdown.distanceFare).toBe(0);
  });

  it("calculates fare with distance", async () => {
    const driver = await createDriverAccount();
    const created = await createBookingVia(ROLES.AGENT);
    const bookingId = created.response.body.data.booking._id;
    const attempt = await AssignmentAttempt.findOne({ bookingId, driverId: driver.driverProfile._id });

    await request(app)
      .post(`/api/v1/assignments/${attempt._id}/accept`)
      .set(getAuthHeader(driver.user))
      .send({});
    await request(app)
      .post(`/api/v1/trips/${bookingId}/start`)
      .set(getAuthHeader(driver.user))
      .send({});

    const trip = await Trip.findOne({ bookingId });
    trip.startedAt = new Date(Date.now() - 10 * 60 * 1000);
    await trip.save();

    const endResponse = await request(app)
      .post(`/api/v1/trips/${bookingId}/end`)
      .set(getAuthHeader(driver.user))
      .send({ distanceKm: 4 });

    expect(endResponse.statusCode).toBe(200);
    expect(endResponse.body.data.trip.distanceKm).toBe(4);
    expect(endResponse.body.data.trip.fare).toBeGreaterThanOrEqual(23);
    expect(endResponse.body.data.trip.fareBreakdown.distanceFare).toBe(8);
  });

  it("uses a manual fare override", async () => {
    const driver = await createDriverAccount();
    const created = await createBookingVia(ROLES.AGENT);
    const bookingId = created.response.body.data.booking._id;
    const attempt = await AssignmentAttempt.findOne({ bookingId, driverId: driver.driverProfile._id });

    await request(app)
      .post(`/api/v1/assignments/${attempt._id}/accept`)
      .set(getAuthHeader(driver.user))
      .send({});
    await request(app)
      .post(`/api/v1/trips/${bookingId}/start`)
      .set(getAuthHeader(driver.user))
      .send({});

    const endResponse = await request(app)
      .post(`/api/v1/trips/${bookingId}/end`)
      .set(getAuthHeader(driver.user))
      .send({ manualFare: 42.75, fareNotes: "Dispatcher override" });

    expect(endResponse.statusCode).toBe(200);
    expect(endResponse.body.data.trip.fare).toBe(42.75);
    expect(endResponse.body.data.trip.isManualFareOverride).toBe(true);
    expect(endResponse.body.data.trip.fareNotes).toBe("Dispatcher override");
  });

  it("confirms cash payment, creates 10 percent commission, and keeps driver active before due date", async () => {
    const driver = await createDriverAccount();
    const created = await createBookingVia(ROLES.AGENT);
    const bookingId = created.response.body.data.booking._id;
    const attempt = await AssignmentAttempt.findOne({ bookingId, driverId: driver.driverProfile._id });

    await request(app)
      .post(`/api/v1/assignments/${attempt._id}/accept`)
      .set(getAuthHeader(driver.user))
      .send({});
    await request(app)
      .post(`/api/v1/trips/${bookingId}/start`)
      .set(getAuthHeader(driver.user))
      .send({});

    const trip = await Trip.findOne({ bookingId });
    trip.startedAt = new Date(Date.now() - 20 * 60 * 1000);
    await trip.save();

    await request(app)
      .post(`/api/v1/trips/${bookingId}/end`)
      .set(getAuthHeader(driver.user))
      .send({});

    const payResponse = await request(app)
      .post(`/api/v1/trips/${bookingId}/confirm-cash-payment`)
      .set(getAuthHeader(driver.user))
      .send({});

    expect(payResponse.statusCode).toBe(200);
    expect(payResponse.body.data.booking.status).toBe(BOOKING_STATUSES.PAID);

    const updatedTrip = await Trip.findOne({ bookingId });
    const statement = await CommissionStatement.findOne({ driverId: driver.driverProfile._id });
    const refreshedDriver = await DriverProfile.findById(driver.driverProfile._id);

    expect(updatedTrip.paymentStatus).toBe("PAID");
    expect(statement.status).toBe(COMMISSION_STATUSES.DUE);
    expect(statement.commissionTotal).toBeCloseTo(updatedTrip.fare * 0.1, 2);
    expect(refreshedDriver.status).toBe(DRIVER_STATUSES.ACTIVE);
  });

  it("submits, approves, rejects, and settles commission with valid transitions", async () => {
    const admin = await createAuthenticatedRequest(ROLES.ADMIN);
    const driver = await createDriverAccount();

    const statement = await CommissionStatement.create({
      driverId: driver.driverProfile._id,
      periodMonth: 4,
      periodYear: 2026,
      tripIds: [],
      grossTripRevenue: 200,
      commissionRate: 0.1,
      commissionTotal: 20,
      amountPaid: 0,
      balanceDue: 20,
      dueDate: new Date("2026-05-07T23:59:59.999Z"),
      status: COMMISSION_STATUSES.DUE,
    });

    const submitResponse = await request(app)
      .post(`/api/v1/commissions/${statement._id}/submit-receipt`)
      .set(getAuthHeader(driver.user))
      .attach("receipt", Buffer.from("receipt-binary"), "receipt.png");

    expect(submitResponse.statusCode).toBe(200);
    expect(submitResponse.body.data.statement.status).toBe(COMMISSION_STATUSES.SUBMITTED);

    const rejectResponse = await request(app)
      .post(`/api/v1/commissions/${statement._id}/reject`)
      .set(admin.headers)
      .send({ notes: "Receipt unreadable" });

    expect(rejectResponse.statusCode).toBe(200);
    expect(rejectResponse.body.data.statement.status).toBe(COMMISSION_STATUSES.REJECTED);
    expect(rejectResponse.body.data.statement.rejectionReason).toBe("Receipt unreadable");

    const resubmitResponse = await request(app)
      .post(`/api/v1/commissions/${statement._id}/submit-receipt`)
      .set(getAuthHeader(driver.user))
      .attach("receipt", Buffer.from("receipt-binary-2"), "receipt-2.png");

    expect(resubmitResponse.statusCode).toBe(200);

    const approveResponse = await request(app)
      .post(`/api/v1/commissions/${statement._id}/approve`)
      .set(admin.headers)
      .send({ notes: "Receipt verified" });

    expect(approveResponse.statusCode).toBe(200);
    expect(approveResponse.body.data.statement.status).toBe(COMMISSION_STATUSES.APPROVED);

    const settleResponse = await request(app)
      .post(`/api/v1/commissions/${statement._id}/settle`)
      .set(admin.headers)
      .send({ notes: "Settlement complete" });

    expect(settleResponse.statusCode).toBe(200);
    expect(settleResponse.body.data.statement.status).toBe(COMMISSION_STATUSES.SETTLED);

    const refreshedDriver = await DriverProfile.findById(driver.driverProfile._id);
    expect(refreshedDriver.commissionDebt).toBe(0);
  });

  it("suspends a driver when unpaid overdue commission exceeds the suspension threshold", async () => {
    const driver = await createDriverAccount({ commissionDebt: 30 });
    await CommissionStatement.create({
      driverId: driver.driverProfile._id,
      periodMonth: 3,
      periodYear: 2026,
      tripIds: [],
      grossTripRevenue: 300,
      commissionRate: 0.1,
      commissionTotal: 30,
      amountPaid: 0,
      balanceDue: 30,
      dueDate: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
      status: COMMISSION_STATUSES.DUE,
    });

    await syncDriverSuspension(driver.driverProfile._id, new Date());

    const suspendedDriver = await DriverProfile.findById(driver.driverProfile._id);
    expect(suspendedDriver.status).toBe(DRIVER_STATUSES.SUSPENDED);
  });

  it("deactivates a driver when unpaid overdue commission exceeds the deactivation threshold", async () => {
    const driver = await createDriverAccount({ commissionDebt: 60 });
    await CommissionStatement.create({
      driverId: driver.driverProfile._id,
      periodMonth: 1,
      periodYear: 2026,
      tripIds: [],
      grossTripRevenue: 600,
      commissionRate: 0.1,
      commissionTotal: 60,
      amountPaid: 0,
      balanceDue: 60,
      dueDate: new Date(Date.now() - 61 * 24 * 60 * 60 * 1000),
      status: COMMISSION_STATUSES.DUE,
    });

    await syncDriverSuspension(driver.driverProfile._id, new Date());

    const deactivatedDriver = await DriverProfile.findById(driver.driverProfile._id);
    expect(deactivatedDriver.status).toBe(DRIVER_STATUSES.DEACTIVATED);
    expect(deactivatedDriver.deactivationReason).toBe("Long-term overdue commission payment");
  });

  it("reconciles monthly commissions from paid trips and applies lifecycle updates", async () => {
    const agent = await createAuthenticatedRequest(ROLES.AGENT);
    const driver = await createDriverAccount({ commissionDebt: 0 });
    const booking = await Booking.create({
      ...bookingPayload(),
      bookingReference: "TXF-20260415-RECON",
      createdBy: agent.user._id,
      status: BOOKING_STATUSES.PAID,
      assignedDriverId: driver.driverProfile._id,
      finalFare: 100,
      completedAt: new Date("2026-04-15T10:00:00.000Z"),
      paidAt: new Date("2026-04-15T10:05:00.000Z"),
    });
    await Trip.create({
      bookingId: booking._id,
      driverId: driver.driverProfile._id,
      startedAt: new Date("2026-04-15T09:30:00.000Z"),
      endedAt: new Date("2026-04-15T10:00:00.000Z"),
      durationMinutes: 30,
      fare: 100,
      commissionAmount: 10,
      paymentStatus: "PAID",
      paymentConfirmedAt: new Date("2026-04-15T10:05:00.000Z"),
    });

    const result = await reconcileMonthlyCommissions({
      now: new Date("2026-05-10T00:00:00.000Z"),
    });

    const statement = await CommissionStatement.findOne({ driverId: driver.driverProfile._id });
    const refreshedDriver = await DriverProfile.findById(driver.driverProfile._id);

    expect(result.createdCount).toBe(1);
    expect(statement.periodMonth).toBe(4);
    expect(statement.periodYear).toBe(2026);
    expect(statement.grossTripRevenue).toBe(100);
    expect(statement.commissionTotal).toBe(10);
    expect(statement.balanceDue).toBe(10);
    expect(refreshedDriver.commissionDebt).toBe(10);
    expect(refreshedDriver.status).toBe(DRIVER_STATUSES.ACTIVE);
  });

  it("reconciliation endpoint returns a production summary and does not duplicate statements", async () => {
    const admin = await createAuthenticatedRequest(ROLES.ADMIN);
    const agent = await createAuthenticatedRequest(ROLES.AGENT);
    const driver = await createDriverAccount({ commissionDebt: 0 });
    const booking = await Booking.create({
      ...bookingPayload(),
      bookingReference: "TXF-20260420-ADMIN",
      createdBy: agent.user._id,
      status: BOOKING_STATUSES.PAID,
      assignedDriverId: driver.driverProfile._id,
      finalFare: 100,
      completedAt: new Date("2026-04-20T10:00:00.000Z"),
      paidAt: new Date("2026-04-20T10:05:00.000Z"),
    });
    await Trip.create({
      bookingId: booking._id,
      driverId: driver.driverProfile._id,
      startedAt: new Date("2026-04-20T09:30:00.000Z"),
      endedAt: new Date("2026-04-20T10:00:00.000Z"),
      durationMinutes: 30,
      fare: 100,
      commissionAmount: 10,
      paymentStatus: "PAID",
      paymentConfirmedAt: new Date("2026-04-20T10:05:00.000Z"),
    });

    const firstResponse = await request(app)
      .post("/api/v1/admin/commission/reconcile")
      .set(admin.headers)
      .send({});
    const secondResponse = await request(app)
      .post("/api/v1/admin/commission/reconcile")
      .set(admin.headers)
      .send({});

    expect(firstResponse.statusCode).toBe(200);
    expect(firstResponse.body.data.summary).toMatchObject({
      driversChecked: 1,
      statementsCreated: 1,
      driversSuspended: 0,
      driversDeactivated: 0,
      errors: [],
    });
    expect(secondResponse.body.data.summary.statementsCreated).toBe(0);
    expect(await CommissionStatement.countDocuments({ driverId: driver.driverProfile._id })).toBe(1);
  });

  it("restores an auto-suspended driver after approved settlement clears debt", async () => {
    const admin = await createAuthenticatedRequest(ROLES.ADMIN);
    const driver = await createDriverAccount({ commissionDebt: 30 });
    const statement = await CommissionStatement.create({
      driverId: driver.driverProfile._id,
      periodMonth: 3,
      periodYear: 2026,
      tripIds: [],
      grossTripRevenue: 300,
      commissionRate: 0.1,
      commissionTotal: 30,
      amountPaid: 0,
      balanceDue: 30,
      dueDate: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
      status: COMMISSION_STATUSES.SUBMITTED,
    });

    await syncDriverSuspension(driver.driverProfile._id, new Date());
    expect((await DriverProfile.findById(driver.driverProfile._id)).status).toBe(DRIVER_STATUSES.SUSPENDED);

    const approveResponse = await request(app)
      .post(`/api/v1/commissions/${statement._id}/approve`)
      .set(admin.headers)
      .send({ settleImmediately: true });

    expect(approveResponse.statusCode).toBe(200);
    const refreshedDriver = await DriverProfile.findById(driver.driverProfile._id);
    expect(refreshedDriver.status).toBe(DRIVER_STATUSES.ACTIVE);
    expect(refreshedDriver.commissionDebt).toBe(0);
  });

  it("does not auto-reactivate a manually suspended driver after debt clears", async () => {
    const driver = await createDriverAccount({
      status: DRIVER_STATUSES.SUSPENDED,
      lifecycleReason: LIFECYCLE_REASONS.MANUAL,
      suspensionReason: "Manual review",
      suspendedAt: new Date(),
      commissionDebt: 0,
    });

    await syncDriverSuspension(driver.driverProfile._id, new Date());

    const refreshedDriver = await DriverProfile.findById(driver.driverProfile._id);
    expect(refreshedDriver.status).toBe(DRIVER_STATUSES.SUSPENDED);
    expect(refreshedDriver.lifecycleReason).toBe(LIFECYCLE_REASONS.MANUAL);
  });

  it("does not auto-reactivate a manually deactivated driver after debt clears", async () => {
    const driver = await createDriverAccount({
      status: DRIVER_STATUSES.DEACTIVATED,
      lifecycleReason: LIFECYCLE_REASONS.MANUAL,
      deactivationReason: "Manual offboarding",
      deactivatedAt: new Date(),
      commissionDebt: 0,
    });

    await syncDriverSuspension(driver.driverProfile._id, new Date());

    const refreshedDriver = await DriverProfile.findById(driver.driverProfile._id);
    expect(refreshedDriver.status).toBe(DRIVER_STATUSES.DEACTIVATED);
    expect(refreshedDriver.lifecycleReason).toBe(LIFECYCLE_REASONS.MANUAL);
  });

  it("does not activate a pending approval driver from commission cleanup", async () => {
    const driver = await createDriverAccount({
      status: DRIVER_STATUSES.PENDING_APPROVAL,
      commissionDebt: 0,
    });

    await syncDriverSuspension(driver.driverProfile._id, new Date());

    const refreshedDriver = await DriverProfile.findById(driver.driverProfile._id);
    expect(refreshedDriver.status).toBe(DRIVER_STATUSES.PENDING_APPROVAL);
  });

  it("cancels a queued booking idempotently", async () => {
    const agent = await createAuthenticatedRequest(ROLES.AGENT);
    const created = await createBookingVia(ROLES.AGENT);
    const bookingId = created.response.body.data.booking._id;

    expect(created.response.body.data.booking.status).toBe(BOOKING_STATUSES.QUEUED);

    const cancelResponse = await request(app)
      .post(`/api/v1/bookings/${bookingId}/cancel`)
      .set(agent.headers)
      .send({ reason: "Customer cancelled" });
    const secondCancelResponse = await request(app)
      .post(`/api/v1/bookings/${bookingId}/cancel`)
      .set(agent.headers)
      .send({ reason: "Customer cancelled" });

    expect(cancelResponse.statusCode).toBe(200);
    expect(cancelResponse.body.data.booking.status).toBe(BOOKING_STATUSES.CANCELLED);
    expect(cancelResponse.body.data.booking.assignedDriverId).toBeNull();
    expect(secondCancelResponse.statusCode).toBe(200);
    expect(secondCancelResponse.body.data.booking.status).toBe(BOOKING_STATUSES.CANCELLED);
  });

  it("cancels an assigned booking and releases the driver assignment", async () => {
    const agent = await createAuthenticatedRequest(ROLES.AGENT);
    const driver = await createDriverAccount();
    const created = await createBookingVia(ROLES.AGENT);
    const bookingId = created.response.body.data.booking._id;
    const attempt = await AssignmentAttempt.findOne({ bookingId, driverId: driver.driverProfile._id });

    const cancelResponse = await request(app)
      .post(`/api/v1/bookings/${bookingId}/cancel`)
      .set(agent.headers)
      .send({ reason: "Customer cancelled" });

    const refreshedAttempt = await AssignmentAttempt.findById(attempt._id);
    const refreshedDriver = await DriverProfile.findById(driver.driverProfile._id);
    const refreshedBooking = await Booking.findById(bookingId);

    expect(cancelResponse.statusCode).toBe(200);
    expect(refreshedAttempt.status).toBe("CANCELLED");
    expect(refreshedDriver.status).toBe(DRIVER_STATUSES.ACTIVE);
    expect(refreshedDriver.currentAssignmentId).toBeNull();
    expect(refreshedBooking.assignedDriverId).toBeNull();
  });

  it("cancels an accepted booking and releases the driver assignment", async () => {
    const agent = await createAuthenticatedRequest(ROLES.AGENT);
    const driver = await createDriverAccount();
    const created = await createBookingVia(ROLES.AGENT);
    const bookingId = created.response.body.data.booking._id;
    const attempt = await AssignmentAttempt.findOne({ bookingId, driverId: driver.driverProfile._id });

    await request(app)
      .post(`/api/v1/assignments/${attempt._id}/accept`)
      .set(getAuthHeader(driver.user))
      .send({});

    const cancelResponse = await request(app)
      .post(`/api/v1/bookings/${bookingId}/cancel`)
      .set(agent.headers)
      .send({ reason: "Customer cancelled" });

    const refreshedAttempt = await AssignmentAttempt.findById(attempt._id);
    const refreshedDriver = await DriverProfile.findById(driver.driverProfile._id);
    const refreshedBooking = await Booking.findById(bookingId);

    expect(cancelResponse.statusCode).toBe(200);
    expect(refreshedAttempt.status).toBe("CANCELLED");
    expect(refreshedDriver.status).toBe(DRIVER_STATUSES.ACTIVE);
    expect(refreshedDriver.currentAssignmentId).toBeNull();
    expect(refreshedBooking.assignedDriverId).toBeNull();
    expect(refreshedBooking.acceptedAt).toBeNull();
  });

  it("does not reactivate a suspended driver during cancellation cleanup", async () => {
    const agent = await createAuthenticatedRequest(ROLES.AGENT);
    const driver = await createDriverAccount();
    const created = await createBookingVia(ROLES.AGENT);
    const bookingId = created.response.body.data.booking._id;
    const attempt = await AssignmentAttempt.findOne({ bookingId, driverId: driver.driverProfile._id });

    await DriverProfile.findByIdAndUpdate(driver.driverProfile._id, {
      status: DRIVER_STATUSES.SUSPENDED,
      suspensionReason: "Manual review",
    });

    const cancelResponse = await request(app)
      .post(`/api/v1/bookings/${bookingId}/cancel`)
      .set(agent.headers)
      .send({ reason: "Customer cancelled" });

    const refreshedAttempt = await AssignmentAttempt.findById(attempt._id);
    const refreshedDriver = await DriverProfile.findById(driver.driverProfile._id);

    expect(cancelResponse.statusCode).toBe(200);
    expect(refreshedAttempt.status).toBe("CANCELLED");
    expect(refreshedDriver.status).toBe(DRIVER_STATUSES.SUSPENDED);
    expect(refreshedDriver.currentAssignmentId).toBeNull();
  });

  it("does not reactivate a deactivated driver during cancellation cleanup", async () => {
    const agent = await createAuthenticatedRequest(ROLES.AGENT);
    const driver = await createDriverAccount();
    const created = await createBookingVia(ROLES.AGENT);
    const bookingId = created.response.body.data.booking._id;
    const attempt = await AssignmentAttempt.findOne({ bookingId, driverId: driver.driverProfile._id });

    await DriverProfile.findByIdAndUpdate(driver.driverProfile._id, {
      status: DRIVER_STATUSES.DEACTIVATED,
      lifecycleReason: LIFECYCLE_REASONS.MANUAL,
      deactivationReason: "Manual offboarding",
    });

    const cancelResponse = await request(app)
      .post(`/api/v1/bookings/${bookingId}/cancel`)
      .set(agent.headers)
      .send({ reason: "Customer cancelled" });

    const refreshedAttempt = await AssignmentAttempt.findById(attempt._id);
    const refreshedDriver = await DriverProfile.findById(driver.driverProfile._id);

    expect(cancelResponse.statusCode).toBe(200);
    expect(refreshedAttempt.status).toBe("CANCELLED");
    expect(refreshedDriver.status).toBe(DRIVER_STATUSES.DEACTIVATED);
    expect(refreshedDriver.currentAssignmentId).toBeNull();
  });

  it("rolls back cancellation cleanup when a transaction-supported cancellation fails", async () => {
    const driver = await createDriverAccount();
    const created = await createBookingVia(ROLES.AGENT);
    const bookingId = created.response.body.data.booking._id;
    const attempt = await AssignmentAttempt.findOne({ bookingId, driverId: driver.driverProfile._id });
    const originalSave = Booking.prototype.save;

    jest.spyOn(Booking.prototype, "save").mockImplementation(function mockedSave(...args) {
      if (this.status === BOOKING_STATUSES.CANCELLED) {
        throw new Error("forced cancellation failure");
      }
      return originalSave.apply(this, args);
    });

    await expect(
      cancelBookingService(bookingId, { reason: "Customer cancelled" })
    ).rejects.toThrow("forced cancellation failure");

    const refreshedAttempt = await AssignmentAttempt.findById(attempt._id);
    const refreshedDriver = await DriverProfile.findById(driver.driverProfile._id);
    const refreshedBooking = await Booking.findById(bookingId);

    expect(refreshedAttempt.status).toBe("PENDING");
    expect(String(refreshedDriver.currentAssignmentId)).toBe(String(attempt._id));
    expect(refreshedBooking.status).toBe(BOOKING_STATUSES.ASSIGNED);
    expect(String(refreshedBooking.assignedDriverId)).toBe(String(driver.driverProfile._id));
  });

  it("evaluates overdue drivers immediately before dispatch and assigns an eligible active driver", async () => {
    const overdueDriver = await createDriverAccount({
      vehiclePlate: "TX-ODUE",
      commissionDebt: 30,
    });
    const activeDriver = await createDriverAccount({ vehiclePlate: "TX-ACTV" });
    await CommissionStatement.create({
      driverId: overdueDriver.driverProfile._id,
      periodMonth: 3,
      periodYear: 2026,
      tripIds: [],
      grossTripRevenue: 300,
      commissionRate: 0.1,
      commissionTotal: 30,
      amountPaid: 0,
      balanceDue: 30,
      dueDate: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
      status: COMMISSION_STATUSES.DUE,
    });

    const created = await createBookingVia(ROLES.AGENT);
    const refreshedOverdueDriver = await DriverProfile.findById(overdueDriver.driverProfile._id);

    expect(created.response.statusCode).toBe(201);
    expect(created.response.body.data.booking.status).toBe(BOOKING_STATUSES.ASSIGNED);
    expect(String(created.response.body.data.booking.assignedDriverId)).toBe(String(activeDriver.driverProfile._id));
    expect(refreshedOverdueDriver.status).toBe(DRIVER_STATUSES.SUSPENDED);
  });

  it("deactivates and skips a long-overdue driver at dispatch time", async () => {
    const overdueDriver = await createDriverAccount({
      vehiclePlate: "TX-LATE",
      commissionDebt: 60,
    });
    const activeDriver = await createDriverAccount({ vehiclePlate: "TX-OKAY" });
    await CommissionStatement.create({
      driverId: overdueDriver.driverProfile._id,
      periodMonth: 1,
      periodYear: 2026,
      tripIds: [],
      grossTripRevenue: 600,
      commissionRate: 0.1,
      commissionTotal: 60,
      amountPaid: 0,
      balanceDue: 60,
      dueDate: new Date(Date.now() - 61 * 24 * 60 * 60 * 1000),
      status: COMMISSION_STATUSES.DUE,
    });

    const created = await createBookingVia(ROLES.AGENT);
    const refreshedOverdueDriver = await DriverProfile.findById(overdueDriver.driverProfile._id);

    expect(created.response.statusCode).toBe(201);
    expect(created.response.body.data.booking.status).toBe(BOOKING_STATUSES.ASSIGNED);
    expect(String(created.response.body.data.booking.assignedDriverId)).toBe(String(activeDriver.driverProfile._id));
    expect(refreshedOverdueDriver.status).toBe(DRIVER_STATUSES.DEACTIVATED);
  });

  it("returns pure lifecycle decisions for active, suspended, deactivated, and manual cases", () => {
    const baseDriver = {
      status: DRIVER_STATUSES.ACTIVE,
      lifecycleReason: LIFECYCLE_REASONS.NONE,
      suspensionReason: "",
      deactivationReason: "",
    };

    expect(
      getDriverLifecycleState(baseDriver, {
        hasSuspendLevelDebt: false,
        hasDeactivateLevelDebt: false,
      }).status
    ).toBe(DRIVER_STATUSES.ACTIVE);

    expect(
      getDriverLifecycleState(baseDriver, {
        hasSuspendLevelDebt: true,
        hasDeactivateLevelDebt: false,
      })
    ).toMatchObject({
      status: DRIVER_STATUSES.SUSPENDED,
      lifecycleReason: LIFECYCLE_REASONS.COMMISSION_OVERDUE,
    });

    expect(
      getDriverLifecycleState(baseDriver, {
        hasSuspendLevelDebt: true,
        hasDeactivateLevelDebt: true,
      })
    ).toMatchObject({
      status: DRIVER_STATUSES.DEACTIVATED,
      lifecycleReason: LIFECYCLE_REASONS.COMMISSION_LONG_OVERDUE,
    });

    expect(
      getDriverLifecycleState(
        {
          ...baseDriver,
          status: DRIVER_STATUSES.SUSPENDED,
          lifecycleReason: LIFECYCLE_REASONS.MANUAL,
          suspensionReason: "Manual review",
        },
        { hasSuspendLevelDebt: false, hasDeactivateLevelDebt: false }
      )
    ).toMatchObject({
      status: DRIVER_STATUSES.SUSPENDED,
      lifecycleReason: LIFECYCLE_REASONS.MANUAL,
    });
  });

  it("defensively clears stale current assignments before dispatch", async () => {
    const driver = await createDriverAccount();
    await DriverProfile.findByIdAndUpdate(driver.driverProfile._id, {
      currentAssignmentId: driver.driverProfile._id,
    });

    const created = await createBookingVia(ROLES.AGENT);
    const refreshedDriver = await DriverProfile.findById(driver.driverProfile._id);

    expect(created.response.statusCode).toBe(201);
    expect(created.response.body.data.booking.status).toBe(BOOKING_STATUSES.ASSIGNED);
    expect(String(created.response.body.data.booking.assignedDriverId)).toBe(String(driver.driverProfile._id));
    expect(String(refreshedDriver.currentAssignmentId)).not.toBe(String(driver.driverProfile._id));
  });

  it("creates complaints and allows admin status updates", async () => {
    const agent = await createAuthenticatedRequest(ROLES.AGENT);
    const admin = await createAuthenticatedRequest(ROLES.ADMIN);

    const createResponse = await request(app)
      .post("/api/v1/complaints")
      .set(agent.headers)
      .send({
        category: "Driver conduct",
        priority: "HIGH",
        description: "Driver argued over the route for fifteen minutes.",
      });

    expect(createResponse.statusCode).toBe(201);
    const complaintId = createResponse.body.data.complaint._id;

    const updateResponse = await request(app)
      .patch(`/api/v1/complaints/${complaintId}`)
      .set(admin.headers)
      .send({ status: "INVESTIGATING", resolutionNotes: "Assigned for review" });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.body.data.complaint.status).toBe("INVESTIGATING");

    const resolveResponse = await request(app)
      .post(`/api/v1/complaints/${complaintId}/resolve`)
      .set(admin.headers)
      .send({ resolutionNotes: "Customer refunded and case closed." });

    expect(resolveResponse.statusCode).toBe(200);
    expect(resolveResponse.body.data.complaint.status).toBe("RESOLVED");
  });

  it("blocks unauthorized roles and invalid inputs", async () => {
    const agent = await createAuthenticatedRequest(ROLES.AGENT);
    const driver = await createAuthenticatedRequest(ROLES.DRIVER);

    const forbiddenTrips = await request(app)
      .get("/api/v1/trips")
      .set(agent.headers);

    expect(forbiddenTrips.statusCode).toBe(403);

    const invalidBooking = await request(app)
      .post("/api/v1/bookings")
      .set(agent.headers)
      .send({
        customerName: "A",
        customerPhone: "123",
        pickupAddress: "bad",
        dropoffAddress: "no",
        pickupTime: "invalid-date",
      });

    expect(invalidBooking.statusCode).toBe(400);
    expect(invalidBooking.body.success).toBe(false);

    const complaintForbidden = await request(app)
      .post("/api/v1/complaints")
      .set(driver.headers)
      .send({
        category: "Access",
        description: "Drivers should not access this endpoint.",
      });

    expect(complaintForbidden.statusCode).toBe(403);
  });
});

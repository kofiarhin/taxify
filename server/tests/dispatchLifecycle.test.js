const request = require('supertest');
const http = require('http');
const { io: createSocketClient } = require('socket.io-client');
const app = require('../app');
const AssignmentAttempt = require('../models/AssignmentAttempt');
const Booking = require('../models/Booking');
const CommissionStatement = require('../models/CommissionStatement');
const DriverProfile = require('../models/DriverProfile');
const { ROLES } = require('../constants/roles');
const { BOOKING_STATUS, DRIVER_STATUS } = require('../constants/statuses');
const realtime = require('../realtime/socket');
const { signToken } = require('../services/authService');
const { authHeader, createDriver, createUser } = require('./helpers/testUtils');

const listen = (server) => new Promise((resolve) => server.listen(0, resolve));
const closeServer = (server) => new Promise((resolve) => server.close(resolve));
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const waitForRoom = async (socket, room) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (socket.rooms.has(room)) return;
    await tick();
  }
  throw new Error(`Socket did not join ${room}`);
};

const startRealtimeServer = async () => {
  const server = http.createServer(app);
  const io = realtime.initializeSocketServer(server);
  await listen(server);
  const url = `http://localhost:${server.address().port}`;

  const close = async () => {
    await new Promise((resolve) => io.close(resolve));
    await closeServer(server);
    realtime.resetSocketServerForTests();
  };

  return { close, io, url };
};

const connectRealtimeClient = (url, user) =>
  createSocketClient(url, {
    auth: { token: signToken(user) },
    forceNew: true,
    reconnection: false,
    transports: ['websocket']
  });

const waitForConnect = (socket) =>
  new Promise((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
  });

describe('dispatch lifecycle', () => {
  const sockets = [];
  let realtimeServer;

  afterEach(() => {
    sockets.forEach((socket) => socket.disconnect());
    sockets.length = 0;
    jest.restoreAllMocks();
  });

  afterEach(async () => {
    if (realtimeServer) {
      await realtimeServer.close();
      realtimeServer = null;
    }
  });

  test('booking queues when no driver is active', async () => {
    const client = await createUser({ role: ROLES.CLIENT, email: 'client-queue@test.local', name: 'Nico Ibarra' });
    const emitSpy = jest.spyOn(realtime, 'emitBookingEvent');

    const response = await request(app)
      .post('/api/bookings')
      .set(authHeader(client))
      .send({ pickupAddress: '11 River Street', dropoffAddress: '82 Mason Avenue' })
      .expect(201);

    expect(response.body.booking.status).toBe(BOOKING_STATUS.QUEUED);
    expect(emitSpy).toHaveBeenCalledWith(expect.anything(), 'booking:created');
    expect(emitSpy.mock.calls.map((call) => call[1])).toEqual(['booking:created']);
  });

  test('queued booking assigns when an approved driver becomes active', async () => {
    const client = await createUser({ role: ROLES.CLIENT, email: 'client-queue-active@test.local', name: 'Nico Ibarra' });
    const { user: driverUser, profile } = await createDriver({ active: false });
    const emitSpy = jest.spyOn(realtime, 'emitBookingEvent');

    const created = await request(app)
      .post('/api/bookings')
      .set(authHeader(client))
      .send({ pickupAddress: '11 River Street', dropoffAddress: '82 Mason Avenue' })
      .expect(201);

    expect(created.body.booking.status).toBe(BOOKING_STATUS.QUEUED);

    const available = await request(app)
      .patch('/api/drivers/me/availability')
      .set(authHeader(driverUser))
      .send({ lifecycleStatus: DRIVER_STATUS.ACTIVE })
      .expect(200);

    expect(available.body.profile.lifecycleStatus).toBe(DRIVER_STATUS.ASSIGNED);

    const assigned = await Booking.findById(created.body.booking._id);
    expect(assigned.status).toBe(BOOKING_STATUS.DRIVER_ASSIGNED);
    expect(assigned.assignedDriver.toString()).toBe(profile._id.toString());
    expect((await DriverProfile.findById(profile._id)).lifecycleStatus).toBe(DRIVER_STATUS.ASSIGNED);
    expect(emitSpy.mock.calls.map((call) => call[1])).toEqual(['booking:created', 'booking:assigned']);
  });

  test('queued booking assigns when admin approves a driver into active service', async () => {
    const admin = await createUser({ role: ROLES.ADMIN, email: 'admin-approve-queue@test.local', name: 'Mara Ellison' });
    const client = await createUser({ role: ROLES.CLIENT, email: 'client-queue-admin@test.local', name: 'Nico Ibarra' });
    const { profile } = await createDriver({ approved: false, active: false });

    const created = await request(app)
      .post('/api/bookings')
      .set(authHeader(client))
      .send({ pickupAddress: '14 South Arcade', dropoffAddress: '77 Brook Terrace' })
      .expect(201);

    expect(created.body.booking.status).toBe(BOOKING_STATUS.QUEUED);

    const approved = await request(app)
      .patch(`/api/drivers/${profile._id}/status`)
      .set(authHeader(admin))
      .send({ approvalStatus: 'APPROVED' })
      .expect(200);

    expect(approved.body.profile.lifecycleStatus).toBe(DRIVER_STATUS.ASSIGNED);

    const assigned = await Booking.findById(created.body.booking._id);
    expect(assigned.status).toBe(BOOKING_STATUS.DRIVER_ASSIGNED);
    expect(assigned.assignedDriver.toString()).toBe(profile._id.toString());
  });

  test('booking creation emits one final populated payload to admin, client, and assigned driver rooms', async () => {
    const admin = await createUser({ role: ROLES.ADMIN, email: 'admin-realtime@test.local', name: 'Mara Ellison' });
    const client = await createUser({ role: ROLES.CLIENT, email: 'client-realtime@test.local', name: 'Nico Ibarra' });
    const { user: driverUser, profile } = await createDriver();
    realtimeServer = await startRealtimeServer();

    const serverSockets = [];
    realtimeServer.io.on('connection', (socket) => serverSockets.push(socket));

    const adminSocket = connectRealtimeClient(realtimeServer.url, admin);
    const clientSocket = connectRealtimeClient(realtimeServer.url, client);
    const driverSocket = connectRealtimeClient(realtimeServer.url, driverUser);
    sockets.push(adminSocket, clientSocket, driverSocket);

    await Promise.all([waitForConnect(adminSocket), waitForConnect(clientSocket), waitForConnect(driverSocket)]);
    for (let attempt = 0; attempt < 20 && serverSockets.length < 3; attempt += 1) {
      await tick();
    }
    await waitForRoom(serverSockets.find((socket) => socket.user._id.toString() === admin._id.toString()), `role:${ROLES.ADMIN}`);
    await waitForRoom(serverSockets.find((socket) => socket.user._id.toString() === client._id.toString()), `user:${client._id.toString()}`);
    await waitForRoom(serverSockets.find((socket) => socket.user._id.toString() === driverUser._id.toString()), `driver:${profile._id.toString()}`);

    const adminEvent = new Promise((resolve) => adminSocket.once('booking:created', resolve));
    const clientEvent = new Promise((resolve) => clientSocket.once('booking:created', resolve));
    const driverEvent = new Promise((resolve) => driverSocket.once('booking:created', resolve));

    const response = await request(app)
      .post('/api/bookings')
      .set(authHeader(client))
      .send({ pickupAddress: '11 River Street', dropoffAddress: '82 Mason Avenue' })
      .expect(201);

    expect(response.body.booking.status).toBe(BOOKING_STATUS.DRIVER_ASSIGNED);

    const received = await Promise.all([adminEvent, clientEvent, driverEvent]);
    for (const payload of received) {
      expect(payload).toEqual(
        expect.objectContaining({
          type: 'booking:created',
          bookingId: response.body.booking._id,
          status: BOOKING_STATUS.DRIVER_ASSIGNED,
          timestamp: expect.any(String)
        })
      );
      expect(payload.booking.client).toEqual(
        expect.objectContaining({ _id: client._id.toString(), name: 'Nico Ibarra', email: 'client-realtime@test.local' })
      );
      expect(payload.booking.assignedDriver.user).toEqual(
        expect.objectContaining({ _id: driverUser._id.toString(), email: driverUser.email })
      );
      expect(payload.booking.client.passwordHash).toBeUndefined();
      expect(payload.booking.assignedDriver.user.passwordHash).toBeUndefined();
    }
  });

  test('booking validation returns 400 for blank address input', async () => {
    const client = await createUser({ role: ROLES.CLIENT, email: 'client-blank@test.local', name: 'Nico Ibarra' });

    const response = await request(app)
      .post('/api/bookings')
      .set(authHeader(client))
      .send({ pickupAddress: '   ', dropoffAddress: '82 Mason Avenue' })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('booking still succeeds if assignment audit write fails', async () => {
    const client = await createUser({ role: ROLES.CLIENT, email: 'client-audit@test.local', name: 'Nico Ibarra' });
    jest.spyOn(AssignmentAttempt, 'create').mockRejectedValueOnce(new Error('audit write failed'));

    const response = await request(app)
      .post('/api/bookings')
      .set(authHeader(client))
      .send({ pickupAddress: '11 River Street', dropoffAddress: '82 Mason Avenue' })
      .expect(201);

    expect(response.body.booking.status).toBe(BOOKING_STATUS.QUEUED);
  });

  test('client booking assigns driver and completes cash flow with commission and review', async () => {
    const client = await createUser({ role: ROLES.CLIENT, email: 'client-flow@test.local', name: 'Nico Ibarra' });
    const admin = await createUser({ role: ROLES.ADMIN, email: 'admin@test.local', name: 'Mara Ellison' });
    const { user: driverUser, profile } = await createDriver();
    const emitSpy = jest.spyOn(realtime, 'emitBookingEvent');

    const created = await request(app)
      .post('/api/bookings')
      .set(authHeader(client))
      .send({ pickupAddress: '11 River Street', dropoffAddress: '82 Mason Avenue' })
      .expect(201);

    const bookingId = created.body.booking._id;
    expect(created.body.booking.status).toBe(BOOKING_STATUS.DRIVER_ASSIGNED);
    expect(created.body.booking.assignedDriver._id).toBe(profile._id.toString());
    expect((await DriverProfile.findById(profile._id)).lifecycleStatus).toBe(DRIVER_STATUS.ASSIGNED);

    await request(app).post(`/api/trips/${bookingId}/accept`).set(authHeader(driverUser)).expect(200);
    await request(app).post(`/api/trips/${bookingId}/start`).set(authHeader(driverUser)).expect(200);

    const ended = await request(app)
      .post(`/api/trips/${bookingId}/end`)
      .set(authHeader(driverUser))
      .send({ distanceKm: 8, durationMinutes: 14 })
      .expect(200);

    expect(ended.body.booking.fare.total).toBe(48);
    expect(ended.body.booking.status).toBe(BOOKING_STATUS.TRIP_ENDED);

    const confirmed = await request(app).post(`/api/trips/${bookingId}/client-arrived`).set(authHeader(client)).expect(200);
    expect(confirmed.body.booking.status).toBe(BOOKING_STATUS.AWAITING_DRIVER_PAYMENT_CONFIRMATION);

    const paid = await request(app).post(`/api/trips/${bookingId}/driver-received`).set(authHeader(driverUser)).expect(200);
    expect(paid.body.booking.status).toBe(BOOKING_STATUS.COMPLETED);
    expect(paid.body.booking.statusHistory.map((entry) => entry.status)).toEqual(
      expect.arrayContaining([BOOKING_STATUS.PAID, BOOKING_STATUS.COMPLETED])
    );

    const commission = await CommissionStatement.findOne({ booking: bookingId });
    expect(commission.commissionAmount).toBe(4.8);
    expect((await DriverProfile.findById(profile._id)).lifecycleStatus).toBe(DRIVER_STATUS.ACTIVE);

    await request(app)
      .post(`/api/reviews/bookings/${bookingId}`)
      .set(authHeader(client))
      .send({ rating: 5, feedback: 'Arrived on time and kept the ride calm.' })
      .expect(201);

    await request(app)
      .post(`/api/reviews/bookings/${bookingId}`)
      .set(authHeader(client))
      .send({ rating: 4 })
      .expect(409);

    const reviewedDriver = await DriverProfile.findById(profile._id);
    expect(reviewedDriver.ratingAverage).toBe(5);
    expect(reviewedDriver.reviewCount).toBe(1);

    const dashboard = await request(app).get('/api/dashboard/admin').set(authHeader(admin)).expect(200);
    expect(dashboard.body.summary.totalBookings).toBe(1);
    expect(dashboard.body.summary.completedBookings).toBe(1);
    expect(dashboard.body.summary.totalRevenue).toBe(48);
    expect(dashboard.body.summary.totalCommission).toBe(4.8);

    const stored = await Booking.findById(bookingId);
    expect(stored.payment.status).toBe('PAID');
    const paidIndex = stored.statusHistory.findIndex((entry) => entry.status === BOOKING_STATUS.PAID);
    const completedIndex = stored.statusHistory.findIndex((entry) => entry.status === BOOKING_STATUS.COMPLETED);
    expect(paidIndex).toBeGreaterThan(-1);
    expect(completedIndex).toBeGreaterThan(paidIndex);
    expect(emitSpy.mock.calls.map((call) => call[1])).toEqual(
      expect.arrayContaining([
        'booking:created',
        'booking:accepted',
        'trip:started',
        'trip:ended',
        'trip:client_confirmed',
        'payment:driver_confirmed',
        'booking:completed'
      ])
    );
    expect(emitSpy.mock.calls.filter((call) => call[1] === 'booking:assigned')).toHaveLength(0);
  });

  test('driver rejection reassigns booking to another available driver first', async () => {
    const client = await createUser({ role: ROLES.CLIENT, email: 'client-reject@test.local', name: 'Nico Ibarra' });
    const first = await createDriver();
    const second = await createDriver();
    const emitSpy = jest.spyOn(realtime, 'emitBookingEvent');

    const created = await request(app)
      .post('/api/bookings')
      .set(authHeader(client))
      .send({ pickupAddress: '14 South Arcade', dropoffAddress: '77 Brook Terrace' })
      .expect(201);

    expect(created.body.booking.assignedDriver._id).toBe(first.profile._id.toString());

    const rejected = await request(app)
      .post(`/api/trips/${created.body.booking._id}/reject`)
      .set(authHeader(first.user))
      .expect(200);

    expect(rejected.body.booking.status).toBe(BOOKING_STATUS.DRIVER_ASSIGNED);
    expect(rejected.body.booking.assignedDriver.toString()).toBe(second.profile._id.toString());
    expect((await DriverProfile.findById(first.profile._id)).lifecycleStatus).toBe(DRIVER_STATUS.ACTIVE);
    expect((await DriverProfile.findById(second.profile._id)).lifecycleStatus).toBe(DRIVER_STATUS.ASSIGNED);
    expect(emitSpy.mock.calls.map((call) => call[1])).toEqual([
      'booking:created',
      'booking:rejected',
      'booking:assigned'
    ]);
  });

  test('driver rejection returns booking to queue when no replacement driver is available', async () => {
    const client = await createUser({ role: ROLES.CLIENT, email: 'client-reject-queue@test.local', name: 'Nico Ibarra' });
    const { user: driverUser, profile } = await createDriver();

    const created = await request(app)
      .post('/api/bookings')
      .set(authHeader(client))
      .send({ pickupAddress: '14 South Arcade', dropoffAddress: '77 Brook Terrace' })
      .expect(201);

    expect(created.body.booking.assignedDriver._id).toBe(profile._id.toString());

    const rejected = await request(app)
      .post(`/api/trips/${created.body.booking._id}/reject`)
      .set(authHeader(driverUser))
      .expect(200);

    expect(rejected.body.booking.status).toBe(BOOKING_STATUS.QUEUED);
    expect(rejected.body.booking.assignedDriver).toBeFalsy();
    expect((await DriverProfile.findById(profile._id)).lifecycleStatus).toBe(DRIVER_STATUS.ACTIVE);

    const queued = await Booking.findById(created.body.booking._id);
    expect(queued.status).toBe(BOOKING_STATUS.QUEUED);
    expect(queued.assignedDriver).toBeFalsy();
  });

  test('admin reassignment emits one final reassigned event', async () => {
    const admin = await createUser({ role: ROLES.ADMIN, email: 'admin-reassign@test.local', name: 'Mara Ellison' });
    const client = await createUser({ role: ROLES.CLIENT, email: 'client-reassign@test.local', name: 'Nico Ibarra' });
    const first = await createDriver();
    const second = await createDriver();
    const emitSpy = jest.spyOn(realtime, 'emitBookingEvent');

    const created = await request(app)
      .post('/api/bookings')
      .set(authHeader(client))
      .send({ pickupAddress: '14 South Arcade', dropoffAddress: '77 Brook Terrace' })
      .expect(201);

    expect(created.body.booking.assignedDriver._id).toBe(first.profile._id.toString());

    const reassigned = await request(app)
      .post(`/api/bookings/${created.body.booking._id}/reassign`)
      .set(authHeader(admin))
      .expect(200);

    expect(reassigned.body.booking.status).toBe(BOOKING_STATUS.DRIVER_ASSIGNED);
    expect(reassigned.body.booking.assignedDriver._id).toBe(second.profile._id.toString());
    expect(emitSpy.mock.calls.map((call) => call[1])).toEqual(['booking:created', 'booking:reassigned']);
  });

  test('driver cannot confirm cash before client confirms trip completion', async () => {
    const client = await createUser({ role: ROLES.CLIENT, email: 'client-order@test.local', name: 'Nico Ibarra' });
    const { user: driverUser } = await createDriver();

    const created = await request(app)
      .post('/api/bookings')
      .set(authHeader(client))
      .send({ pickupAddress: 'Dock Lane', dropoffAddress: 'Cedar Court' })
      .expect(201);

    const bookingId = created.body.booking._id;
    await request(app).post(`/api/trips/${bookingId}/accept`).set(authHeader(driverUser)).expect(200);
    await request(app).post(`/api/trips/${bookingId}/start`).set(authHeader(driverUser)).expect(200);
    await request(app).post(`/api/trips/${bookingId}/end`).set(authHeader(driverUser)).send({ distanceKm: 2, durationMinutes: 5 }).expect(200);
    await request(app).post(`/api/trips/${bookingId}/driver-received`).set(authHeader(driverUser)).expect(409);
  });

  test('driver payment confirmation finalizes only after client confirms trip completion', async () => {
    const client = await createUser({ role: ROLES.CLIENT, email: 'client-dual@test.local', name: 'Nico Ibarra' });
    const { user: driverUser } = await createDriver();

    const created = await request(app)
      .post('/api/bookings')
      .set(authHeader(client))
      .send({ pickupAddress: 'Dock Lane', dropoffAddress: 'Cedar Court' })
      .expect(201);

    const bookingId = created.body.booking._id;
    await request(app).post(`/api/trips/${bookingId}/accept`).set(authHeader(driverUser)).expect(200);
    await request(app).post(`/api/trips/${bookingId}/start`).set(authHeader(driverUser)).expect(200);
    await request(app).post(`/api/trips/${bookingId}/end`).set(authHeader(driverUser)).send({ distanceKm: 2, durationMinutes: 5 }).expect(200);
    const clientConfirmed = await request(app).post(`/api/trips/${bookingId}/client-arrived`).set(authHeader(client)).expect(200);
    expect(clientConfirmed.body.booking.status).toBe(BOOKING_STATUS.AWAITING_DRIVER_PAYMENT_CONFIRMATION);

    const final = await request(app).post(`/api/trips/${bookingId}/driver-received`).set(authHeader(driverUser)).expect(200);
    expect(final.body.booking.status).toBe(BOOKING_STATUS.COMPLETED);
    expect(final.body.booking.payment.status).toBe('PAID');
    expect(final.body.booking.payment.driverConfirmedAt).toBeTruthy();
    expect(await CommissionStatement.findOne({ booking: bookingId })).toBeTruthy();
  });

  test('repeat driver-received call is idempotent', async () => {
    const client = await createUser({ role: ROLES.CLIENT, email: 'client-idem@test.local', name: 'Nico Ibarra' });
    const { user: driverUser } = await createDriver();

    const created = await request(app)
      .post('/api/bookings')
      .set(authHeader(client))
      .send({ pickupAddress: 'Dock Lane', dropoffAddress: 'Cedar Court' })
      .expect(201);

    const bookingId = created.body.booking._id;
    await request(app).post(`/api/trips/${bookingId}/accept`).set(authHeader(driverUser)).expect(200);
    await request(app).post(`/api/trips/${bookingId}/start`).set(authHeader(driverUser)).expect(200);
    await request(app).post(`/api/trips/${bookingId}/end`).set(authHeader(driverUser)).send({ distanceKm: 2, durationMinutes: 5 }).expect(200);
    await request(app).post(`/api/trips/${bookingId}/client-arrived`).set(authHeader(client)).expect(200);
    await request(app).post(`/api/trips/${bookingId}/driver-received`).set(authHeader(driverUser)).expect(200);
    const repeat = await request(app).post(`/api/trips/${bookingId}/driver-received`).set(authHeader(driverUser)).expect(200);
    expect(repeat.body.booking.status).toBe(BOOKING_STATUS.COMPLETED);
  });
});

const request = require('supertest');
const app = require('../app');
const AssignmentAttempt = require('../models/AssignmentAttempt');
const Booking = require('../models/Booking');
const CommissionStatement = require('../models/CommissionStatement');
const DriverProfile = require('../models/DriverProfile');
const { ROLES } = require('../constants/roles');
const { BOOKING_STATUS, DRIVER_STATUS } = require('../constants/statuses');
const realtime = require('../realtime/socket');
const { authHeader, createDriver, createUser } = require('./helpers/testUtils');

describe('dispatch lifecycle', () => {
  afterEach(() => {
    jest.restoreAllMocks();
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
    expect(emitSpy).toHaveBeenCalledWith(expect.anything(), 'booking:queued');
    expect(emitSpy).toHaveBeenCalledWith(expect.anything(), 'booking:created');
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
    expect(ended.body.booking.status).toBe(BOOKING_STATUS.AWAITING_CLIENT_CONFIRMATION);

    await request(app).post(`/api/trips/${bookingId}/client-confirm`).set(authHeader(client)).expect(200);

    const paid = await request(app).post(`/api/trips/${bookingId}/payment-confirm`).set(authHeader(driverUser)).expect(200);
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
        'booking:assigned',
        'booking:created',
        'booking:accepted',
        'trip:started',
        'trip:ended',
        'payment:client_confirmed',
        'payment:driver_confirmed',
        'booking:completed'
      ])
    );
  });

  test('driver rejection reassigns booking to another available driver first', async () => {
    const client = await createUser({ role: ROLES.CLIENT, email: 'client-reject@test.local', name: 'Nico Ibarra' });
    const first = await createDriver();
    const second = await createDriver();

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
  });

  test('driver cannot confirm cash before client confirms completion', async () => {
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
    await request(app).post(`/api/trips/${bookingId}/payment-confirm`).set(authHeader(driverUser)).expect(409);
  });
});

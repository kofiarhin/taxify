const request = require('supertest');
const app = require('../app');
const Booking = require('../models/Booking');
const CommissionStatement = require('../models/CommissionStatement');
const DriverProfile = require('../models/DriverProfile');
const { ROLES } = require('../constants/roles');
const { BOOKING_STATUS, DRIVER_STATUS } = require('../constants/statuses');
const { authHeader, createDriver, createUser } = require('./helpers/testUtils');

describe('agent and complaint operations', () => {
  test('agent creates queued booking and admin can manage dispute complaint', async () => {
    const agent = await createUser({ role: ROLES.AGENT, email: 'agent@test.local', name: 'Alden Crowe' });
    const admin = await createUser({ role: ROLES.ADMIN, email: 'admin-ops@test.local', name: 'Mara Ellison' });

    const booking = await request(app)
      .post('/api/bookings')
      .set(authHeader(agent))
      .send({
        passengerName: 'Rowan Pike',
        passengerPhone: '+1 (773) 418-9402',
        pickupAddress: '9 Elm Yard',
        dropoffAddress: '44 Archive Road'
      })
      .expect(201);

    expect(booking.body.booking.source).toBe('AGENT');
    expect(booking.body.booking.status).toBe(BOOKING_STATUS.QUEUED);

    const complaint = await request(app)
      .post('/api/complaints')
      .set(authHeader(agent))
      .send({
        booking: booking.body.booking._id,
        type: 'DISPUTE',
        title: 'Passenger disputed pickup',
        description: 'Passenger says the pickup location was entered incorrectly.'
      })
      .expect(201);

    const updated = await request(app)
      .patch(`/api/complaints/${complaint.body.complaint._id}`)
      .set(authHeader(admin))
      .send({ status: 'RESOLVED', adminNotes: 'Agent corrected the booking notes.' })
      .expect(200);

    expect(updated.body.complaint.status).toBe('RESOLVED');
  });

  test('admin reassigns a pre-trip booking to a different active driver', async () => {
    const admin = await createUser({ role: ROLES.ADMIN, email: 'admin-reassign@test.local', name: 'Mara Ellison' });
    const client = await createUser({ role: ROLES.CLIENT, email: 'client-reassign@test.local', name: 'Nico Ibarra' });
    const first = await createDriver();
    const second = await createDriver();

    const created = await request(app)
      .post('/api/bookings')
      .set(authHeader(client))
      .send({ pickupAddress: '2 Market Row', dropoffAddress: '91 Union Yard' })
      .expect(201);

    expect(created.body.booking.assignedDriver._id).toBe(first.profile._id.toString());

    const reassigned = await request(app)
      .post(`/api/bookings/${created.body.booking._id}/reassign`)
      .set(authHeader(admin))
      .expect(200);

    expect(reassigned.body.booking.status).toBe(BOOKING_STATUS.DRIVER_ASSIGNED);
    expect(reassigned.body.booking.assignedDriver._id).toBe(second.profile._id.toString());
    expect((await DriverProfile.findById(first.profile._id)).lifecycleStatus).toBe(DRIVER_STATUS.ACTIVE);
    expect((await DriverProfile.findById(second.profile._id)).lifecycleStatus).toBe(DRIVER_STATUS.ASSIGNED);
  });

  test('admin complete override records paid lifecycle and commission after client confirmation', async () => {
    const admin = await createUser({ role: ROLES.ADMIN, email: 'admin-complete@test.local', name: 'Mara Ellison' });
    const client = await createUser({ role: ROLES.CLIENT, email: 'client-complete@test.local', name: 'Nico Ibarra' });
    const { user: driverUser, profile } = await createDriver();

    const created = await request(app)
      .post('/api/bookings')
      .set(authHeader(client))
      .send({ pickupAddress: '5 Lantern Lane', dropoffAddress: '20 Foundry Way' })
      .expect(201);

    const bookingId = created.body.booking._id;
    await request(app).post(`/api/trips/${bookingId}/accept`).set(authHeader(driverUser)).expect(200);
    await request(app).post(`/api/trips/${bookingId}/start`).set(authHeader(driverUser)).expect(200);
    await request(app)
      .post(`/api/trips/${bookingId}/end`)
      .set(authHeader(driverUser))
      .send({ distanceKm: 3, durationMinutes: 7 })
      .expect(200);
    await request(app).post(`/api/trips/${bookingId}/client-arrived`).set(authHeader(client)).expect(200);

    const completed = await request(app)
      .post(`/api/bookings/${bookingId}/complete`)
      .set(authHeader(admin))
      .expect(200);

    expect(completed.body.booking.status).toBe(BOOKING_STATUS.COMPLETED);
    expect(completed.body.booking.payment.status).toBe('PAID');
    expect(completed.body.booking.statusHistory.map((entry) => entry.status)).toEqual(
      expect.arrayContaining([BOOKING_STATUS.PAID, BOOKING_STATUS.COMPLETED])
    );

    const stored = await Booking.findById(bookingId);
    const paidIndex = stored.statusHistory.findIndex((entry) => entry.status === BOOKING_STATUS.PAID);
    const completedIndex = stored.statusHistory.findIndex((entry) => entry.status === BOOKING_STATUS.COMPLETED);
    expect(completedIndex).toBeGreaterThan(paidIndex);
    expect((await DriverProfile.findById(profile._id)).lifecycleStatus).toBe(DRIVER_STATUS.ACTIVE);
    expect(await CommissionStatement.findOne({ booking: bookingId })).toBeTruthy();
  });

  test('admin cannot complete before the client confirms trip completion', async () => {
    const admin = await createUser({ role: ROLES.ADMIN, email: 'admin-complete-early@test.local', name: 'Mara Ellison' });
    const client = await createUser({ role: ROLES.CLIENT, email: 'client-complete-early@test.local', name: 'Nico Ibarra' });
    const { user: driverUser } = await createDriver();

    const created = await request(app)
      .post('/api/bookings')
      .set(authHeader(client))
      .send({ pickupAddress: '8 Copper Street', dropoffAddress: '16 Signal Court' })
      .expect(201);

    const bookingId = created.body.booking._id;
    await request(app).post(`/api/trips/${bookingId}/accept`).set(authHeader(driverUser)).expect(200);
    await request(app).post(`/api/trips/${bookingId}/start`).set(authHeader(driverUser)).expect(200);
    await request(app)
      .post(`/api/trips/${bookingId}/end`)
      .set(authHeader(driverUser))
      .send({ distanceKm: 3, durationMinutes: 7 })
      .expect(200);

    const response = await request(app)
      .post(`/api/bookings/${bookingId}/complete`)
      .set(authHeader(admin))
      .expect(409);

    expect(response.body.error.code).toBe('BOOKING_NOT_COMPLETABLE');
  });
});

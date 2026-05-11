const request = require('supertest');
const app = require('../app');
const { ROLES } = require('../constants/roles');
const { BOOKING_STATUS } = require('../constants/statuses');
const { authHeader, createUser } = require('./helpers/testUtils');

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
});

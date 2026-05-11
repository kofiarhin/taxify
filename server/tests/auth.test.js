const request = require('supertest');
const app = require('../app');
const { ROLES } = require('../constants/roles');
const { authHeader, createUser } = require('./helpers/testUtils');

describe('auth and role protection', () => {
  test('client registration, login, and /me work without exposing passwordHash', async () => {
    const register = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Nico Ibarra', email: 'nico@test.local', password: 'Password123!', role: ROLES.CLIENT })
      .expect(201);

    expect(register.body.token).toBeTruthy();
    expect(register.body.user.passwordHash).toBeUndefined();

    const login = await request(app).post('/api/auth/login').send({ email: 'nico@test.local', password: 'Password123!' }).expect(200);
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.token}`).expect(200);

    expect(me.body.user.email).toBe('nico@test.local');
    expect(me.body.user.passwordHash).toBeUndefined();
  });

  test('role guard blocks non-admin driver management', async () => {
    const client = await createUser({ role: ROLES.CLIENT, email: 'client@test.local', name: 'Mara Finch' });

    await request(app).get('/api/drivers').set(authHeader(client)).expect(403);
  });
});

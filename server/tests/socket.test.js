const http = require('http');
const { io: createClient } = require('socket.io-client');
const app = require('../app');
const { ROLES } = require('../constants/roles');
const Booking = require('../models/Booking');
const User = require('../models/User');
const {
  buildBookingPayload,
  emitToAdmins,
  initializeSocketServer,
  resetSocketServerForTests
} = require('../realtime/socket');
const { signToken } = require('../services/authService');
const { createDriver, createUser } = require('./helpers/testUtils');

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

const startSocketServer = async () => {
  const server = http.createServer(app);
  const io = initializeSocketServer(server);
  await listen(server);
  const url = `http://localhost:${server.address().port}`;

  const close = async () => {
    await new Promise((resolve) => io.close(resolve));
    await closeServer(server);
    resetSocketServerForTests();
  };

  return { close, io, url };
};

const connectClient = (url, token) => {
  const socket = createClient(url, {
    auth: token ? { token } : {},
    forceNew: true,
    reconnection: false,
    transports: ['websocket']
  });

  return socket;
};

const waitForConnect = (socket) =>
  new Promise((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
  });

const waitForConnectError = (socket) =>
  new Promise((resolve, reject) => {
    socket.once('connect', () => reject(new Error('Socket connected unexpectedly')));
    socket.once('connect_error', resolve);
  });

describe('realtime socket server', () => {
  let realtime;
  const sockets = [];

  afterEach(async () => {
    sockets.forEach((socket) => socket.disconnect());
    sockets.length = 0;
    if (realtime) {
      await realtime.close();
      realtime = null;
    }
  });

  it('rejects sockets without a token', async () => {
    realtime = await startSocketServer();
    const socket = connectClient(realtime.url);
    sockets.push(socket);

    const error = await waitForConnectError(socket);

    expect(error.message).toBe('Authentication token is required');
  });

  it('rejects sockets for explicit inactive users', async () => {
    realtime = await startSocketServer();
    const user = await createUser({ role: ROLES.CLIENT, email: 'inactive@test.local' });
    user.status = 'INACTIVE';
    await user.save();

    const socket = connectClient(realtime.url, signToken(user));
    sockets.push(socket);

    const error = await waitForConnectError(socket);

    expect(error.message).toBe('Invalid authentication token');
  });

  it('accepts active drivers and joins role, user, and driver rooms', async () => {
    realtime = await startSocketServer();
    const { user, profile } = await createDriver();
    const serverSocketPromise = new Promise((resolve) => realtime.io.once('connection', resolve));
    const socket = connectClient(realtime.url, signToken(user));
    sockets.push(socket);

    await waitForConnect(socket);
    const serverSocket = await serverSocketPromise;
    await waitForRoom(serverSocket, `driver:${profile._id.toString()}`);

    expect(serverSocket.user._id.toString()).toBe(user._id.toString());
    expect(serverSocket.rooms.has(`role:${ROLES.DRIVER}`)).toBe(true);
    expect(serverSocket.rooms.has(`user:${user._id.toString()}`)).toBe(true);
    expect(serverSocket.rooms.has(`driver:${profile._id.toString()}`)).toBe(true);
  });

  it('treats missing user status as active for backward compatibility', async () => {
    realtime = await startSocketServer();
    const user = await createUser({ role: ROLES.CLIENT, email: 'legacy@test.local' });
    await User.collection.updateOne({ _id: user._id }, { $unset: { status: '' } });

    const socket = connectClient(realtime.url, signToken(user));
    sockets.push(socket);

    await expect(waitForConnect(socket)).resolves.toBeUndefined();
  });

  it('emits helper events to the expected role room with booking payload shape', async () => {
    realtime = await startSocketServer();
    const user = await createUser({ role: ROLES.ADMIN, email: 'admin-socket@test.local' });
    const booking = await Booking.create({
      client: user._id,
      createdBy: user._id,
      source: 'CLIENT_APP',
      passengerName: 'Mira Sutton',
      passengerPhone: '+1 (312) 847-1928',
      pickupAddress: '21 Market Street',
      dropoffAddress: '78 Harbor Road'
    });
    const socket = connectClient(realtime.url, signToken(user));
    sockets.push(socket);

    await waitForConnect(socket);
    const eventPromise = new Promise((resolve) => socket.once('booking:test', resolve));
    const payload = buildBookingPayload(booking, 'booking:test');
    emitToAdmins('booking:test', payload);
    const received = await eventPromise;

    expect(received).toEqual(
      expect.objectContaining({
        type: 'booking:test',
        bookingId: booking._id.toString(),
        status: booking.status,
        timestamp: expect.any(String)
      })
    );
    expect(received.booking.passengerName).toBe('Mira Sutton');
  });

  it('builds normalized booking payloads without internal auth fields', async () => {
    const user = await createUser({ role: ROLES.CLIENT, email: 'payload-client@test.local', name: 'Iris Camden' });
    const booking = await Booking.create({
      client: user._id,
      createdBy: user._id,
      source: 'CLIENT_APP',
      passengerName: 'Iris Camden',
      passengerPhone: '+1 (312) 847-1928',
      pickupAddress: '31 Union Plaza',
      dropoffAddress: '9 Grove Walk'
    });

    const payload = buildBookingPayload(booking, 'booking:created', {
      bookingId: booking._id,
      timestamp: new Date('2026-05-14T10:15:30.000Z')
    });

    expect(payload).toEqual(
      expect.objectContaining({
        type: 'booking:created',
        bookingId: booking._id.toString(),
        status: booking.status,
        timestamp: '2026-05-14T10:15:30.000Z'
      })
    );
    expect(typeof payload.bookingId).toBe('string');
    expect(payload.booking.passwordHash).toBeUndefined();
    expect(payload.booking.__v).toBeUndefined();
  });
});

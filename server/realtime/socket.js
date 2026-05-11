const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const env = require('../config/env');
const { ROLES } = require('../constants/roles');
const DriverProfile = require('../models/DriverProfile');
const User = require('../models/User');
const {
  buildBookingPayload,
  populateBookingForRealtime,
  toId
} = require('./bookingPayload');

let io;

const isActiveSocketUser = (user) => !user.status || user.status === 'ACTIVE';

const requireIo = () => io;

const emitToRoom = (room, event, payload) => {
  if (!io || !room) return false;
  io.to(room).emit(event, payload);
  return true;
};

const emitToAdmins = (event, payload) => emitToRoom(`role:${ROLES.ADMIN}`, event, payload);

const emitToAgents = (event, payload) => emitToRoom(`role:${ROLES.AGENT}`, event, payload);

const emitToUser = (userId, event, payload) => emitToRoom(`user:${toId(userId)}`, event, payload);

const emitToDriver = (driverProfileId, event, payload) => emitToRoom(`driver:${toId(driverProfileId)}`, event, payload);

const emitBookingEvent = (booking, event, payload = {}) => {
  const eventPayload = buildBookingPayload(booking, event, payload);
  emitToAdmins(event, eventPayload);
  emitToAgents(event, eventPayload);

  const clientId = toId(booking?.client);
  const creatorId = toId(booking?.createdBy);
  const driverId = toId(booking?.assignedDriver);

  if (clientId) emitToUser(clientId, event, eventPayload);
  if (creatorId && creatorId !== clientId) emitToUser(creatorId, event, eventPayload);
  if (driverId) emitToDriver(driverId, event, eventPayload);

  return eventPayload;
};

const emitPopulatedBookingEvent = async (booking, event, payload = {}) => {
  const hydrated = await populateBookingForRealtime(booking);
  return module.exports.emitBookingEvent(hydrated || booking, event, payload);
};

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication token is required'));

    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || !isActiveSocketUser(user)) {
      return next(new Error('Invalid authentication token'));
    }

    socket.user = user;
    return next();
  } catch (error) {
    return next(new Error('Invalid authentication token'));
  }
};

const joinUserRooms = async (socket) => {
  const user = socket.user;
  socket.join(`role:${user.role}`);
  socket.join(`user:${user._id.toString()}`);

  if (user.role === ROLES.DRIVER) {
    const profile = await DriverProfile.findOne({ user: user._id }).select('_id');
    if (profile) {
      socket.driverProfileId = profile._id;
      socket.join(`driver:${profile._id.toString()}`);
    }
  }
};

const initializeSocketServer = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.CLIENT_ORIGIN,
      credentials: true
    }
  });

  io.use(authenticateSocket);
  io.on('connection', (socket) => {
    joinUserRooms(socket).catch((error) => {
      socket.emit('realtime:error', { message: 'Failed to join realtime rooms' });
      socket.disconnect(true);
      if (env.NODE_ENV !== 'test') {
        console.error('Failed to join socket rooms', error);
      }
    });
  });

  return io;
};

const resetSocketServerForTests = () => {
  io = undefined;
};

module.exports = {
  buildBookingPayload,
  emitBookingEvent,
  emitPopulatedBookingEvent,
  emitToAdmins,
  emitToAgents,
  emitToDriver,
  emitToUser,
  initializeSocketServer,
  requireIo,
  resetSocketServerForTests
};

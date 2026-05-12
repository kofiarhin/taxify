const mongoose = require('mongoose');
const AssignmentAttempt = require('../../server/models/AssignmentAttempt');
const Booking = require('../../server/models/Booking');
const CommissionStatement = require('../../server/models/CommissionStatement');
const DriverProfile = require('../../server/models/DriverProfile');
const Trip = require('../../server/models/Trip');
const User = require('../../server/models/User');
const { ROLES } = require('../../server/constants/roles');
const { BOOKING_STATUS, DRIVER_APPROVAL_STATUS, DRIVER_STATUS } = require('../../server/constants/statuses');

const e2ePassword = 'E2ePassword123!';

const credentials = Object.freeze({
  admin: { email: 'e2e.admin@taxify.local', password: e2ePassword },
  agent: { email: 'e2e.agent@taxify.local', password: e2ePassword },
  client: { email: 'e2e.client@taxify.local', password: e2ePassword },
  driver: { email: 'e2e.driver@taxify.local', password: e2ePassword }
});

const users = [
  { key: 'admin', name: 'E2E Admin Rowan', email: credentials.admin.email, phone: '+1 (312) 847-2801', role: ROLES.ADMIN },
  { key: 'agent', name: 'E2E Agent Mara', email: credentials.agent.email, phone: '+1 (312) 847-2802', role: ROLES.AGENT },
  { key: 'client', name: 'E2E Client Nico', email: credentials.client.email, phone: '+1 (312) 847-2803', role: ROLES.CLIENT },
  { key: 'driver', name: 'E2E Driver Leona', email: credentials.driver.email, phone: '+1 (312) 847-2804', role: ROLES.DRIVER },
  { key: 'adminOldDriverUser', name: 'E2E Driver Priya', email: 'e2e.driver.priya@taxify.local', phone: '+1 (312) 847-2805', role: ROLES.DRIVER },
  { key: 'adminNewDriverUser', name: 'E2E Driver Mateo', email: 'e2e.driver.mateo@taxify.local', phone: '+1 (312) 847-2806', role: ROLES.DRIVER },
  { key: 'adminCompleteDriverUser', name: 'E2E Driver Tessa', email: 'e2e.driver.tessa@taxify.local', phone: '+1 (312) 847-2807', role: ROLES.DRIVER },
  { key: 'clientSpareDriverUser', name: 'E2E Driver Imani', email: 'e2e.driver.imani@taxify.local', phone: '+1 (312) 847-2808', role: ROLES.DRIVER },
  { key: 'agentSpareDriverUser', name: 'E2E Driver Callum', email: 'e2e.driver.callum@taxify.local', phone: '+1 (312) 847-2809', role: ROLES.DRIVER }
];

const e2eEmails = users.map((user) => user.email);

const clearE2eData = async () => {
  const existingUsers = await User.find({ email: { $in: e2eEmails } }).select('_id');
  const userIds = existingUsers.map((user) => user._id);
  const profiles = await DriverProfile.find({ user: { $in: userIds } }).select('_id');
  const profileIds = profiles.map((profile) => profile._id);
  const bookings = await Booking.find({
    $or: [{ client: { $in: userIds } }, { createdBy: { $in: userIds } }, { assignedDriver: { $in: profileIds } }]
  }).select('_id');
  const bookingIds = bookings.map((booking) => booking._id);

  await Promise.all([
    AssignmentAttempt.deleteMany({ booking: { $in: bookingIds } }),
    CommissionStatement.deleteMany({ booking: { $in: bookingIds } }),
    Trip.deleteMany({ booking: { $in: bookingIds } }),
    Booking.deleteMany({ _id: { $in: bookingIds } }),
    DriverProfile.deleteMany({ _id: { $in: profileIds } }),
    User.deleteMany({ _id: { $in: userIds } })
  ]);
};

const createUser = async (entry) =>
  User.create({
    name: entry.name,
    email: entry.email,
    phone: entry.phone,
    role: entry.role,
    passwordHash: e2ePassword
  });

const createApprovedDriver = async (user, lifecycleStatus, vehiclePlate) =>
  DriverProfile.create({
    user: user._id,
    approvalStatus: DRIVER_APPROVAL_STATUS.APPROVED,
    lifecycleStatus,
    licenseNumber: `E2E-${vehiclePlate}`,
    vehicleMake: 'Toyota',
    vehicleModel: 'Camry',
    vehiclePlate
  });

const makeHistory = (status, actor, note) => [{ status, actor, note, changedAt: new Date() }];

const seedE2eData = async () => {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
    throw new Error('Refusing to seed E2E data in production without ALLOW_PRODUCTION_SEED=true');
  }

  await clearE2eData();

  const createdUsers = {};
  for (const entry of users) {
    createdUsers[entry.key] = await createUser(entry);
  }

  const driverProfile = await createApprovedDriver(createdUsers.driver, DRIVER_STATUS.ASSIGNED, 'E2E-1001');
  const adminOldDriver = await createApprovedDriver(createdUsers.adminOldDriverUser, DRIVER_STATUS.ASSIGNED, 'E2E-1002');
  const adminNewDriver = await createApprovedDriver(createdUsers.adminNewDriverUser, DRIVER_STATUS.ACTIVE, 'E2E-1003');
  const adminCompleteDriver = await createApprovedDriver(createdUsers.adminCompleteDriverUser, DRIVER_STATUS.ON_TRIP, 'E2E-1004');
  await createApprovedDriver(createdUsers.clientSpareDriverUser, DRIVER_STATUS.ACTIVE, 'E2E-1005');
  await createApprovedDriver(createdUsers.agentSpareDriverUser, DRIVER_STATUS.ACTIVE, 'E2E-1006');

  const driverBooking = await Booking.create({
    client: createdUsers.client._id,
    createdBy: createdUsers.client._id,
    source: 'CLIENT_APP',
    passengerName: createdUsers.client.name,
    passengerPhone: createdUsers.client.phone,
    pickupAddress: 'E2E Driver Pickup Depot',
    dropoffAddress: 'E2E Driver Dropoff Terminal',
    status: BOOKING_STATUS.DRIVER_ASSIGNED,
    assignedDriver: driverProfile._id,
    statusHistory: makeHistory(BOOKING_STATUS.DRIVER_ASSIGNED, createdUsers.client._id, 'E2E driver happy path seed')
  });

  const adminReassignBooking = await Booking.create({
    client: createdUsers.client._id,
    createdBy: createdUsers.client._id,
    source: 'CLIENT_APP',
    passengerName: createdUsers.client.name,
    passengerPhone: createdUsers.client.phone,
    pickupAddress: 'E2E Admin Reassign Pickup',
    dropoffAddress: 'E2E Admin Reassign Dropoff',
    status: BOOKING_STATUS.DRIVER_ASSIGNED,
    assignedDriver: adminOldDriver._id,
    statusHistory: makeHistory(BOOKING_STATUS.DRIVER_ASSIGNED, createdUsers.admin._id, 'E2E admin reassign seed')
  });

  const adminCompleteBooking = await Booking.create({
    client: createdUsers.client._id,
    createdBy: createdUsers.client._id,
    source: 'CLIENT_APP',
    passengerName: createdUsers.client.name,
    passengerPhone: createdUsers.client.phone,
    pickupAddress: 'E2E Admin Complete Pickup',
    dropoffAddress: 'E2E Admin Complete Dropoff',
    status: BOOKING_STATUS.AWAITING_PAYMENT,
    assignedDriver: adminCompleteDriver._id,
    distanceKm: 8,
    durationMinutes: 14,
    fare: { baseFare: 10, perKm: 3, perMinute: 1, total: 48 },
    payment: { method: 'CASH', status: 'UNPAID' },
    arrival: { driverMarkedAt: new Date(), clientMarkedAt: new Date() },
    endedAt: new Date(),
    statusHistory: makeHistory(
      BOOKING_STATUS.AWAITING_PAYMENT,
      createdUsers.client._id,
      'E2E admin complete seed'
    )
  });

  await Trip.create({
    booking: adminCompleteBooking._id,
    driver: adminCompleteDriver._id,
    startedAt: new Date(Date.now() - 20 * 60 * 1000),
    endedAt: adminCompleteBooking.endedAt,
    distanceKm: 8,
    durationMinutes: 14,
    fare: adminCompleteBooking.fare
  });

  return {
    credentials,
    bookingIds: {
      driver: driverBooking._id.toString(),
      adminReassign: adminReassignBooking._id.toString(),
      adminComplete: adminCompleteBooking._id.toString()
    },
    driverIds: {
      driver: driverProfile._id.toString(),
      adminOld: adminOldDriver._id.toString(),
      adminNew: adminNewDriver._id.toString(),
      adminComplete: adminCompleteDriver._id.toString()
    }
  };
};

const connectIfNeeded = async (mongoUri) => {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(mongoUri);
};

module.exports = { connectIfNeeded, credentials, seedE2eData };

const User = require('../../models/User');
const DriverProfile = require('../../models/DriverProfile');
const { ROLES } = require('../../constants/roles');
const { DRIVER_APPROVAL_STATUS, DRIVER_STATUS } = require('../../constants/statuses');
const { signToken } = require('../../services/authService');

const createUser = async ({ role = ROLES.CLIENT, email, name = 'Test User' }) =>
  User.create({
    name,
    email,
    phone: '+1 (312) 847-1928',
    role,
    passwordHash: 'Password123!'
  });

const createDriver = async ({ approved = true, active = true } = {}) => {
  const user = await createUser({ role: ROLES.DRIVER, email: `driver-${Date.now()}@test.local`, name: 'Leona Vale' });
  const profile = await DriverProfile.create({
    user: user._id,
    approvalStatus: approved ? DRIVER_APPROVAL_STATUS.APPROVED : DRIVER_APPROVAL_STATUS.PENDING,
    lifecycleStatus: active ? DRIVER_STATUS.ACTIVE : DRIVER_STATUS.OFFLINE,
    licenseNumber: 'TX-4472',
    vehicleMake: 'Toyota',
    vehicleModel: 'Camry',
    vehiclePlate: 'TXF-1842'
  });
  return { user, profile };
};

const authHeader = (user) => ({ Authorization: `Bearer ${signToken(user)}` });

module.exports = { authHeader, createDriver, createUser };

require('dotenv').config();
const mongoose = require('mongoose');
const connectDb = require('../config/db');
const User = require('../models/User');
const DriverProfile = require('../models/DriverProfile');
const { ROLES } = require('../constants/roles');
const { DRIVER_APPROVAL_STATUS, DRIVER_STATUS } = require('../constants/statuses');

const seedPassword = process.env.SEED_PASSWORD || 'Password123!';
const resetPasswords = process.env.RESET_SEEDED_PASSWORDS !== 'false';

const users = [
  {
    key: 'admin',
    name: 'Mara Ellison',
    email: 'admin@taxify.local',
    phone: '+1 (312) 847-1901',
    role: ROLES.ADMIN
  },
  {
    key: 'agent',
    name: 'Alden Crowe',
    email: 'agent@taxify.local',
    phone: '+1 (312) 847-1902',
    role: ROLES.AGENT
  },
  {
    key: 'driver',
    name: 'Leona Vale',
    email: 'driver@taxify.local',
    phone: '+1 (312) 847-1903',
    role: ROLES.DRIVER
  },
  {
    key: 'client',
    name: 'Nico Ibarra',
    email: 'client@taxify.local',
    phone: '+1 (312) 847-1904',
    role: ROLES.CLIENT
  }
];

const seed = async () => {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
    throw new Error('Refusing to seed production without ALLOW_PRODUCTION_SEED=true');
  }

  await connectDb();

  const seeded = [];

  for (const entry of users) {
    let user = await User.findOne({ email: entry.email });
    if (!user) {
      user = await User.create({
        name: entry.name,
        email: entry.email,
        phone: entry.phone,
        role: entry.role,
        passwordHash: seedPassword
      });
    } else {
      user.name = entry.name;
      user.role = entry.role;
      user.phone = entry.phone;
      if (resetPasswords) {
        user.passwordHash = seedPassword;
      }
      await user.save();
    }

    if (entry.role === ROLES.DRIVER) {
      await DriverProfile.findOneAndUpdate(
        { user: user._id },
        {
          user: user._id,
          approvalStatus: DRIVER_APPROVAL_STATUS.APPROVED,
          lifecycleStatus: DRIVER_STATUS.ACTIVE,
          licenseNumber: 'TX-4472',
          vehicleMake: 'Toyota',
          vehicleModel: 'Camry',
          vehiclePlate: 'TXF-1842'
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    seeded.push({ role: entry.role, email: entry.email });
  }

  console.log('Seeded Taxify role users:');
  seeded.forEach((entry) => console.log(`- ${entry.role}: ${entry.email}`));
  console.log(`Default password: ${seedPassword}`);
  console.log('Seeded driver profile: APPROVED / ACTIVE');
};

seed()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error.message || error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });

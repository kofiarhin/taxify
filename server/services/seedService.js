const User = require("../models/User");
const DriverProfile = require("../models/DriverProfile");
const mongoose = require("mongoose");
const { ROLES } = require("../constants/roles");
const { DRIVER_STATUSES } = require("../constants/statuses");
const { hashPassword } = require("./authService");

const demoUsers = [
  {
    role: ROLES.ADMIN,
    fullName: "Mara Ellison",
    email: "admin@taxify.local",
    phone: "+1 (312) 847-1928",
    password: "TaxifyPass123",
  },
  {
    role: ROLES.DRIVER,
    fullName: "Ruben Vale",
    email: "driver@taxify.local",
    phone: "+1 (872) 555-9084",
    password: "TaxifyPass123",
  },
  {
    role: ROLES.CLIENT,
    fullName: "Avery Mensah",
    email: "client@taxify.local",
    phone: "+1 (312) 847-3049",
    password: "TaxifyPass123",
  },
];

async function clearDatabase() {
  if (!mongoose.connection.db) {
    throw new Error("Database connection is not ready");
  }

  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

async function createDemoUser(demoUser) {
  return User.create({
    role: demoUser.role,
    fullName: demoUser.fullName,
    email: demoUser.email.toLowerCase().trim(),
    phone: demoUser.phone,
    passwordHash: await hashPassword(demoUser.password),
    isActive: true,
  });
}

async function seedDemoUsers({ resetDatabase = true } = {}) {
  if (resetDatabase) {
    await clearDatabase();
  }

  const createdUsers = [];

  for (const demoUser of demoUsers) {
    const user = await createDemoUser(demoUser);
    createdUsers.push(user);
  }

  const driverUser = createdUsers.find((user) => user.role === ROLES.DRIVER);
  const adminUser = createdUsers.find((user) => user.role === ROLES.ADMIN);

  await DriverProfile.create({
    userId: driverUser._id,
    status: DRIVER_STATUSES.ACTIVE,
    licenseNumber: "IL-DRV-48391",
    licenseExpiry: new Date("2028-12-31"),
    vehicleMake: "Toyota",
    vehicleModel: "Camry",
    vehiclePlate: "TXF-2048",
    vehicleColor: "Graphite",
    nationalId: "4839-122-88",
    address: "241 Mercer Line, Chicago, IL",
    emergencyContact: "+1 (773) 555-1120",
    approvedBy: adminUser._id,
    approvedAt: new Date(),
    suspendedAt: null,
    suspensionReason: "",
    deactivatedAt: null,
    deactivationReason: "",
  });

  return demoUsers.map(({ role, fullName, email, password }) => ({
    role,
    fullName,
    email,
    password,
  }));
}

module.exports = { clearDatabase, seedDemoUsers };

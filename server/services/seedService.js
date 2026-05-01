const User = require("../models/User");
const DriverProfile = require("../models/DriverProfile");
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
    role: ROLES.AGENT,
    fullName: "Nico Carver",
    email: "agent@taxify.local",
    phone: "+1 (773) 555-2841",
    password: "TaxifyPass123",
  },
  {
    role: ROLES.DRIVER,
    fullName: "Ruben Vale",
    email: "driver@taxify.local",
    phone: "+1 (872) 555-9084",
    password: "TaxifyPass123",
  },
];

async function upsertDemoUser(demoUser) {
  const passwordHash = await hashPassword(demoUser.password);

  return User.findOneAndUpdate(
    { email: demoUser.email.toLowerCase().trim() },
    {
      role: demoUser.role,
      fullName: demoUser.fullName,
      email: demoUser.email.toLowerCase().trim(),
      phone: demoUser.phone,
      passwordHash,
      isActive: true,
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
}

async function seedDemoUsers() {
  const createdUsers = [];

  for (const demoUser of demoUsers) {
    const user = await upsertDemoUser(demoUser);
    createdUsers.push(user);
  }

  const driverUser = createdUsers.find((user) => user.role === ROLES.DRIVER);
  const adminUser = createdUsers.find((user) => user.role === ROLES.ADMIN);

  await DriverProfile.findOneAndUpdate(
    { userId: driverUser._id },
    {
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
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return demoUsers.map(({ role, fullName, email, password }) => ({
    role,
    fullName,
    email,
    password,
  }));
}

module.exports = { seedDemoUsers };

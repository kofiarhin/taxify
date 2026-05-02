const bcrypt = require("bcryptjs");
const request = require("supertest");
const app = require("../../app");
const User = require("../../models/User");
const DriverProfile = require("../../models/DriverProfile");
const { issueAccessToken } = require("../../services/authService");
const { ROLES } = require("../../constants/roles");
const { DRIVER_STATUSES } = require("../../constants/statuses");

async function createUser(attributes = {}) {
  const password = attributes.password ?? "TaxifyPass123";
  const user = await User.create({
    role: attributes.role ?? ROLES.AGENT,
    fullName: attributes.fullName ?? `User ${Math.random().toString(36).slice(2, 7)}`,
    email:
      attributes.email ??
      `${Math.random().toString(36).slice(2, 7)}@taxify.local`,
    phone: attributes.phone ?? "+1 (312) 847-1928",
    passwordHash: await bcrypt.hash(password, 10),
    isActive: attributes.isActive ?? true,
  });

  return { user, password };
}

async function createDriverAccount(options = {}) {
  const { user } = await createUser({
    role: ROLES.DRIVER,
    email: options.email,
    fullName: options.fullName,
    phone: options.phone,
    password: options.password,
  });

  const driverProfile = await DriverProfile.create({
    userId: user._id,
    status: options.status ?? DRIVER_STATUSES.ACTIVE,
    licenseNumber: options.licenseNumber ?? `LIC-${Math.random().toString(36).slice(2, 8)}`,
    licenseExpiry: options.licenseExpiry ?? new Date("2030-01-01T00:00:00.000Z"),
    vehicleMake: options.vehicleMake ?? "Toyota",
    vehicleModel: options.vehicleModel ?? "Corolla",
    vehiclePlate: options.vehiclePlate ?? `TX-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    vehicleColor: options.vehicleColor ?? "Silver",
    nationalId: options.nationalId ?? `NAT-${Math.random().toString(36).slice(2, 8)}`,
    address: options.address ?? "14 Fleet Street, London",
    emergencyContact: options.emergencyContact ?? "+1 (646) 552-9917",
    commissionDebt: options.commissionDebt ?? 0,
    lastAssignedAt: options.lastAssignedAt ?? null,
    lifecycleReason: options.lifecycleReason,
    suspensionReason: options.suspensionReason,
    deactivationReason: options.deactivationReason,
    suspendedAt: options.suspendedAt,
    deactivatedAt: options.deactivatedAt,
  });

  return { user, driverProfile };
}

function getAuthHeader(user) {
  return { Authorization: `Bearer ${issueAccessToken(user)}` };
}

async function createAuthenticatedRequest(role, overrides = {}) {
  if (role === ROLES.DRIVER) {
    const account = await createDriverAccount(overrides);
    return { ...account, headers: getAuthHeader(account.user) };
  }

  const account = await createUser({ role, ...overrides });
  return { ...account, headers: getAuthHeader(account.user) };
}

module.exports = {
  app,
  request,
  createUser,
  createDriverAccount,
  createAuthenticatedRequest,
  getAuthHeader,
};

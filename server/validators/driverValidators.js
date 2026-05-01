const { z } = require("zod");

const driverValidationSchemas = {
  register: z.object({
    body: z.object({
      fullName: z.string().min(2),
      email: z.string().email(),
      phone: z.string().min(7),
      password: z.string().min(8),
      licenseNumber: z.string().min(4),
      licenseExpiry: z.coerce.date(),
      vehicleMake: z.string().min(2),
      vehicleModel: z.string().min(1),
      vehiclePlate: z.string().min(3),
      vehicleColor: z.string().min(2),
      nationalId: z.string().min(4),
      address: z.string().min(8),
      emergencyContact: z.string().min(7),
    }),
    params: z.object({}),
    query: z.object({}),
  }),
};

module.exports = { driverValidationSchemas };

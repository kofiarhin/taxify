const { z } = require("zod");

const clientValidationSchemas = {
  createBooking: z.object({
    body: z.object({
      pickupAddress: z.string().min(5),
      dropoffAddress: z.string().min(5),
      pickupTime: z.coerce.date(),
      specialInstructions: z.string().max(500).optional().default(""),
      estimatedFare: z.coerce.number().positive().optional().nullable(),
    }),
    params: z.object({}),
    query: z.object({}),
  }),

  bookingId: z.object({
    body: z.object({}),
    params: z.object({ id: z.string().min(1) }),
    query: z.object({}),
  }),
};

module.exports = { clientValidationSchemas };

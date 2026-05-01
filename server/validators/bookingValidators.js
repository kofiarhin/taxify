const { z } = require("zod");

const bookingValidationSchemas = {
  create: z.object({
    body: z.object({
      customerName: z.string().min(2),
      customerPhone: z.string().min(7),
      pickupAddress: z.string().min(5),
      dropoffAddress: z.string().min(5),
      pickupTime: z.coerce.date(),
      specialInstructions: z.string().optional().default(""),
      estimatedFare: z.number().positive().optional().nullable(),
    }),
    params: z.object({}),
    query: z.object({}),
  }),

  cancel: z.object({
    body: z.object({
      reason: z.string().min(3).optional().default(""),
    }),
    params: z.object({ id: z.string().min(1) }),
    query: z.object({}),
  }),

  list: z.object({
    body: z.object({}),
    params: z.object({}),
    query: z.object({
      status: z.string().optional(),
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
    }),
  }),
};

module.exports = { bookingValidationSchemas };

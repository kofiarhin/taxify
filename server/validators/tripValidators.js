const { z } = require("zod");

const tripValidationSchemas = {
  endTrip: z.object({
    body: z.object({
      distanceKm: z.number().nonnegative().optional().nullable(),
      manualFare: z.number().nonnegative().optional().nullable(),
      fareNotes: z.string().max(500).optional().default(""),
    }),
    params: z.object({ bookingId: z.string().min(1) }),
    query: z.object({}),
  }),

  bookingId: z.object({
    body: z.object({}),
    params: z.object({ bookingId: z.string().min(1) }),
    query: z.object({}),
  }),
};

module.exports = { tripValidationSchemas };

const { z } = require("zod");

const tripValidationSchemas = {
  endTrip: z.object({
    body: z.object({}),
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

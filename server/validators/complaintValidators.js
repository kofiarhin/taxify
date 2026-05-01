const { z } = require("zod");
const { COMPLAINT_PRIORITIES, COMPLAINT_STATUSES } = require("../constants/statuses");

const complaintValidationSchemas = {
  create: z.object({
    body: z.object({
      bookingId: z.string().optional().nullable(),
      driverId: z.string().optional().nullable(),
      customerName: z.string().optional().default(""),
      customerPhone: z.string().optional().default(""),
      category: z.string().min(2),
      priority: z.enum(Object.values(COMPLAINT_PRIORITIES)).optional().default("MEDIUM"),
      description: z.string().min(10),
    }),
    params: z.object({}),
    query: z.object({}),
  }),

  update: z.object({
    body: z.object({
      status: z.enum(Object.values(COMPLAINT_STATUSES)).optional(),
      assignedToUserId: z.string().optional().nullable(),
      resolutionNotes: z.string().optional(),
    }),
    params: z.object({ id: z.string().min(1) }),
    query: z.object({}),
  }),

  resolve: z.object({
    body: z.object({
      resolutionNotes: z.string().min(5),
    }),
    params: z.object({ id: z.string().min(1) }),
    query: z.object({}),
  }),
};

module.exports = { complaintValidationSchemas };

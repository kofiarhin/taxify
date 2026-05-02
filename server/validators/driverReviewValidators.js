const { z } = require("zod");

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid booking id");

const driverReviewValidationSchemas = {
  submit: z.object({
    body: z.object({
      rating: z.coerce
        .number({ message: "Rating is required." })
        .int("Rating must be a whole number.")
        .min(1, "Rating must be between 1 and 5.")
        .max(5, "Rating must be between 1 and 5."),
      comment: z
        .string()
        .trim()
        .max(500, "Comment must be 500 characters or fewer.")
        .optional()
        .transform((value) => (value ? value : null)),
    }),
    params: z.object({ id: objectId }),
    query: z.object({}),
  }),
};

module.exports = { driverReviewValidationSchemas };

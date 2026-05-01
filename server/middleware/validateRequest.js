const { z } = require("zod");
const { ApiError } = require("../utils/apiError");

function validateRequest(schema) {
  return (req, _res, next) => {
    const parsed = schema.safeParse({
      body: req.body ?? {},
      params: req.params ?? {},
      query: req.query ?? {},
    });

    if (!parsed.success) {
      return next(
        new ApiError(400, "Validation failed", z.flattenError(parsed.error).fieldErrors)
      );
    }

    req.validated = parsed.data;
    return next();
  };
}

module.exports = { validateRequest };

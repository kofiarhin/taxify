const errorHandler = (err, _req, res, _next) => {
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: err.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')
      }
    });
  }

  const statusCode = err.statusCode || 500;
  const code = err.code || 'SERVER_ERROR';
  const message = statusCode === 500 ? 'Something went wrong' : err.message;

  if (process.env.NODE_ENV !== 'test' && statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    error: {
      code,
      message
    }
  });
};

module.exports = errorHandler;

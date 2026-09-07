import AppError from "../errors/AppError.js";

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const fields = Object.keys(err.keyValue || {});
  const errors = fields.map(field => ({
    field,
    message: `This ${field} is already in use. Please use another value.`
  }));
  return new AppError('Duplicate field value. Please correct the highlighted fields.', 400, errors);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors || {}).map(el => ({
    field: el.path,
    message: el.message
  }));
  return new AppError('Validation failed. Please correct the highlighted fields.', 400, errors);
};

export function errorHandler(err, req, res, next) {
  let error = err;

  // Normalize MongoDB / Mongoose errors into operational AppError instances
  if (err.name === 'CastError') error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);

  const statusCode = error.statusCode || err.statusCode || 500;

  // Development: show everything
  if (process.env.NODE_ENV === "development") {
    return res.status(statusCode).json({
      status: error.status || err.status || "error",
      message: error.message || err.message,
      errors: error.errors || err.errors || undefined,
      error: err,
      stack: err.stack,
    });
  }

  // Production: hide unexpected errors
  if (error.isOperational) {
    return res.status(statusCode).json({
      status: error.status,
      message: error.message,
      errors: error.errors || undefined,
    });
  }

  // Unknown errors
  console.error('ERROR 💥', err);
  return res.status(500).json({
    status: "error",
    message: "Something went wrong. Please try again later.",
  });
}
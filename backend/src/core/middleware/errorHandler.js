export function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;

  // Development: show everything
  if (process.env.NODE_ENV === "development") {
    return res.status(statusCode).json({
      status: error.status || "error",
      message: error.message,
      errors: error.errors || undefined,
      error,
      stack: error.stack,
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
  return res.status(500).json({
    status: "error",
    message: "Something went wrong. Please try again later.",
  });
}
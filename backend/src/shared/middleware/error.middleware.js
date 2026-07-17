export function notFoundHandler(_request, response) {
  response.status(404).json({
    status: "not_found",
    message: "Route not found.",
  });
}

export function errorHandler(error, _request, response, _next) {
  const statusCode = error.statusCode ?? 500;

  response.status(statusCode).json({
    status: "error",
    message: error.message ?? "Internal server error.",
  });
}

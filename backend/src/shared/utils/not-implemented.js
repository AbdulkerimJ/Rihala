export function createNotImplementedHandler(message) {
  return function notImplementedHandler(_request, response) {
    response.status(501).json({
      status: "not_implemented",
      message,
    });
  };
}

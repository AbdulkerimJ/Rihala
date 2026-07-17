export function asyncHandler(handler) {
  return function asyncHandlerWrapper(request, response, next) {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

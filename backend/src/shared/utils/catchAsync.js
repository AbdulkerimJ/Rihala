export function catchAsync(fn) {
  return function catchAsyncHandler(request, response, next) {
    Promise.resolve(fn(request, response, next)).catch(next);
  };
}

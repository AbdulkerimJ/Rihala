export function catchAsync(fn) {
  return function catchAsyncHandler(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

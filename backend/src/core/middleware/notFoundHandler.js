import NotFoundError from "../errors/NotFoundError.js";

export function notFoundHandler(req, res, next) {
  next(new NotFoundError(`Route not found: ${req.originalUrl}`));
}
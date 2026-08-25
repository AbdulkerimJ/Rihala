import NotFoundError from "../errors/NotFoundError.js";

export function notFoundHandler(req, res, next) {
  next(new NotFoundError("The requested resource could not be found."));
}
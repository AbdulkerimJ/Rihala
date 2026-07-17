import { env } from "../../config/env.js";
import { AppError } from "../utils/appError.js";

function sendErrorDev(error, response) {
  response.status(error.statusCode).json({
    status: error.status,
    message: error.message,
    error,
    stack: error.stack,
  });
}

function sendErrorProd(error, response) {
  if (error.isOperational) {
    response.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
    return;
  }

  response.status(500).json({
    status: "error",
    message: "Something went wrong!",
  });
}

export function notFoundHandler(req, res, next) {
  next(new AppError("Route not found.", 404));
}

export function errorHandler(error, req, res, next) {
  error.statusCode = error.statusCode ?? 500;
  error.status = error.status ?? "error";

  if (env.nodeEnv === "development") {
    sendErrorDev(error, res);
    return;
  }

  sendErrorProd(error, res);
}

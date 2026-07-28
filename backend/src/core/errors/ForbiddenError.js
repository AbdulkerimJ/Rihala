import AppError from "./AppError.js";

class ForbiddenError extends AppError {
  constructor(message = "Forbidden access") {
    super(message, 403);
  }
}

export default ForbiddenError;

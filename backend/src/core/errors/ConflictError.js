import AppError from "./AppError.js";

class ConflictError extends AppError {
  constructor(message, errors = null) {
    super(message, 409, errors);
  }
}

export default ConflictError;
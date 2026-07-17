import { AppError } from "../../shared/utils/appError.js";
import { catchAsync } from "../../shared/utils/catchAsync.js";

export const getWorkerPayments = catchAsync(async (req, res, next) => {
  throw new AppError("Worker payments are not implemented yet.", 501);
});

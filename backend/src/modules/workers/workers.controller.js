import { AppError } from "../../shared/utils/appError.js";
import { catchAsync } from "../../shared/utils/catchAsync.js";

export const getWorkers = catchAsync(async (req, res, next) => {
  throw new AppError("Workers are not implemented yet.", 501);
});

import { AppError } from "../../shared/utils/appError.js";
import { catchAsync } from "../../shared/utils/catchAsync.js";

export const getDashboard = catchAsync(async (req, res, next) => {
  throw new AppError("Dashboard is not implemented yet.", 501);
});

import { AppError } from "../../shared/utils/appError.js";
import { catchAsync } from "../../shared/utils/catchAsync.js";

export const getExpenses = catchAsync(async (req, res, next) => {
  throw new AppError("Expenses are not implemented yet.", 501);
});

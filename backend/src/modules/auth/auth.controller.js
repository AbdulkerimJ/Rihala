import { AppError } from "../../shared/utils/appError.js";
import { catchAsync } from "../../shared/utils/catchAsync.js";

export const login = catchAsync(async (_request, _response, _next) => {
  throw new AppError("Authentication login is not implemented yet.", 501);
});

export const logout = catchAsync(async (_request, _response, _next) => {
  throw new AppError("Authentication logout is not implemented yet.", 501);
});

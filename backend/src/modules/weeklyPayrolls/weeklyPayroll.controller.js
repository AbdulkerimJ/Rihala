import { catchAsync } from "../../core/utils/catchAsync.js";
import {
  getCurrentPayrollCalculationService,
  getWeeklyPayrollsService,
  getWeeklyPayrollByIdService,
  closeEmployeeWeeklyPayrollService,
} from "./weeklyPayroll.service.js";

const getAllWeeklyPayrollsController = catchAsync(async (req, res) => {
  const result = await getWeeklyPayrollsService(req.validatedQuery || {});

  res.status(200).json({
    status: "success",
    data: result.data,
    pagination: result.pagination,
  });
});

const getWeeklyPayrollByIdController = catchAsync(async (req, res) => {
  const payroll = await getWeeklyPayrollByIdService(req.validatedParams.id);

  res.status(200).json({
    status: "success",
    data: payroll,
  });
});

const getCurrentPayrollCalculationController = catchAsync(async (req, res) => {
  const payroll = await getCurrentPayrollCalculationService(
    req.validatedParams.employeeId,
  );

  res.status(200).json({
    status: "success",
    data: payroll,
  });
});

const closeEmployeeWeeklyPayrollController = catchAsync(async (req, res) => {
  const payroll = await closeEmployeeWeeklyPayrollService(
    req.validatedParams.employeeId,
    req.validatedBody
  );

  res.status(201).json({
    status: "success",
    data: payroll,
  });
});

export {
  getAllWeeklyPayrollsController,
  getWeeklyPayrollByIdController,
  getCurrentPayrollCalculationController,
  closeEmployeeWeeklyPayrollController,
};

import { catchAsync } from "../../core/utils/catchAsync.js";
import {
  createEmployeeRateService,
  getEmployeeRatesService,
  getEmployeeRateByIdService,
} from "./employeeRate.service.js";

const getAllEmployeeRatesController = catchAsync(async (req, res) => {
  const result = await getEmployeeRatesService(req.validatedQuery || {});

  res.status(200).json({
    status: "success",
    data: result.data,
    pagination: result.pagination,
  });
});

const createEmployeeRateController = catchAsync(async (req, res) => {
  const employeeRate = await createEmployeeRateService(req.validatedBody);

  res.status(201).json({
    status: "success",
    data: employeeRate,
  });
});

const getEmployeeRateByIdController = catchAsync(async (req, res) => {
  const employeeRate = await getEmployeeRateByIdService(req.validatedParams.id);

  res.status(200).json({
    status: "success",
    data: employeeRate,
  });
});

export {
  getAllEmployeeRatesController,
  createEmployeeRateController,
  getEmployeeRateByIdController,
};

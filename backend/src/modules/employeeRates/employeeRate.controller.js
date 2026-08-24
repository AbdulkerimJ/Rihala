import { catchAsync } from "../../core/utils/catchAsync.js";
import {
  createEmployeeRateService,
  getEmployeeRatesService,
  getEmployeeRateByIdService,
  updateEmployeeRateService,
  deleteEmployeeRateService,
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

const updateEmployeeRateController = catchAsync(async (req, res) => {
  const employeeRate = await updateEmployeeRateService(
    req.validatedParams.id,
    req.validatedBody,
  );

  res.status(200).json({
    status: "success",
    data: employeeRate,
  });
});

const deleteEmployeeRateController = catchAsync(async (req, res) => {
  await deleteEmployeeRateService(req.validatedParams.id);

  res.status(204).send();
});

export {
  getAllEmployeeRatesController,
  createEmployeeRateController,
  getEmployeeRateByIdController,
  updateEmployeeRateController,
  deleteEmployeeRateController,
};

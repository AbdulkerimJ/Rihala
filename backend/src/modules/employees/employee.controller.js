import { catchAsync } from "../../core/utils/catchAsync.js";
import {
  createEmployeeService,
  getEmployeesService,
  getEmployeeByIdService,
  updateEmployeeService,
  getEmployeeStatsService,
} from "./employee.service.js";

const getAllEmployeesController = catchAsync(async (req, res) => {
  const result = await getEmployeesService(req.validatedQuery || {});

  res.status(200).json({
    status: "success",
    data: result.data,
    pagination: result.pagination,
  });
});

const createEmployeeController = catchAsync(async (req, res) => {
  const employee = await createEmployeeService(req.validatedBody);

  res.status(201).json({
    status: "success",
    data: employee,
  });
});

const getEmployeeByIdController = catchAsync(async (req, res) => {
  const employee = await getEmployeeByIdService(req.validatedParams.id);

  res.status(200).json({
    status: "success",
    data: employee,
  });
});

const updateEmployeeController = catchAsync(async (req, res) => {
  const employee = await updateEmployeeService(
    req.validatedParams.id,
    req.validatedBody,
  );

  res.status(200).json({
    status: "success",
    data: employee,
  });
});

const getEmployeeStatsController = catchAsync(async (req, res) => {
  const stats = await getEmployeeStatsService(req.validatedParams.id);

  res.status(200).json({
    status: "success",
    data: stats,
  });
});

export {
  getAllEmployeesController,
  createEmployeeController,
  getEmployeeByIdController,
  updateEmployeeController,
  getEmployeeStatsController,
};

import { catchAsync } from "../../core/utils/catchAsync.js";
import {
  createEmployeePaymentService,
  getEmployeePaymentsService,
  getEmployeePaymentByIdService,
  updateEmployeePaymentService,
} from "./employeePayment.service.js";

const getAllEmployeePaymentsController = catchAsync(async (req, res) => {
  const result = await getEmployeePaymentsService(req.validatedQuery || {});

  res.status(200).json({
    status: "success",
    data: result.data,
    pagination: result.pagination,
  });
});

const createEmployeePaymentController = catchAsync(async (req, res) => {
  const payment = await createEmployeePaymentService(req.validatedBody);

  res.status(201).json({
    status: "success",
    data: payment,
  });
});

const getEmployeePaymentByIdController = catchAsync(async (req, res) => {
  const payment = await getEmployeePaymentByIdService(req.validatedParams.id);

  res.status(200).json({
    status: "success",
    data: payment,
  });
});

const updateEmployeePaymentController = catchAsync(async (req, res) => {
  const payment = await updateEmployeePaymentService(
    req.validatedParams.id,
    req.validatedBody,
  );

  res.status(200).json({
    status: "success",
    data: payment,
  });
});

export {
  getAllEmployeePaymentsController,
  createEmployeePaymentController,
  getEmployeePaymentByIdController,
  updateEmployeePaymentController,
};

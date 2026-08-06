import { catchAsync } from "../../core/utils/catchAsync.js";
import {
  createExpenseService,
  getExpensesService,
  getExpenseByIdService,
  updateExpenseService,
  voidExpenseService,
} from "./expense.service.js";

const getAllExpensesController = catchAsync(async (req, res) => {
  const result = await getExpensesService(req.validatedQuery || {});

  res.status(200).json({
    status: "success",
    data: result.data,
    pagination: result.pagination,
  });
});

const createExpenseController = catchAsync(async (req, res) => {
  const expense = await createExpenseService(req.validatedBody, req.user.id);

  res.status(201).json({
    status: "success",
    data: expense,
  });
});

const getExpenseByIdController = catchAsync(async (req, res) => {
  const expense = await getExpenseByIdService(req.validatedParams.id);

  res.status(200).json({
    status: "success",
    data: expense,
  });
});

const updateExpenseController = catchAsync(async (req, res) => {
  const expense = await updateExpenseService(
    req.validatedParams.id,
    req.validatedBody,
  );

  res.status(200).json({
    status: "success",
    data: expense,
  });
});

const voidExpenseController = catchAsync(async (req, res) => {
  const expense = await voidExpenseService(req.validatedParams.id, req.validatedBody.voidReason, req.user.id);

  res.status(200).json({
    status: "success",
    data: expense,
  });
});

export {
  getAllExpensesController,
  createExpenseController,
  getExpenseByIdController,
  updateExpenseController,
  voidExpenseController,
};

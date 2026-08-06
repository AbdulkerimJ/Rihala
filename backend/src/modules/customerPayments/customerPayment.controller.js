import { catchAsync } from "../../core/utils/catchAsync.js";
import {
  createCustomerPaymentService,
  getCustomerPaymentsService,
  getCustomerPaymentByIdService,
  updateCustomerPaymentService,
  voidCustomerPaymentService,
} from "./customerPayment.service.js";

const getAllCustomerPaymentsController = catchAsync(async (req, res) => {
  const result = await getCustomerPaymentsService(req.validatedQuery || {});

  res.status(200).json({
    status: "success",
    data: result.data,
    pagination: result.pagination,
  });
});

const createCustomerPaymentController = catchAsync(async (req, res) => {
  const payment = await createCustomerPaymentService(req.validatedBody, req.user.id);

  res.status(201).json({
    status: "success",
    data: payment,
  });
});

const getCustomerPaymentByIdController = catchAsync(async (req, res) => {
  const payment = await getCustomerPaymentByIdService(req.validatedParams.id);

  res.status(200).json({
    status: "success",
    data: payment,
  });
});

const updateCustomerPaymentController = catchAsync(async (req, res) => {
  const payment = await updateCustomerPaymentService(
    req.validatedParams.id,
    req.validatedBody
  );

  res.status(200).json({
    status: "success",
    data: payment,
  });
});

const voidCustomerPaymentController = catchAsync(async (req, res) => {
  const payment = await voidCustomerPaymentService(
    req.validatedParams.id,
    req.validatedBody.voidReason,
    req.user.id
  );

  res.status(200).json({
    status: "success",
    data: payment,
  });
});

export {
  getAllCustomerPaymentsController,
  createCustomerPaymentController,
  getCustomerPaymentByIdController,
  updateCustomerPaymentController,
  voidCustomerPaymentController,
};

import { catchAsync } from "../../core/utils/catchAsync.js";
import {
  createPaymentService,
  getPaymentsService,
  getPaymentByIdService,
  updatePaymentService,
} from "./payment.service.js";

const getAllPaymentsController = catchAsync(async (req, res) => {
  const result = await getPaymentsService(req.validatedQuery || {});

  res.status(200).json({
    status: "success",
    data: result.data,
    pagination: result.pagination,
  });
});

const createPaymentController = catchAsync(async (req, res) => {
  const payment = await createPaymentService(req.validatedBody);

  res.status(201).json({
    status: "success",
    data: payment,
  });
});

const getPaymentByIdController = catchAsync(async (req, res) => {
  const payment = await getPaymentByIdService(req.validatedParams.id);

  res.status(200).json({
    status: "success",
    data: payment,
  });
});

const updatePaymentController = catchAsync(async (req, res) => {
  const payment = await updatePaymentService(
    req.validatedParams.id,
    req.validatedBody,
  );

  res.status(200).json({
    status: "success",
    data: payment,
  });
});

export {
  getAllPaymentsController,
  createPaymentController,
  getPaymentByIdController,
  updatePaymentController,
};

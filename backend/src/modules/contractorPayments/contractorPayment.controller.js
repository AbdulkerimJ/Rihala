import { catchAsync } from "../../core/utils/catchAsync.js";
import * as contractorPaymentService from "./contractorPayment.service.js";

const createPayment = catchAsync(async (req, res) => {
  const payment = await contractorPaymentService.createPaymentService(
    req.validatedBody,
    req.user._id
  );

  res.status(201).json({
    status: "success",
    data: {
      payment,
    },
  });
});

const getPayments = catchAsync(async (req, res) => {
  const result = await contractorPaymentService.getPaymentsService(req.validatedQuery);

  res.status(200).json({
    status: "success",
    data: result,
  });
});

const getPaymentById = catchAsync(async (req, res) => {
  const payment = await contractorPaymentService.getPaymentByIdService(req.validatedParams.id);

  res.status(200).json({
    status: "success",
    data: {
      payment,
    },
  });
});

const voidPayment = catchAsync(async (req, res) => {
  const payment = await contractorPaymentService.voidPaymentService(
    req.validatedParams.id,
    req.validatedBody.voidReason,
    req.user._id
  );

  res.status(200).json({
    status: "success",
    data: {
      payment,
    },
  });
});

export {
  createPayment,
  getPayments,
  getPaymentById,
  voidPayment,
};

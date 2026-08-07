import { catchAsync } from "../../core/utils/catchAsync.js";
import {
  createSupplierPaymentService,
  getSupplierPaymentsService,
  getSupplierPaymentByIdService,
  updateSupplierPaymentService,
  voidSupplierPaymentService,
} from "./supplierPayment.service.js";

const getAllSupplierPaymentsController = catchAsync(async (req, res) => {
  const result = await getSupplierPaymentsService(req.validatedQuery || {});

  res.status(200).json({
    status: "success",
    data: result.data,
    pagination: result.pagination,
  });
});

const createSupplierPaymentController = catchAsync(async (req, res) => {
  const payment = await createSupplierPaymentService(req.validatedBody);

  res.status(201).json({
    status: "success",
    data: payment,
  });
});

const getSupplierPaymentByIdController = catchAsync(async (req, res) => {
  const payment = await getSupplierPaymentByIdService(req.validatedParams.id);

  res.status(200).json({
    status: "success",
    data: payment,
  });
});

const updateSupplierPaymentController = catchAsync(async (req, res) => {
  const payment = await updateSupplierPaymentService(
    req.validatedParams.id,
    req.validatedBody,
  );

  res.status(200).json({
    status: "success",
    data: payment,
  });
});

const voidSupplierPaymentController = catchAsync(async (req, res) => {
  const payment = await voidSupplierPaymentService(
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
  getAllSupplierPaymentsController,
  createSupplierPaymentController,
  getSupplierPaymentByIdController,
  updateSupplierPaymentController,
  voidSupplierPaymentController,
};

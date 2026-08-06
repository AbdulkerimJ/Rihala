import { catchAsync } from "../../core/utils/catchAsync.js";
import {
  createPurchaseService,
  getPurchasesService,
  getPurchaseByIdService,
  updatePurchaseService,
} from "./purchase.service.js";

const getAllPurchasesController = catchAsync(async (req, res) => {
  const result = await getPurchasesService(req.validatedQuery || {});

  res.status(200).json({
    status: "success",
    data: result.data,
    pagination: result.pagination,
  });
});

const createPurchaseController = catchAsync(async (req, res) => {
  const purchase = await createPurchaseService(req.validatedBody);

  res.status(201).json({
    status: "success",
    data: purchase,
  });
});

const getPurchaseByIdController = catchAsync(async (req, res) => {
  const purchase = await getPurchaseByIdService(req.validatedParams.id);

  res.status(200).json({
    status: "success",
    data: purchase,
  });
});

const updatePurchaseController = catchAsync(async (req, res) => {
  const purchase = await updatePurchaseService(
    req.validatedParams.id,
    req.validatedBody,
  );

  res.status(200).json({
    status: "success",
    data: purchase,
  });
});

export {
  getAllPurchasesController,
  createPurchaseController,
  getPurchaseByIdController,
  updatePurchaseController,
};

import { catchAsync } from "../../core/utils/catchAsync.js";
import {
  createSupplierService,
  getSuppliersService,
  getSupplierByIdService,
  updateSupplierService,
  softDeleteSupplierService,
} from "./supplier.service.js";

const getAllSuppliersController = catchAsync(async (req, res) => {
  const result = await getSuppliersService(req.validatedQuery || {});

  res.status(200).json({
    status: "success",
    data: result.data,
    pagination: result.pagination,
  });
});

const createSupplierController = catchAsync(async (req, res) => {
  const supplier = await createSupplierService(req.validatedBody);

  res.status(201).json({
    status: "success",
    data: supplier,
  });
});

const getSupplierByIdController = catchAsync(async (req, res) => {
  const supplier = await getSupplierByIdService(req.validatedParams.id);

  res.status(200).json({
    status: "success",
    data: supplier,
  });
});

const updateSupplierController = catchAsync(async (req, res) => {
  const supplier = await updateSupplierService(
    req.validatedParams.id,
    req.validatedBody,
  );

  res.status(200).json({
    status: "success",
    data: supplier,
  });
});

const softDeleteSupplierController = catchAsync(async (req, res) => {
  const supplier = await softDeleteSupplierService(req.validatedParams.id, req.user.id);

  res.status(200).json({
    status: "success",
    data: supplier,
  });
});

export {
  getAllSuppliersController,
  createSupplierController,
  getSupplierByIdController,
  updateSupplierController,
  softDeleteSupplierController,
};

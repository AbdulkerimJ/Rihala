import { catchAsync } from "../../core/utils/catchAsync.js";
import {
  createCustomerService,
  getCustomersService,
  getCustomerByIdService,
  updateCustomerService,
} from "./customer.service.js";

const getAllCustomersController = catchAsync(async (req, res) => {
  const result = await getCustomersService(req.validatedQuery || {});

  res.status(200).json({
    status: "success",
    data: result.data,
    pagination: result.pagination,
  });
});

const createCustomerController = catchAsync(async (req, res) => {
  const customer = await createCustomerService(req.validatedBody);

  res.status(201).json({
    status: "success",
    data: customer,
  });
});

const getCustomerByIdController = catchAsync(async (req, res) => {
  const customer = await getCustomerByIdService(req.validatedParams.id);

  res.status(200).json({
    status: "success",
    data: customer,
  });
});

const updateCustomerController = catchAsync(async (req, res) => {
  const customer = await updateCustomerService(
    req.validatedParams.id,
    req.validatedBody,
  );

  res.status(200).json({
    status: "success",
    data: customer,
  });
});

export {
  getAllCustomersController,
  createCustomerController,
  getCustomerByIdController,
  updateCustomerController,
};

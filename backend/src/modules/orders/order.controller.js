import {
  createOrderService,
  getOrdersService,
  getOrderByIdService,
  updateOrderService,
} from "./order.service.js";
import {catchAsync} from "../../core/utils/catchAsync.js";

const createOrder = catchAsync(async (req, res) => {
  const order = await createOrderService(req.validatedBody, req.user._id);
  res.status(201).json({
    success: true,
    message: "Order created successfully.",
    data: order,
  });
});

const getOrders = catchAsync(async (req, res) => {
  const result = await getOrdersService(req.validatedQuery);
  res.status(200).json({
    success: true,
    message: "Orders fetched successfully.",
    data: result,
  });
});

const getOrderById = catchAsync(async (req, res) => {
  const order = await getOrderByIdService(req.validatedParams.id);
  res.status(200).json({
    success: true,
    message: "Order fetched successfully.",
    data: order,
  });
});

const updateOrder = catchAsync(async (req, res) => {
  const order = await updateOrderService(req.params.id, req.validatedBody);
  res.status(200).json({
    success: true,
    message: "Order updated successfully.",
    data: order,
  });
});

export { createOrder, getOrders, getOrderById, updateOrder };

import Order from "./order.model.js";
import Customer from "../customers/customer.model.js";
import User from "../users/user.model.js";
import orderQueryConfig from "./order.query.js";
import ConflictError from "../../core/errors/ConflictError.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import ValidationError from "../../core/errors/ValidationError.js";
import { getPaginatedQueryResult } from "../../core/utils/query.js";

const VALID_TRANSITIONS = {
  pending: ["in_progress", "cancelled"],
  in_progress: ["ready", "cancelled"],
  ready: ["completed"],
  completed: [],
  cancelled: [],
};

export const isValidStatusTransition = (currentStatus, nextStatus) => {
  if (!currentStatus || !nextStatus) {
    return false;
  }

  return VALID_TRANSITIONS[currentStatus]?.includes(nextStatus) || false;
};

const ensureCustomerCanBeUsed = async (customerId) => {
  const customer = await Customer.findById(customerId);

  if (!customer) {
    throw new NotFoundError("Customer not found.");
  }

  if (customer.status === "inactive") {
    throw new ValidationError(
      "Customer is inactive and cannot be used for an order.",
    );
  }

  return customer;
};

const createOrderService = async (data, userId) => {
  const normalizedData = {
    ...data,
    createdBy: userId,
    status: "pending",
  };

  await ensureCustomerCanBeUsed(normalizedData.customer);

  const order = await Order.create(normalizedData);

  return order.populate(["customer", "createdBy"]);
};

const getOrdersService = async (filters = {}) => {
  return getPaginatedQueryResult(Order, filters, orderQueryConfig, {
    populate: ["customer", "createdBy"],
  });
};

const getOrderByIdService = async (orderId) => {
  const order = await Order.findById(orderId).populate([
    "customer",
    "createdBy",
  ]);

  if (!order) {
    throw new NotFoundError("Order not found.");
  }

  return order;
};

const updateOrderService = async (orderId, updateData) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new NotFoundError("Order not found.");
  }

  if (updateData.customer !== undefined) {
    await ensureCustomerCanBeUsed(updateData.customer);
  }

  if (updateData.status !== undefined) {
    if (!isValidStatusTransition(order.status, updateData.status)) {
      throw new ValidationError("Invalid order status transition.");
    }
  }

  if (updateData.createdBy !== undefined) {
    throw new ValidationError("createdBy cannot be changed.");
  }

  if (updateData.createdAt !== undefined) {
    throw new ValidationError("createdAt cannot be changed.");
  }

  Object.assign(order, updateData);
  await order.save();

  return order.populate(["customer", "createdBy"]);
};

export {
  createOrderService,
  getOrdersService,
  getOrderByIdService,
  updateOrderService,
};

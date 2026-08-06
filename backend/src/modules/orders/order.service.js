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

const generateOrderNumber = async () => {
  const count = await Order.countDocuments();
  return `ORD-${(count + 1001).toString()}`;
};

const createOrderService = async (data, userId) => {
  const customer = await ensureCustomerCanBeUsed(data.customer);

  const orderNumber = await generateOrderNumber();

  const existing = await Order.findOne({ orderNumber });
  if (existing) {
    throw new ConflictError("Order number already exists.");
  }

  const normalizedData = {
    ...data,
    orderNumber,
    customerName: customer.name,
    customerPhone: customer.phone,
    createdBy: userId,
    date: data.date || new Date(),
    status: "pending",
    statusHistory: [
      {
        status: "pending",
        changedBy: userId,
      },
    ],
  };

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

const updateOrderService = async (orderId, updateData, userId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new NotFoundError("Order not found.");
  }

  if (order.status === "completed" || order.status === "cancelled") {
    throw new ValidationError("Cannot modify a completed or cancelled order.");
  }

  if (updateData.customer !== undefined && updateData.customer.toString() !== order.customer.toString()) {
    const customer = await ensureCustomerCanBeUsed(updateData.customer);
    order.customerName = customer.name;
    order.customerPhone = customer.phone;
    order.customer = customer._id;
  }

  if (updateData.status !== undefined && updateData.status !== order.status) {
    if (!isValidStatusTransition(order.status, updateData.status)) {
      throw new ValidationError("Invalid order status transition.");
    }
    order.statusHistory.push({
      status: updateData.status,
      changedBy: userId,
    });
    order.status = updateData.status;
  }

  if (updateData.date) order.date = updateData.date;
  if (updateData.items) order.items = updateData.items;
  if (updateData.agreedAmount !== undefined) order.agreedAmount = updateData.agreedAmount;
  if (updateData.expectedCompletionDate) order.expectedCompletionDate = updateData.expectedCompletionDate;
  if (updateData.notes !== undefined) order.notes = updateData.notes;

  await order.save();

  return order.populate(["customer", "createdBy"]);
};

export {
  createOrderService,
  getOrdersService,
  getOrderByIdService,
  updateOrderService,
};

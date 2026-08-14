import mongoose from "mongoose";
import Order from "./order.model.js";
import CustomerPayment from "../customerPayments/customerPayment.model.js";
import Customer from "../customers/customer.model.js";
import User from "../users/user.model.js";
import Counter from "../../core/models/counter.model.js";
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
      "Customer is inactive and cannot be used for an order."
    );
  }

  return customer;
};

const generateOrderNumber = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: "orderNumber" },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return `ORD-${counter.seq + 1000}`;
};

const createOrderService = async (data, userId) => {
  const customer = await ensureCustomerCanBeUsed(data.customer);

  const orderNumber = await generateOrderNumber();

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
  return order.populate(["customer", "createdBy", "statusHistory.changedBy"]);
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
    "statusHistory.changedBy",
  ]);

  if (!order) {
    throw new NotFoundError("Order not found.");
  }

  return order;
};

const updateOrderService = async (orderId, updateData, userId) => {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      // 1. Acquire write lock on the order
      const order = await Order.findOneAndUpdate(
        { _id: orderId },
        { $currentDate: { updatedAt: true } },
        { new: true, session }
      );

      if (!order) {
        throw new NotFoundError("Order not found.");
      }

      if (order.status === "completed" || order.status === "cancelled") {
        throw new ValidationError("Cannot modify a completed or cancelled order.");
      }

      if (updateData.customer !== undefined && updateData.customer.toString() !== order.customer.toString()) {
        const paymentExists = await CustomerPayment.exists({ order: order._id, status: "active" }).session(session);
        if (paymentExists) {
          throw new ValidationError(
            "Cannot change the customer after customer payment history exists."
          );
        }
        const customer = await ensureCustomerCanBeUsed(updateData.customer);
        order.customerName = customer.name;
        order.customerPhone = customer.phone;
        order.customer = customer._id;
      }

      if (updateData.status !== undefined && updateData.status !== order.status) {
        if (!isValidStatusTransition(order.status, updateData.status)) {
          throw new ValidationError("Invalid order status transition.");
        }
        
        if (updateData.status === "cancelled") {
          const activePayments = await CustomerPayment.find({
            order: order._id,
            status: "active",
          }).session(session);
          if (activePayments.length > 0) {
            throw new ValidationError("Cannot cancel an order with active customer payments. Void the payments first.");
          }
        }

        order.statusHistory.push({
          status: updateData.status,
          changedBy: userId,
        });
        order.status = updateData.status;
      }

      if (updateData.date) order.date = updateData.date;
      if (updateData.description !== undefined) order.description = updateData.description;

      if (updateData.agreedAmount !== undefined && updateData.agreedAmount !== order.agreedAmount) {
        const activePayments = await CustomerPayment.find({
          order: order._id,
          status: "active",
        }).session(session);
        const totalPaid = activePayments.reduce((sum, p) => sum + p.amount, 0);
        if (updateData.agreedAmount < totalPaid) {
          throw new ValidationError("Cannot reduce agreed amount below the amount already paid.");
        }
        order.agreedAmount = updateData.agreedAmount;
      }
      
      if (updateData.expectedCompletionDate) order.expectedCompletionDate = updateData.expectedCompletionDate;
      if (updateData.notes !== undefined) order.notes = updateData.notes;

      await order.save({ session });

      return order.populate(["customer", "createdBy", "statusHistory.changedBy"]);
    });
  } finally {
    session.endSession();
  }
};

export {
  createOrderService,
  getOrdersService,
  getOrderByIdService,
  updateOrderService,
};

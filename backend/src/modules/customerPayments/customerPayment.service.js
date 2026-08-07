import mongoose from "mongoose";
import CustomerPayment from "./customerPayment.model.js";
import customerPaymentQueryConfig from "./customerPayment.query.js";
import Order from "../orders/order.model.js";
import ValidationError from "../../core/errors/ValidationError.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import { getPaginatedQueryResult } from "../../core/utils/query.js";

const createCustomerPaymentService = async (data, userId) => {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      // 1 & 2. Ensure Order exists and acquire a write lock for concurrency
      const order = await Order.findOneAndUpdate(
        { _id: data.order },
        { $currentDate: { updatedAt: true } },
        { new: true, session }
      );
      if (!order) {
        throw new NotFoundError("Order not found.");
      }

      // 3. Ensure Order is not cancelled
      if (order.status === "cancelled") {
        throw new ValidationError("Cannot create payment for a cancelled order.");
      }

      // 4. Calculate the current active paid amount
      const activePayments = await CustomerPayment.find({
        order: order._id,
        status: "active",
      }).session(session);
      
      const totalPaid = activePayments.reduce((sum, p) => sum + p.amount, 0);

      // 5. Calculate remaining amount
      const remainingAmount = order.agreedAmount - totalPaid;

      if (remainingAmount <= 0) {
        throw new ValidationError("Order is already fully paid.");
      }

      // 6. Reject if it exceeds the remaining amount
      if (data.amount > remainingAmount) {
        throw new ValidationError(`Payment amount (${data.amount}) exceeds the remaining balance (${remainingAmount}).`);
      }

      // 7 & 8. Snapshot customerName and orderNumber from Order
      const paymentData = {
        order: order._id,
        amount: data.amount,
        paymentDate: data.paymentDate,
        customerName: order.customerName,
        orderNumber: order.orderNumber,
        note: data.note,
        status: "active",
        voidReason: undefined,
        voidedAt: undefined,
        voidedBy: undefined,
      };

      // 9. Create payment
      const [payment] = await CustomerPayment.create([paymentData], { session });

      return payment;
    });
  } finally {
    session.endSession();
  }
};

const getCustomerPaymentsService = async (filters = {}) => {
  if (!filters.status) {
    filters.status = "active";
  }

  return getPaginatedQueryResult(
    CustomerPayment,
    filters,
    customerPaymentQueryConfig,
    { populate: "order voidedBy" }
  );
};

const getCustomerPaymentByIdService = async (paymentId) => {
  const payment = await CustomerPayment.findById(paymentId).populate("order voidedBy");

  if (!payment) {
    throw new NotFoundError("Customer payment not found.");
  }

  return payment;
};

const updateCustomerPaymentService = async (paymentId, updateData) => {
  const payment = await CustomerPayment.findById(paymentId);

  if (!payment) {
    throw new NotFoundError("Customer payment not found.");
  }

  if (payment.status === "voided") {
    throw new ValidationError("Cannot update a voided payment.");
  }

  if (updateData.note !== undefined) {
    payment.note = updateData.note;
  }

  await payment.save();

  return payment;
};

const voidCustomerPaymentService = async (paymentId, voidReason, userId) => {
  const payment = await CustomerPayment.findById(paymentId);

  if (!payment) {
    throw new NotFoundError("Customer payment not found.");
  }

  if (payment.status === "voided") {
    throw new ValidationError("Customer payment is already voided.");
  }

  payment.status = "voided";
  payment.voidReason = voidReason;
  payment.voidedAt = new Date();
  payment.voidedBy = userId;

  await payment.save();

  return payment;
};

export {
  createCustomerPaymentService,
  getCustomerPaymentsService,
  getCustomerPaymentByIdService,
  updateCustomerPaymentService,
  voidCustomerPaymentService,
};

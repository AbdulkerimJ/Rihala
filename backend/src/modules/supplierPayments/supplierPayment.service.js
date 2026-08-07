import mongoose from "mongoose";
import SupplierPayment from "./supplierPayment.model.js";
import supplierPaymentQueryConfig from "./supplierPayment.query.js";
import ConflictError from "../../core/errors/ConflictError.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import ValidationError from "../../core/errors/ValidationError.js";
import { getPaginatedQueryResult } from "../../core/utils/query.js";
import Supplier from "../suppliers/supplier.model.js";
import { allocateSpecificPayment, allocateGeneralPayment, reconcilePaymentAmount, reversePaymentAllocations } from "./allocation.service.js";

const generatePaymentReference = async () => {
  const count = await SupplierPayment.countDocuments();
  return `PAY-${(count + 1001).toString()}`;
};

const createSupplierPaymentService = async (data) => {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const supplier = await Supplier.findById(data.supplier).session(session);
      if (!supplier) {
        throw new NotFoundError("Supplier not found");
      }

      if (supplier.status === "inactive") {
        throw new ValidationError("Cannot create payment for an inactive supplier");
      }

      const paymentReference = data.paymentReference || (await generatePaymentReference());

      const existing = await SupplierPayment.findOne({ paymentReference }).session(session);
      if (existing) {
        throw new ConflictError("Payment reference already exists");
      }

      const payment = new SupplierPayment({
        paymentReference,
        supplier: supplier._id,
        type: data.type,
        amount: data.amount,
        date: data.date,
        note: data.note,
        allocations: [],
        unallocatedAmount: data.amount, // Default before hooks
      });

      if (data.type === "SPECIFIC") {
        payment.purchaseId = data.purchaseId;
      }

      // We don't save it yet, we pass it to the allocation engine which will save it.
      
      if (data.type === "SPECIFIC") {
        await allocateSpecificPayment(payment, data.purchaseId, session);
      } else if (data.type === "GENERAL") {
        await allocateGeneralPayment(payment, null, session);
      }

      const finalPayment = await SupplierPayment.findById(payment._id).populate(supplierPaymentQueryConfig.populate).session(session);
      return finalPayment;
    });
  } finally {
    session.endSession();
  }
};

const getSupplierPaymentsService = async (filters = {}) => {
  if (!filters.status) {
    filters.status = "active";
  }
  return getPaginatedQueryResult(SupplierPayment, filters, supplierPaymentQueryConfig, { populate: "voidedBy" });
};

const getSupplierPaymentByIdService = async (paymentId) => {
  const payment = await SupplierPayment.findById(paymentId).populate(supplierPaymentQueryConfig.populate).populate("voidedBy", "name email");

  if (!payment) {
    throw new NotFoundError("Payment not found.");
  }

  return payment;
};

const updateSupplierPaymentService = async (paymentId, updateData) => {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const payment = await SupplierPayment.findOneAndUpdate(
        { _id: paymentId },
        { $currentDate: { updatedAt: true } },
        { new: true, session }
      );

      if (!payment) {
        throw new NotFoundError("Payment not found.");
      }

      if (payment.status === "voided") {
        throw new ValidationError("Cannot update a voided payment.");
      }

      if (updateData.date) payment.date = updateData.date;
      if (updateData.note !== undefined) payment.note = updateData.note;

      if (updateData.amount && updateData.amount !== payment.amount) {
        // Triggers reconciliation if amount decreases below allocated total
        await reconcilePaymentAmount(payment, updateData.amount, session);
      } else {
        await payment.save({ session });
      }

      const updatedPayment = await SupplierPayment.findById(paymentId).populate(supplierPaymentQueryConfig.populate).session(session);
      return updatedPayment;
    });
  } finally {
    session.endSession();
  }
};

const voidSupplierPaymentService = async (paymentId, voidReason, userId) => {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      // Lock payment
      const payment = await SupplierPayment.findOneAndUpdate(
        { _id: paymentId },
        { $currentDate: { updatedAt: true } },
        { new: true, session }
      );

      if (!payment) {
        throw new NotFoundError("Payment not found.");
      }

      if (payment.status === "voided") {
        throw new ValidationError("Payment is already voided.");
      }

      payment.status = "voided";
      payment.voidReason = voidReason;
      payment.voidedAt = new Date();
      payment.voidedBy = userId;

      // Reverse allocations and update unallocatedAmount to 0
      await reversePaymentAllocations(payment, session);

      const finalPayment = await SupplierPayment.findById(payment._id)
        .populate(supplierPaymentQueryConfig.populate)
        .populate("voidedBy", "name email")
        .session(session);

      return finalPayment;
    });
  } finally {
    session.endSession();
  }
};

export {
  createSupplierPaymentService,
  getSupplierPaymentsService,
  getSupplierPaymentByIdService,
  updateSupplierPaymentService,
  voidSupplierPaymentService,
};

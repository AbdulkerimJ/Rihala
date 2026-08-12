import mongoose from "mongoose";
import ContractorPayment from "./contractorPayment.model.js";
import Contract from "../contracts/contract.model.js";
import Counter from "../../core/models/counter.model.js";
import contractorPaymentQueryConfig from "./contractorPayment.query.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import ValidationError from "../../core/errors/ValidationError.js";
import { getPaginatedQueryResult } from "../../core/utils/query.js";
import { normalizeDateValue } from "../../core/utils/date.js";
import { getContractStatsService } from "../contracts/contract.service.js";

const generatePaymentReference = async (session = null) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: "paymentReference" },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true, session }
  );
  return `PAY-${counter.seq + 1000}`;
};

const createPaymentService = async (data, userId) => {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      // 1. Lock contract
      const contract = await Contract.findOneAndUpdate(
        { _id: data.contract },
        { $currentDate: { updatedAt: true } },
        { new: true, session }
      );

      if (!contract) {
        throw new NotFoundError("Contract not found.");
      }

      if (contract.status === "CANCELLED") {
        throw new ValidationError("Cannot add payment to a cancelled contract.");
      }

      // 2. Fetch stats
      const { completedQuantity, totalPaid } = await getContractStatsService(contract._id, session);
      const completedWorkValue = Math.round(completedQuantity * contract.unitPrice * 100) / 100;
      
      // 3. BR-CP1: Total payments cannot exceed completed work value
      // Adding a small tolerance for floating point inaccuracy
      if (totalPaid + data.amount - completedWorkValue > 0.001) {
        throw new ValidationError(`Payment would exceed the value of completed work. Payable amount is ${completedWorkValue - totalPaid}.`);
      }

      // 4. Generate reference and create payment
      const paymentReference = await generatePaymentReference(session);

      const paymentData = {
        ...data,
        paymentReference,
        paymentDate: normalizeDateValue(data.paymentDate),
        createdBy: userId,
      };

      const [payment] = await ContractorPayment.create([paymentData], { session });

      return payment;
    });
  } finally {
    session.endSession();
  }
};

const getPaymentsService = async (filters = {}) => {
  return getPaginatedQueryResult(ContractorPayment, filters, contractorPaymentQueryConfig);
};

const getPaymentByIdService = async (id) => {
  const payment = await ContractorPayment.findById(id).populate(contractorPaymentQueryConfig.populate);

  if (!payment) {
    throw new NotFoundError("Contractor payment not found.");
  }

  return payment;
};

const voidPaymentService = async (id, reason, userId) => {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      // 1. Find and lock payment implicitly by using it in a transaction
      const payment = await ContractorPayment.findById(id).session(session);
      
      if (!payment) {
        throw new NotFoundError("Contractor payment not found.");
      }

      if (payment.status === "voided") {
        throw new ValidationError("Contractor payment is already voided.");
      }

      // 2. Void payment
      payment.status = "voided";
      payment.voidReason = reason;
      payment.voidedAt = new Date();
      payment.voidedBy = userId;
      await payment.save({ session });

      return payment.populate(contractorPaymentQueryConfig.populate);
    });
  } finally {
    session.endSession();
  }
};

export {
  createPaymentService,
  getPaymentsService,
  getPaymentByIdService,
  voidPaymentService,
};

import mongoose from "mongoose";
import Contract from "./contract.model.js";
import Contractor from "../contractors/contractor.model.js";
import Task from "../tasks/task.model.js";
import Counter from "../../core/models/counter.model.js";
import contractQueryConfig from "./contract.query.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import ValidationError from "../../core/errors/ValidationError.js";
import { getPaginatedQueryResult } from "../../core/utils/query.js";
import { normalizeDateValue } from "../../core/utils/date.js";

const generateContractNumber = async (session = null) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: "contractNumber" },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true, session }
  );
  return `CONT-${counter.seq + 1000}`;
};

const getContractStatsService = async (contractId, session = null) => {
  const query = session ? { session } : {};

  let completions = [];
  let payments = [];

  if (mongoose.models.ContractCompletion) {
    completions = await mongoose.model("ContractCompletion").find({ contract: contractId, status: "ACTIVE" }, null, query);
  }
  if (mongoose.models.ContractorPayment) {
    payments = await mongoose.model("ContractorPayment").find({ contract: contractId, status: "active" }, null, query);
  }

  const completedQuantity = completions.reduce((sum, c) => sum + c.quantity, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return { completedQuantity, totalPaid };
};

const createContractService = async (data, userId) => {
  const contractor = await Contractor.findById(data.contractor);
  if (!contractor) {
    throw new NotFoundError("Contractor not found.");
  }
  if (contractor.status === "inactive") {
    throw new ValidationError("Inactive contractor cannot receive a new contract.");
  }

  const task = await Task.findById(data.task);
  if (!task) {
    throw new NotFoundError("Task not found.");
  }
  if (!task.isActive) {
    throw new ValidationError("Inactive task cannot be used to create a new contract.");
  }

  const contractNumber = await generateContractNumber();

  const contractData = {
    ...data,
    contractNumber,
    contractorName: contractor.name,
    taskName: task.name,
    unitPrice: data.unitPrice !== undefined ? data.unitPrice : task.defaultUnitPrice,
    contractDate: normalizeDateValue(data.contractDate),
    expectedCompletionDate: normalizeDateValue(data.expectedCompletionDate),
    createdBy: userId,
  };

  const contract = await Contract.create(contractData);
  return contract;
};

const getContractsService = async (filters = {}) => {
  return getPaginatedQueryResult(Contract, filters, contractQueryConfig);
};

const getContractByIdService = async (id) => {
  const contract = await Contract.findById(id).populate(contractQueryConfig.populate);

  if (!contract) {
    throw new NotFoundError("Contract not found.");
  }

  const { completedQuantity, totalPaid } = await getContractStatsService(id);
  
  const completedWorkValue = Math.round(completedQuantity * contract.unitPrice * 100) / 100;
  const payableAmount = Math.round((completedWorkValue - totalPaid) * 100) / 100;
  const remainingQuantity = contract.quantity - completedQuantity;

  const now = normalizeDateValue(new Date());
  const isOverdue = contract.expectedCompletionDate &&
                    now > contract.expectedCompletionDate &&
                    contract.status === "ACTIVE" &&
                    completedQuantity < contract.quantity;

  const contractObj = contract.toObject();
  contractObj.stats = {
    completedQuantity,
    completedWorkValue,
    totalPaid,
    payableAmount,
    remainingQuantity,
    isOverdue,
  };

  return contractObj;
};

const cancelContractService = async (id, reason, userId) => {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      // 1. Lock contract
      const contract = await Contract.findOneAndUpdate(
        { _id: id },
        { $currentDate: { updatedAt: true } },
        { new: true, session }
      );

      if (!contract) {
        throw new NotFoundError("Contract not found.");
      }

      if (contract.status === "CANCELLED") {
        throw new ValidationError("Contract is already cancelled.");
      }

      // 2. Compute stats
      const { completedQuantity, totalPaid } = await getContractStatsService(contract._id, session);
      const completedWorkValue = Math.round(completedQuantity * contract.unitPrice * 100) / 100;

      // 3. Check if settled (allow tolerance for floating point)
      if (Math.abs(completedWorkValue - totalPaid) >= 0.001) {
        throw new ValidationError("Contract cannot be cancelled because outstanding payments remain for completed work, or payments exceed completed work.");
      }

      // 4. Update
      contract.status = "CANCELLED";
      contract.cancellationReason = reason;
      contract.cancelledAt = new Date();
      contract.cancelledBy = userId;

      await contract.save({ session });
      return contract.populate(contractQueryConfig.populate);
    });
  } finally {
    session.endSession();
  }
};

export {
  createContractService,
  getContractsService,
  getContractByIdService,
  cancelContractService,
  getContractStatsService,
};

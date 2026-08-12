import mongoose from "mongoose";
import ContractCompletion from "./contractCompletion.model.js";
import Contract from "../contracts/contract.model.js";
import contractCompletionQueryConfig from "./contractCompletion.query.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import ValidationError from "../../core/errors/ValidationError.js";
import { getPaginatedQueryResult } from "../../core/utils/query.js";
import { normalizeDateValue } from "../../core/utils/date.js";
import { getContractStatsService } from "../contracts/contract.service.js";

const recordCompletionService = async (data, userId) => {
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

      // BR-CC1: Cannot add completion to COMPLETED or CANCELLED
      if (contract.status !== "ACTIVE") {
        throw new ValidationError(`Cannot add completion to a ${contract.status} contract.`);
      }

      // 2. Fetch stats within transaction
      const { completedQuantity } = await getContractStatsService(contract._id, session);

      // BR-CC2: Cannot exceed contracted quantity
      if (completedQuantity + data.quantity > contract.quantity) {
        throw new ValidationError(`This completion would exceed the contracted quantity. Remaining: ${contract.quantity - completedQuantity}`);
      }

      // 3. Create completion
      const completionData = {
        ...data,
        recordedAt: normalizeDateValue(data.recordedAt),
        createdBy: userId,
      };

      const [completion] = await ContractCompletion.create([completionData], { session });

      // 4. BR-CC3: Auto transition to COMPLETED if fully completed
      if (completedQuantity + data.quantity === contract.quantity) {
        contract.status = "COMPLETED";
        await contract.save({ session });
      }

      return completion;
    });
  } finally {
    session.endSession();
  }
};

const getCompletionsService = async (filters = {}) => {
  return getPaginatedQueryResult(ContractCompletion, filters, contractCompletionQueryConfig);
};

const getCompletionByIdService = async (id) => {
  const completion = await ContractCompletion.findById(id).populate(contractCompletionQueryConfig.populate);

  if (!completion) {
    throw new NotFoundError("Contract completion not found.");
  }

  return completion;
};

const voidCompletionService = async (id, reason, userId) => {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      // 1. Find completion
      const completion = await ContractCompletion.findById(id).session(session);
      if (!completion) {
        throw new NotFoundError("Contract completion not found.");
      }

      if (completion.status === "VOIDED") {
        throw new ValidationError("Contract completion is already voided.");
      }

      // 2. Lock contract
      const contract = await Contract.findOneAndUpdate(
        { _id: completion.contract },
        { $currentDate: { updatedAt: true } },
        { new: true, session }
      );

      if (!contract) {
        throw new NotFoundError("Contract not found.");
      }

      // 3. Fetch stats
      const { completedQuantity, totalPaid } = await getContractStatsService(contract._id, session);

      // 4. Enforce BR-CC4: Voiding must not leave valid payments exceeding remaining completed work value
      const newCompletedQuantity = completedQuantity - completion.quantity;
      const newCompletedWorkValue = Math.round(newCompletedQuantity * contract.unitPrice * 100) / 100;

      // Allow tolerance for floating point
      if (totalPaid - newCompletedWorkValue > 0.001) {
        throw new ValidationError("This completion cannot be voided because valid payments exceed the remaining completed work value.");
      }

      // 5. Update completion
      completion.status = "VOIDED";
      completion.voidReason = reason;
      completion.voidedAt = new Date();
      completion.voidedBy = userId;
      await completion.save({ session });

      // 6. Handle revert if contract was COMPLETED but now isn't
      if (contract.status === "COMPLETED" && newCompletedQuantity < contract.quantity) {
        contract.status = "ACTIVE";
        await contract.save({ session });
      }

      return completion.populate(contractCompletionQueryConfig.populate);
    });
  } finally {
    session.endSession();
  }
};

export {
  recordCompletionService,
  getCompletionsService,
  getCompletionByIdService,
  voidCompletionService,
};

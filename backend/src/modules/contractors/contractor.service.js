import Contractor from "./contractor.model.js";
import contractorQueryConfig from "./contractor.query.js";
import ConflictError from "../../core/errors/ConflictError.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import ValidationError from "../../core/errors/ValidationError.js";
import { getPaginatedQueryResult } from "../../core/utils/query.js";
import { normalizePhone } from "../../core/utils/phone.js";
import mongoose from "mongoose";
import ContractorPayment from "../contractorPayments/contractorPayment.model.js";

const createContractorService = async (data) => {
  const normalizedPhone = normalizePhone(data.phone);

  const existing = await Contractor.findOne({ phone: normalizedPhone });
  if (existing) {
    if (existing.deletedAt !== null) {
      // Restore deleted contractor
      existing.name = data.name;
      if (data.notes !== undefined) existing.notes = data.notes;
      existing.status = data.status || "active";
      existing.deletedAt = null;
      existing.deletedBy = null;
      
      await existing.save();
      return existing;
    }

    const msg = "A contractor with this phone number already exists.";
    throw new ConflictError(msg, [{ field: "phone", message: msg }]);
  }

  const contractor = await Contractor.create({ ...data, phone: normalizedPhone });
  return contractor;
};

const getContractorsService = async (filters = {}) => {
  return getPaginatedQueryResult(Contractor, filters, contractorQueryConfig, {
    query: { deletedAt: null }
  });
};

const getContractorByIdService = async (id) => {
  const contractor = await Contractor.findOne({ _id: id, deletedAt: null });

  if (!contractor) {
    throw new NotFoundError("Contractor not found.");
  }

  return contractor;
};

const updateContractorService = async (id, updateData) => {
  const contractor = await Contractor.findOne({ _id: id, deletedAt: null });

  if (!contractor) {
    throw new NotFoundError("Contractor not found.");
  }

  if (updateData.phone) {
    const normalizedPhone = normalizePhone(updateData.phone);
    updateData = { ...updateData, phone: normalizedPhone };
    if (normalizedPhone !== contractor.phone) {
      const existing = await Contractor.findOne({ phone: normalizedPhone });
      if (existing) {
        const msg = "A contractor with this phone number already exists.";
        throw new ConflictError(msg, [{ field: "phone", message: msg }]);
      }
    }
  }

  if (updateData.name !== undefined) contractor.name = updateData.name;
  if (updateData.phone !== undefined) contractor.phone = updateData.phone;
  if (updateData.notes !== undefined) contractor.notes = updateData.notes;
  if (updateData.status !== undefined) contractor.status = updateData.status;

  await contractor.save();
  return contractor;
};

const softDeleteContractorService = async (id, deletedByUserId) => {
  const contractor = await Contractor.findOne({ _id: id, deletedAt: null });

  if (!contractor) {
    throw new NotFoundError("Contractor not found.");
  }

  // Check if Contractor is in use by any ACTIVE Contract
  const Contract = mongoose.model("Contract");
  if (Contract) {
    const activeContracts = await Contract.exists({ contractor: id, status: "ACTIVE" });
    if (activeContracts) {
      throw new ValidationError("Contractor has active contracts. Complete or cancel them before deleting.");
    }
  }

  // Check for outstanding balance
  const { currentBalance } = await getContractorStatsService(id);
  if (currentBalance !== 0) {
    throw new ValidationError("Contractor has an outstanding balance. Settle it before deleting.");
  }

  contractor.status = "inactive";
  contractor.deletedAt = new Date();
  contractor.deletedBy = deletedByUserId ?? null;

  await contractor.save();
  return contractor;
};

const getContractorStatsService = async (contractorId) => {
  const contractor = await Contractor.findOne({ _id: contractorId, deletedAt: null });
  if (!contractor) throw new NotFoundError("Contractor not found.");

  const objectId = new mongoose.Types.ObjectId(contractorId);
  const Contract = mongoose.model("Contract");

  // Get all non-cancelled contracts for this contractor
  const contracts = await Contract.find({
    contractor: objectId,
    status: { $ne: "CANCELLED" },
  }).select("quantity unitPrice status");

  const totalContractValue = contracts.reduce(
    (sum, c) => sum + c.quantity * c.unitPrice,
    0
  );

  const contractIds = contracts.map((c) => c._id);

  // Sum all active payments across those contracts
  const paymentResult = await ContractorPayment.aggregate([
    { $match: { contract: { $in: contractIds }, status: "active" } },
    { $group: { _id: null, totalPaid: { $sum: "$amount" } } },
  ]);

  const totalPaid = paymentResult[0]?.totalPaid ?? 0;
  const currentBalance = totalContractValue - totalPaid;

  return { totalContractValue, totalPaid, currentBalance };
};

export {
  createContractorService,
  getContractorsService,
  getContractorByIdService,
  updateContractorService,
  softDeleteContractorService,
  getContractorStatsService,
};

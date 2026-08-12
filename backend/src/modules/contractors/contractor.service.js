import Contractor from "./contractor.model.js";
import contractorQueryConfig from "./contractor.query.js";
import ConflictError from "../../core/errors/ConflictError.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import ValidationError from "../../core/errors/ValidationError.js";
import { getPaginatedQueryResult } from "../../core/utils/query.js";
import mongoose from "mongoose";

const createContractorService = async (data) => {
  if (data.phone) {
    const existing = await Contractor.findOne({ phone: data.phone });
    if (existing) {
      throw new ConflictError("A contractor with this phone number already exists.");
    }
  }

  const contractor = await Contractor.create(data);
  return contractor;
};

const getContractorsService = async (filters = {}) => {
  return getPaginatedQueryResult(Contractor, filters, contractorQueryConfig);
};

const getContractorByIdService = async (id) => {
  const contractor = await Contractor.findById(id);

  if (!contractor) {
    throw new NotFoundError("Contractor not found.");
  }

  return contractor;
};

const updateContractorService = async (id, updateData) => {
  const contractor = await Contractor.findById(id);

  if (!contractor) {
    throw new NotFoundError("Contractor not found.");
  }

  if (updateData.phone && updateData.phone !== contractor.phone) {
    const existing = await Contractor.findOne({ phone: updateData.phone });
    if (existing) {
      throw new ConflictError("A contractor with this phone number already exists.");
    }
  }

  if (updateData.name !== undefined) contractor.name = updateData.name;
  if (updateData.phone !== undefined) contractor.phone = updateData.phone;
  if (updateData.notes !== undefined) contractor.notes = updateData.notes;
  if (updateData.status !== undefined) contractor.status = updateData.status;

  await contractor.save();
  return contractor;
};

const deleteContractorService = async (id) => {
  const contractor = await Contractor.findById(id);

  if (!contractor) {
    throw new NotFoundError("Contractor not found.");
  }

  // Check if Contractor is in use by any Contract
  const Contract = mongoose.model("Contract");
  if (Contract) {
    const inUse = await Contract.exists({ contractor: id });
    if (inUse) {
      throw new ValidationError("Contractor has contract history and cannot be deleted. Deactivate instead.");
    }
  }

  await Contractor.deleteOne({ _id: id });
  return contractor;
};

export {
  createContractorService,
  getContractorsService,
  getContractorByIdService,
  updateContractorService,
  deleteContractorService,
};

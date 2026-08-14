import { createCrudApi } from "../../../api/crud";

const contractorsApi = createCrudApi("/contractors");

export const getContractors = contractorsApi.getAll;
export const getContractorById = contractorsApi.getById;
export const createContractor = contractorsApi.create;
export const updateContractor = contractorsApi.update;
export const deleteContractor = contractorsApi.delete;


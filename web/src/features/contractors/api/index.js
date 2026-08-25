import { createCrudApi } from "../../../api/crud";
import api from "../../../api/axios";

const contractorsApi = createCrudApi("/contractors");

export const getContractors = contractorsApi.getAll;
export const getContractorById = contractorsApi.getById;
export const createContractor = contractorsApi.create;
export const updateContractor = contractorsApi.update;
export const deleteContractor = contractorsApi.delete;

export const getContractorStats = async (id) => {
  const response = await api.get(`/contractors/${id}/stats`);
  return response.data;
};

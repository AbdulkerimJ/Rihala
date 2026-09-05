import api from "../../../api/axios";

export const getContracts = async (params = {}) => {
  const response = await api.get("/contracts", { params });
  return response.data;
};

export const getContractById = async (id) => {
  const response = await api.get(`/contracts/${id}`);
  return response.data;
};

export const createContract = async (data) => {
  const response = await api.post("/contracts", data);
  return response.data;
};

export const cancelContract = async ({ id, cancelReason }) => {
  const response = await api.patch(`/contracts/${id}/cancel`, { cancellationReason: cancelReason });
  return response.data;
};

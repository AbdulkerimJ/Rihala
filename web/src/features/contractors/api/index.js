import api from "../../../api/axios";

export const getContractors = async (params = {}) => {
  const response = await api.get("/contractors", { params });
  return response.data;
};

export const getContractorById = async (id) => {
  const response = await api.get(`/contractors/${id}`);
  return response.data;
};

export const createContractor = async (data) => {
  const response = await api.post("/contractors", data);
  return response.data;
};

export const updateContractor = async ({ id, data }) => {
  const response = await api.patch(`/contractors/${id}`, data);
  return response.data;
};

export const deleteContractor = async (id) => {
  const response = await api.delete(`/contractors/${id}`);
  return response.data;
};

import api from "../../../api/axios";

export const getCompletions = async (params = {}) => {
  const response = await api.get("/contract-completions", { params });
  return response.data;
};

export const getCompletionById = async (id) => {
  const response = await api.get(`/contract-completions/${id}`);
  return response.data;
};

export const recordCompletion = async (data) => {
  const response = await api.post("/contract-completions", data);
  return response.data;
};

export const voidCompletion = async ({ id, voidReason }) => {
  const response = await api.patch(`/contract-completions/${id}/void`, { voidReason });
  return response.data;
};

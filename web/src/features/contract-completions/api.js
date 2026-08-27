import api from "../../api/axios";

export const recordCompletion = async (data) => {
  return api.post("/contract-completions", data);
};

export const voidCompletion = async ({ id, voidReason }) => {
  return api.post(`/contract-completions/${id}/void`, { voidReason });
};

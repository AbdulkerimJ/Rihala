import api from "../../../api/axios";

export const getContractorPayments = async (params = {}) => {
  const response = await api.get("/contractor-payments", { params });
  return response.data;
};

export const getContractorPaymentById = async (id) => {
  const response = await api.get(`/contractor-payments/${id}`);
  return response.data;
};

export const createContractorPayment = async (data) => {
  const response = await api.post("/contractor-payments", data);
  return response.data;
};

export const voidContractorPayment = async ({ id, voidReason }) => {
  const response = await api.patch(`/contractor-payments/${id}/void`, { voidReason });
  return response.data;
};

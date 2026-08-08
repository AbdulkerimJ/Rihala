import api from "../../../api/axios";

export const getCustomerPayments = async (params = {}) => {
  const response = await api.get("/customer-payments", { params });
  return response.data;
};

export const getCustomerPaymentById = async (id) => {
  const response = await api.get(`/customer-payments/${id}`);
  return response.data;
};

export const createCustomerPayment = async (data) => {
  const response = await api.post("/customer-payments", data);
  return response.data;
};

export const voidCustomerPayment = async ({ id, voidReason }) => {
  const response = await api.post(`/customer-payments/${id}/void`, { voidReason });
  return response.data;
};

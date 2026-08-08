import api from "../../../api/axios";

export const getSupplierPayments = async (params = {}) => {
  const response = await api.get("/supplier-payments", { params });
  return response.data;
};

export const getSupplierPaymentById = async (id) => {
  const response = await api.get(`/supplier-payments/${id}`);
  return response.data;
};

export const createSupplierPayment = async (data) => {
  const response = await api.post("/supplier-payments", data);
  return response.data;
};

export const voidSupplierPayment = async ({ id, voidReason }) => {
  const response = await api.post(`/supplier-payments/${id}/void`, { voidReason });
  return response.data;
};

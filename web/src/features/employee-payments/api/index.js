import api from "../../../api/axios";

export const getEmployeePayments = async (params = {}) => {
  const response = await api.get("/employee-payments", { params });
  return response.data;
};

export const getEmployeePaymentById = async (id) => {
  const response = await api.get(`/employee-payments/${id}`);
  return response.data;
};

export const createEmployeePayment = async (data) => {
  const response = await api.post("/employee-payments", data);
  return response.data;
};

export const voidEmployeePayment = async ({ id, voidReason }) => {
  const response = await api.post(`/employee-payments/${id}/void`, { voidReason });
  return response.data;
};

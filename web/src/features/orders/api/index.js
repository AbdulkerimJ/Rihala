import api from "../../../api/axios";

export const getOrders = async (params = {}) => {
  const response = await api.get("/orders", { params });
  return response.data;
};

export const getOrderById = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

export const createOrder = async (data) => {
  const response = await api.post("/orders", data);
  return response.data;
};

export const updateOrder = async ({ id, data }) => {
  const response = await api.patch(`/orders/${id}`, data);
  return response.data;
};

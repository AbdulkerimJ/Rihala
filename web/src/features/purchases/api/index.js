import api from "../../../api/axios";

export const getPurchases = async (params = {}) => {
  const response = await api.get("/purchases", { params });
  return response.data;
};

export const getPurchaseById = async (id) => {
  const response = await api.get(`/purchases/${id}`);
  return response.data;
};

export const createPurchase = async (data) => {
  const response = await api.post("/purchases", data);
  return response.data;
};

export const updatePurchase = async ({ id, data }) => {
  const response = await api.patch(`/purchases/${id}`, data);
  return response.data;
};

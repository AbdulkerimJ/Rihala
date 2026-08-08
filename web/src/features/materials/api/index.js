import api from "../../../api/axios";

export const getMaterials = async (params = {}) => {
  const response = await api.get("/materials", { params });
  return response.data;
};

export const getMaterialById = async (id) => {
  const response = await api.get(`/materials/${id}`);
  return response.data;
};

export const createMaterial = async (data) => {
  const response = await api.post("/materials", data);
  return response.data;
};

export const updateMaterial = async ({ id, data }) => {
  const response = await api.patch(`/materials/${id}`, data);
  return response.data;
};

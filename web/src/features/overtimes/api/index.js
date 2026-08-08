import api from "../../../api/axios";

export const getOvertimes = async (params = {}) => {
  const response = await api.get("/overtimes", { params });
  return response.data;
};

export const getOvertimeById = async (id) => {
  const response = await api.get(`/overtimes/${id}`);
  return response.data;
};

export const createOvertime = async (data) => {
  const response = await api.post("/overtimes", data);
  return response.data;
};

export const updateOvertime = async ({ id, data }) => {
  const response = await api.patch(`/overtimes/${id}`, data);
  return response.data;
};

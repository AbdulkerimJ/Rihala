import api from "../../../api/axios";

export const getAttendances = async (params = {}) => {
  const response = await api.get("/attendances", { params });
  return response.data;
};

export const getAttendanceById = async (id) => {
  const response = await api.get(`/attendances/${id}`);
  return response.data;
};

export const createAttendance = async (data) => {
  const response = await api.post("/attendances", data);
  return response.data;
};

export const updateAttendance = async ({ id, data }) => {
  const response = await api.patch(`/attendances/${id}`, data);
  return response.data;
};

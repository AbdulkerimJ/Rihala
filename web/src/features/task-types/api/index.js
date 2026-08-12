import api from "../../../api/axios";

export const getTaskTypes = async (params = {}) => {
  const response = await api.get("/task-types", { params });
  return response.data;
};

export const createTaskType = async (data) => {
  const response = await api.post("/task-types", data);
  return response.data;
};

export const updateTaskType = async ({ id, data }) => {
  const response = await api.patch(`/task-types/${id}`, data);
  return response.data;
};

export const deleteTaskType = async (id) => {
  const response = await api.delete(`/task-types/${id}`);
  return response.data;
};

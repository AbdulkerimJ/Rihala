import api from "../../../api/axios";

export const getEmployees = async (params = {}) => {
  const response = await api.get("/employees", { params });
  return response.data;
};

export const getEmployeeById = async (id) => {
  const response = await api.get(`/employees/${id}`);
  return response.data;
};

export const createEmployee = async (data) => {
  const response = await api.post("/employees", data);
  return response.data;
};

export const updateEmployee = async ({ id, data }) => {
  const response = await api.patch(`/employees/${id}`, data);
  return response.data;
};

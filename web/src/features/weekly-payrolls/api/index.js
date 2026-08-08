import api from "../../../api/axios";

export const getWeeklyPayrolls = async (params = {}) => {
  const response = await api.get("/weekly-payrolls", { params });
  return response.data;
};

export const getWeeklyPayrollById = async (id) => {
  const response = await api.get(`/weekly-payrolls/${id}`);
  return response.data;
};

export const getCurrentPayrollCalculation = async (employeeId) => {
  const response = await api.get(`/weekly-payrolls/employees/${employeeId}/current`);
  return response.data;
};

export const closeWeeklyPayroll = async (employeeId) => {
  const response = await api.post(`/weekly-payrolls/employees/${employeeId}/close`);
  return response.data;
};

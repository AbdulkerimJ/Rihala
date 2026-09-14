import api from "../../../api/axios";

export const getDashboardStats = async () => {
  const response = await api.get("/analytics/dashboard");
  return response.data.data;
};

export const getAnalyticsReports = async (startDate, endDate) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  
  const response = await api.get("/analytics/reports", { params });
  return response.data.data;
};

export const getCashFlowTrend = async (startDate, endDate) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const response = await api.get("/analytics/cash-flow-trend", { params });
  return response.data.data;
};

export const getOrdersTrend = async (startDate, endDate) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const response = await api.get("/analytics/orders-trend", { params });
  return response.data.data;
};

export const getExpensesByCategory = async (startDate, endDate) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const response = await api.get("/analytics/expenses-by-category", { params });
  return response.data.data;
};

export const getPurchasesByCategory = async (startDate, endDate) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const response = await api.get("/analytics/purchases-by-category", { params });
  return response.data.data;
};

export const getEmployeePaymentsByType = async (startDate, endDate) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const response = await api.get("/analytics/employee-payments-by-type", { params });
  return response.data.data;
};

export const getContractorCostTrend = async (startDate, endDate) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const response = await api.get("/analytics/contractor-cost-trend", { params });
  return response.data?.data || [];
};

export const getEmployeeCostTrend = async (startDate, endDate) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const response = await api.get("/analytics/employee-cost-trend", { params });
  return response.data.data;
};

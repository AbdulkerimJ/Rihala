import { createCrudApi } from "../../../api/crud";
import api from "../../../api/axios";

const expensesApi = createCrudApi("/expenses");

export const getExpenses = expensesApi.getAll;
export const getExpenseById = expensesApi.getById;
export const createExpense = expensesApi.create;
export const updateExpense = expensesApi.update;

export const voidExpense = async ({ id, voidReason }) => {
  const response = await api.patch(`/expenses/${id}/void`, { voidReason });
  return response.data;
};

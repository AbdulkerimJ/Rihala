import { createCrudApi } from "../../../api/crud";

const expensesApi = createCrudApi("/expenses");

export const getExpenses = expensesApi.getAll;
export const getExpenseById = expensesApi.getById;
export const createExpense = expensesApi.create;
export const updateExpense = expensesApi.update;
export const deleteExpense = expensesApi.delete;


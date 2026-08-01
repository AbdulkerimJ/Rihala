import Expense from "./expense.model.js";
import expenseQueryConfig from "./expense.query.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import { getPaginatedQueryResult } from "../../core/utils/query.js";

const createExpenseService = async (data, userId) => {
  const expense = await Expense.create({
    ...data,
    createdBy: userId,
  });

  return expense.populate("createdBy", "name email");
};

const getExpensesService = async (filters = {}) => {
  return getPaginatedQueryResult(Expense, filters, expenseQueryConfig, {
    populate: "createdBy",
  });
};

const getExpenseByIdService = async (expenseId) => {
  const expense = await Expense.findById(expenseId).populate(
    "createdBy",
    "name email",
  );

  if (!expense) {
    throw new NotFoundError("Expense not found.");
  }

  return expense;
};

const updateExpenseService = async (expenseId, updateData) => {
  const expense = await Expense.findById(expenseId);

  if (!expense) {
    throw new NotFoundError("Expense not found.");
  }

  Object.keys(updateData).forEach((key) => {
    expense[key] = updateData[key];
  });

  await expense.save();

  return expense.populate("createdBy", "name email");
};

const deleteExpenseService = async (expenseId) => {
  const expense = await Expense.findById(expenseId);

  if (!expense) {
    throw new NotFoundError("Expense not found.");
  }

  await Expense.deleteOne({ _id: expenseId });

  return expense;
};

export {
  createExpenseService,
  getExpensesService,
  getExpenseByIdService,
  updateExpenseService,
  deleteExpenseService,
};

import Expense from "./expense.model.js";
import expenseQueryConfig from "./expense.query.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import { getPaginatedQueryResult } from "../../core/utils/query.js";

import ValidationError from "../../core/errors/ValidationError.js";

const createExpenseService = async (data, userId) => {
  const expense = await Expense.create({
    ...data,
    status: "active",
    voidReason: undefined,
    voidedAt: undefined,
    voidedBy: undefined,
    createdBy: userId,
  });

  return expense.populate("createdBy", "name email");
};

const getExpensesService = async (filters = {}) => {
  if (!filters.status) {
    filters.status = "active";
  }

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

  if (expense.status === "voided") {
    throw new ValidationError("Cannot update a voided expense.");
  }

  Object.keys(updateData).forEach((key) => {
    expense[key] = updateData[key];
  });

  await expense.save();

  return expense.populate("createdBy", "name email");
};

const voidExpenseService = async (expenseId, voidReason, userId) => {
  const expense = await Expense.findById(expenseId);

  if (!expense) {
    throw new NotFoundError("Expense not found.");
  }

  if (expense.status === "voided") {
    throw new ValidationError("Expense is already voided.");
  }

  expense.status = "voided";
  expense.voidReason = voidReason;
  expense.voidedAt = new Date();
  expense.voidedBy = userId;

  await expense.save();

  return expense.populate("createdBy", "name email");
};

export {
  createExpenseService,
  getExpensesService,
  getExpenseByIdService,
  updateExpenseService,
  voidExpenseService,
};

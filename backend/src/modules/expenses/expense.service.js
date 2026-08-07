import Expense from "./expense.model.js";
import User from "../users/user.model.js";
import expenseQueryConfig from "./expense.query.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import { getPaginatedQueryResult } from "../../core/utils/query.js";

import ValidationError from "../../core/errors/ValidationError.js";

const createExpenseService = async (data, userId) => {
  const creator = await User.findById(userId).select("name");

  if (!creator) {
    throw new ValidationError("Expense creator not found. Cannot record expense without a valid user.");
  }

  const expense = await Expense.create({
    ...data,
    status: "active",
    voidReason: undefined,
    voidedAt: undefined,
    voidedBy: undefined,
    createdBy: userId,
    createdByName: creator.name,
  });

  return expense.populate("createdBy", "name email");
};

const getExpensesService = async (filters = {}) => {
  if (!filters.status) {
    filters.status = "active";
  }

  return getPaginatedQueryResult(Expense, filters, expenseQueryConfig, {
    populate: { path: "createdBy", select: "name email" },
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

  const ALLOWED_UPDATE_FIELDS = ["category", "description"];
  Object.keys(updateData).forEach((key) => {
    if (ALLOWED_UPDATE_FIELDS.includes(key)) {
      expense[key] = updateData[key];
    }
  });

  await expense.save();

  return expense.populate("createdBy", "name email");
};

const voidExpenseService = async (expenseId, voidReason, userId) => {
  const voider = await User.findById(userId).select("name");

  // Atomic conditional update — only succeeds if status is currently "active"
  const expense = await Expense.findOneAndUpdate(
    { _id: expenseId, status: "active" },
    {
      status: "voided",
      voidReason,
      voidedAt: new Date(),
      voidedBy: userId,
      voidedByName: voider?.name ?? null,
    },
    { new: true },
  );

  if (!expense) {
    // Could be not-found or already-voided — distinguish with a second read
    const existing = await Expense.findById(expenseId);
    if (!existing) throw new NotFoundError("Expense not found.");
    throw new ValidationError("Expense is already voided.");
  }

  return expense.populate("createdBy", "name email");
};

export {
  createExpenseService,
  getExpensesService,
  getExpenseByIdService,
  updateExpenseService,
  voidExpenseService,
};

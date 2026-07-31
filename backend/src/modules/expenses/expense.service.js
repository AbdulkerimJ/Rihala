import Expense from "./expense.model.js";
import NotFoundError from "../../core/errors/NotFoundError.js";

const createExpenseService = async (data, userId) => {
  const expense = await Expense.create({
    ...data,
    createdBy: userId,
  });

  return expense.populate("createdBy", "name email");
};

const getExpensesService = async (filters = {}, pagination = {}) => {
  const {
    page: pageFromQuery,
    limit: limitFromQuery,
    ...queryFilters
  } = filters;
  const { category, from, to } = queryFilters;
  const page = Number(pagination.page ?? pageFromQuery ?? 1);
  const limit = Number(pagination.limit ?? limitFromQuery ?? 10);

  const query = {};

  if (category) {
    query.category = category;
  }

  if (from || to) {
    query.date = {};

    if (from) {
      query.date.$gte = new Date(from);
    }

    if (to) {
      query.date.$lte = new Date(to);
    }
  }

  const safePage = Math.max(1, Number(page));
  const safeLimit = Math.max(1, Math.min(100, Number(limit)));

  const total = await Expense.countDocuments(query);
  const expenses = await Expense.find(query)
    .sort({ date: -1, createdAt: -1 })
    .skip((safePage - 1) * safeLimit)
    .limit(safeLimit)
    .populate("createdBy", "name email");

  return {
    data: expenses,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
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

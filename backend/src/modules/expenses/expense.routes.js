import express from "express";

import authenticate from "../../core/middleware/authenticate.js";
import authorize from "../../core/middleware/authorize.js";
import validate from "../../core/middleware/validate.js";
import {
  getAllExpensesController,
  createExpenseController,
  getExpenseByIdController,
  updateExpenseController,
  deleteExpenseController,
} from "./expense.controller.js";
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseIdSchema,
  expenseQuerySchema,
} from "./expense.validation.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("expenses.read"),
  validate(expenseQuerySchema, "Please check the expense filters.", "query"),
  getAllExpensesController,
);

router.post(
  "/",
  authorize("expenses.create"),
  validate(createExpenseSchema, "Please check the expense information."),
  createExpenseController,
);

router.get(
  "/:id",
  authorize("expenses.read"),
  validate(expenseIdSchema, "Please check the expense id.", "params"),
  getExpenseByIdController,
);

router.patch(
  "/:id",
  authorize("expenses.update"),
  validate(expenseIdSchema, "Please check the expense id.", "params"),
  validate(updateExpenseSchema, "Please check the expense information."),
  updateExpenseController,
);

router.delete(
  "/:id",
  authorize("expenses.delete"),
  validate(expenseIdSchema, "Please check the expense id.", "params"),
  deleteExpenseController,
);

export default router;

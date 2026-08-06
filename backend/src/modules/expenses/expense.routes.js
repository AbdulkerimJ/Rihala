import express from "express";

import authenticate from "../../core/middleware/authenticate.js";
import authorize from "../../core/middleware/authorize.js";
import validate from "../../core/middleware/validate.js";
import {
  getAllExpensesController,
  createExpenseController,
  getExpenseByIdController,
  updateExpenseController,
  voidExpenseController,
} from "./expense.controller.js";
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseIdSchema,
  voidExpenseSchema,
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

router.patch(
  "/:id/void",
  authorize("expenses.void"),
  validate(expenseIdSchema, "Please check the expense id.", "params"),
  validate(voidExpenseSchema, "Please check the void reason."),
  voidExpenseController,
);

export default router;

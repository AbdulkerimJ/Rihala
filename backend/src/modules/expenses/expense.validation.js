import { z } from "zod";
import { EXPENSE_CATEGORIES } from "./constants/expenseCategories.js";

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;

const createExpenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES, {
    error: "Please select a valid expense category.",
  }),
  amount: z
    .number({ error: "Expense amount is required." })
    .positive("Expense amount must be positive."),
  description: z.string().trim().optional(),
  date: z.coerce.date({
    error: "Expense date must be a valid date.",
  }),
}).strict({
  error: "Invalid fields in creation payload.",
});

const updateExpenseSchema = z
  .object({
    category: z
      .enum(EXPENSE_CATEGORIES, {
        error: "Please select a valid expense category.",
      })
      .optional(),
    description: z.string().trim().optional(),
  })
  .strict({
    error: "Only category and description can be updated.",
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update.",
  });

const expenseIdSchema = z.object({
  id: z.string().regex(mongoIdRegex, "Invalid expense id."),
});

const voidExpenseSchema = z.object({
  voidReason: z.string().trim().min(1, "Void reason is required."),
}).strict({
  error: "Only voidReason is allowed.",
});

const expenseQuerySchema = z
  .object({
    category: z
      .enum(EXPENSE_CATEGORIES, {
        error: "Please select a valid expense category.",
      })
      .optional(),
    from: z.coerce
      .date({ error: "The from date must be a valid date." })
      .optional(),
    to: z.coerce
      .date({ error: "The to date must be a valid date." })
      .optional(),
    search: z.string().trim().optional(),
    sort: z.string().trim().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    status: z.enum(["active", "voided"]).optional(),
    minAmount: z.coerce.number().positive().optional(),
    maxAmount: z.coerce.number().positive().optional(),
  })
  .strict({
    error:
      "Invalid query parameters.",
  });

export {
  createExpenseSchema,
  updateExpenseSchema,
  expenseIdSchema,
  voidExpenseSchema,
  expenseQuerySchema,
};

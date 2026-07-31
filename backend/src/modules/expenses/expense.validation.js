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
});

const updateExpenseSchema = z
  .object({
    category: z
      .enum(EXPENSE_CATEGORIES, {
        error: "Please select a valid expense category.",
      })
      .optional(),
    amount: z.number().positive("Expense amount must be positive.").optional(),
    description: z.string().trim().optional(),
    date: z.coerce
      .date({
        error: "Expense date must be a valid date.",
      })
      .optional(),
  })
  .strict({
    error: "Only category, amount, description, and date can be updated.",
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update.",
  });

const expenseIdSchema = z.object({
  id: z.string().regex(mongoIdRegex, "Invalid expense id."),
});

const expenseQuerySchema = z.object({
  category: z
    .enum(EXPENSE_CATEGORIES, {
      error: "Please select a valid expense category.",
    })
    .optional(),
  from: z.coerce
    .date({ error: "The from date must be a valid date." })
    .optional(),
  to: z.coerce.date({ error: "The to date must be a valid date." }).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export {
  createExpenseSchema,
  updateExpenseSchema,
  expenseIdSchema,
  expenseQuerySchema,
};

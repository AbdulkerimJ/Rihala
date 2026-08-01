import { z } from "zod";

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;

const orderStatusSchema = z.enum(
  ["pending", "in_progress", "ready", "completed", "cancelled"],
  {
    error: "Invalid order status.",
  },
);

const createOrderSchema = z
  .object({
    customer: z.string().regex(mongoIdRegex, "Invalid customer id."),
    description: z.string().trim().min(1, "Order description is required."),
    agreedAmount: z
      .number()
      .min(0, "Agreed amount must be greater than or equal to 0."),
    expectedCompletionDate: z.coerce.date({
      error: "Expected completion date must be a valid date.",
    }),
    notes: z.string().trim().optional(),
  })
  .strict({
    error:
      "Only customer, description, agreedAmount, expectedCompletionDate, and notes can be submitted.",
  });

const updateOrderSchema = z
  .object({
    customer: z.string().regex(mongoIdRegex, "Invalid customer id.").optional(),
    description: z
      .string()
      .trim()
      .min(1, "Order description is required.")
      .optional(),
    agreedAmount: z
      .number()
      .min(0, "Agreed amount must be greater than or equal to 0.")
      .optional(),
    expectedCompletionDate: z.coerce
      .date({ error: "Expected completion date must be a valid date." })
      .optional(),
    status: orderStatusSchema.optional(),
    notes: z.string().trim().optional(),
  })
  .strict({
    error:
      "Only customer, description, agreedAmount, expectedCompletionDate, status, and notes can be updated.",
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update.",
  });

const orderIdSchema = z.object({
  id: z.string().regex(mongoIdRegex, "Invalid order id."),
});

const orderQuerySchema = z
  .object({
    status: orderStatusSchema.optional(),
    customer: z.string().regex(mongoIdRegex, "Invalid customer id.").optional(),
    createdBy: z.string().regex(mongoIdRegex, "Invalid user id.").optional(),
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
  })
  .strict({
    error:
      "Only status, customer, createdBy, from, to, search, sort, page, and limit are allowed.",
  });

export {
  createOrderSchema,
  updateOrderSchema,
  orderIdSchema,
  orderQuerySchema,
};

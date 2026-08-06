import { z } from "zod";

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;

const orderStatusSchema = z.enum(
  ["pending", "in_progress", "ready", "completed", "cancelled"],
  {
    error: "Invalid order status.",
  },
);

const orderItemSchema = z.object({
  description: z.string().trim().min(1, "Item description is required."),
  quantity: z.number().positive("Quantity must be greater than 0."),
  unit: z.string().trim().min(1, "Item unit is required."),
  specifications: z.string().trim().optional().nullable(),
});

const createOrderSchema = z
  .object({
    customer: z.string().regex(mongoIdRegex, "Invalid customer id."),
    date: z.string().datetime({ message: "Invalid ISO datetime string" }).optional(),
    items: z.array(orderItemSchema).min(1, "At least one item is required."),
    agreedAmount: z
      .number()
      .min(0, "Agreed amount must be greater than or equal to 0."),
    expectedCompletionDate: z.string().datetime({ message: "Invalid ISO datetime string" }),
    notes: z.string().trim().optional().nullable(),
  })
  .strict({
    error:
      "Only customer, date, items, agreedAmount, expectedCompletionDate, and notes can be submitted.",
  });

const updateOrderSchema = z
  .object({
    customer: z.string().regex(mongoIdRegex, "Invalid customer id.").optional(),
    date: z.string().datetime({ message: "Invalid ISO datetime string" }).optional(),
    items: z.array(orderItemSchema).min(1, "At least one item is required.").optional(),
    agreedAmount: z
      .number()
      .min(0, "Agreed amount must be greater than or equal to 0.")
      .optional(),
    expectedCompletionDate: z.string().datetime({ message: "Invalid ISO datetime string" }).optional(),
    status: orderStatusSchema.optional(),
    notes: z.string().trim().optional().nullable(),
  })
  .strict({
    error:
      "Only customer, date, items, agreedAmount, expectedCompletionDate, status, and notes can be updated.",
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update.",
  });

const orderIdSchema = z.object({
  id: z.string().regex(mongoIdRegex, "Invalid order id."),
});

const orderQuerySchema = z
  .object({
    orderNumber: z.string().trim().optional(),
    status: orderStatusSchema.optional(),
    customer: z.string().regex(mongoIdRegex, "Invalid customer id.").optional(),
    createdBy: z.string().regex(mongoIdRegex, "Invalid user id.").optional(),
    from: z.string().datetime({ message: "Invalid ISO datetime string" }).optional(),
    to: z.string().datetime({ message: "Invalid ISO datetime string" }).optional(),
    search: z.string().trim().optional(),
    sort: z.string().trim().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  })
  .strict({
    error:
      "Only orderNumber, status, customer, createdBy, from, to, search, sort, page, and limit are allowed.",
  });

export {
  createOrderSchema,
  updateOrderSchema,
  orderIdSchema,
  orderQuerySchema,
};

import { z } from "zod";

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;

const createPaymentSchema = z
  .object({
    employee: z.string().regex(mongoIdRegex, "Invalid employee id."),
    amount: z
      .number({ error: "Payment amount is required." })
      .positive("Payment amount must be positive."),
    paymentDate: z.coerce.date({
      error: "Payment date must be a valid date.",
    }),
    note: z.string().trim().optional(),
  })
  .strict({
    error: "Only employee, amount, paymentDate, and note can be submitted.",
  });

const updatePaymentSchema = z
  .object({
    employee: z.string().regex(mongoIdRegex, "Invalid employee id.").optional(),
    amount: z
      .number()
      .positive("Payment amount must be positive.")
      .optional(),
    paymentDate: z.coerce
      .date({
        error: "Payment date must be a valid date.",
      })
      .optional(),
    note: z.string().trim().optional(),
  })
  .strict({
    error: "Only employee, amount, paymentDate, and note can be updated.",
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update.",
  });

const paymentIdSchema = z.object({
  id: z.string().regex(mongoIdRegex, "Invalid payment id."),
});

const paymentQuerySchema = z
  .object({
    employee: z.string().regex(mongoIdRegex, "Invalid employee id.").optional(),
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
      "Only employee, from, to, search, sort, page, and limit are allowed.",
  });

export {
  createPaymentSchema,
  updatePaymentSchema,
  paymentIdSchema,
  paymentQuerySchema,
};

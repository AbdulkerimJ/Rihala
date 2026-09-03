import { z } from "zod";

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;

const createCustomerPaymentSchema = z.object({
  order: z.string().regex(mongoIdRegex, "Invalid order id."),
  amount: z
    .number({ error: "Payment amount is required." })
    .positive("Payment amount must be positive."),
  paymentDate: z.coerce.date({
    error: "Payment date must be a valid date.",
  }),
  note: z.string().trim().optional(),
}).strict({
  error: "Invalid fields in creation payload.",
});

const updateCustomerPaymentSchema = z
  .object({
    note: z.string().trim().optional(),
  })
  .strict({
    error: "Only note can be updated.",
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update.",
  });

const customerPaymentIdSchema = z.object({
  id: z.string().regex(mongoIdRegex, "Invalid payment id."),
});

const voidCustomerPaymentSchema = z.object({
  voidReason: z.string().trim().min(1, "Void reason is required."),
}).strict({
  error: "Only voidReason is allowed.",
});

const customerPaymentQuerySchema = z
  .object({
    order: z.string().regex(mongoIdRegex, "Invalid order id.").optional(),
    customer: z.string().regex(mongoIdRegex, "Invalid customer id.").optional(),
    status: z.enum(["active", "voided"]).optional(),
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
    minAmount: z.coerce.number().positive().optional(),
    maxAmount: z.coerce.number().positive().optional(),
  })
  .strict({
    error: "Invalid query parameters.",
  });

export {
  createCustomerPaymentSchema,
  updateCustomerPaymentSchema,
  customerPaymentIdSchema,
  voidCustomerPaymentSchema,
  customerPaymentQuerySchema,
};

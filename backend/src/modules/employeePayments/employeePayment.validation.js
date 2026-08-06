import { z } from "zod";

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;

const createEmployeePaymentSchema = z
  .object({
    employee: z.string().regex(mongoIdRegex, "Invalid employee id."),
    amount: z
      .number({ error: "Payment amount is required." })
      .positive("Payment amount must be positive."),
    paymentDate: z.coerce.date({
      error: "Payment date must be a valid date.",
    }),
    type: z.enum(["regular", "overtime", "bonus", "advance", "other"], {
      errorMap: () => ({ message: "Payment type must be regular, overtime, bonus, advance, or other." }),
    }),
    note: z.string().trim().optional(),
  })
  .strict({
    error: "Only employee, amount, paymentDate, type, and note can be submitted.",
  });

const updateEmployeePaymentSchema = z
  .object({
    amount: z
      .number()
      .positive("Payment amount must be positive.")
      .optional(),
    paymentDate: z.coerce
      .date({
        error: "Payment date must be a valid date.",
      })
      .optional(),
    type: z.enum(["regular", "overtime", "bonus", "advance", "other"], {
      errorMap: () => ({ message: "Payment type must be regular, overtime, bonus, advance, or other." }),
    }).optional(),
    note: z.string().trim().optional(),
  })
  .strict({
    error: "Only amount, paymentDate, type, and note can be updated.",
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update.",
  });

const employeePaymentIdSchema = z.object({
  id: z.string().regex(mongoIdRegex, "Invalid payment id."),
});

const employeePaymentQuerySchema = z
  .object({
    employee: z.string().regex(mongoIdRegex, "Invalid employee id.").optional(),
    from: z.coerce
      .date({ error: "The from date must be a valid date." })
      .optional(),
    to: z.coerce
      .date({ error: "The to date must be a valid date." })
      .optional(),
    search: z.string().trim().optional(),
    type: z.enum(["regular", "overtime", "bonus", "advance", "other"]).optional(),
    sort: z.string().trim().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  })
  .strict({
    error:
      "Only employee, from, to, search, type, sort, page, and limit are allowed.",
  });

export {
  createEmployeePaymentSchema,
  updateEmployeePaymentSchema,
  employeePaymentIdSchema,
  employeePaymentQuerySchema,
};

import { z } from "zod";

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;

const employeeIdSchema = z.object({
  employeeId: z.string().regex(mongoIdRegex, "Invalid employee id."),
});

const weeklyPayrollIdSchema = z.object({
  id: z.string().regex(mongoIdRegex, "Invalid weekly payroll id."),
});

const weeklyPayrollQuerySchema = z
  .object({
    employee: z.string().regex(mongoIdRegex, "Invalid employee id.").optional(),

    from: z.coerce
      .date({ message: "The from date must be a valid date." })
      .optional(),
    to: z.coerce
      .date({ message: "The to date must be a valid date." })
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

const closePayrollBodySchema = z.object({
  initialPayment: z.object({
    amount: z.number().positive("Payment amount must be positive"),
    paymentDate: z.string().datetime({ message: "Invalid ISO datetime string" }),
    note: z.string().max(1000).optional().nullable(),
  }).optional(),
}).strict({ error: "Only initialPayment is allowed." });

export { employeeIdSchema, weeklyPayrollIdSchema, weeklyPayrollQuerySchema, closePayrollBodySchema };

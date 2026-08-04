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
    status: z.enum(["CLOSED"]).optional(),
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
      "Only employee, status, from, to, search, sort, page, and limit are allowed.",
  });

export { employeeIdSchema, weeklyPayrollIdSchema, weeklyPayrollQuerySchema };

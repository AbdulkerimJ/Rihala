import { z } from "zod";

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;

const createEmployeeRateSchema = z
  .object({
    employee: z.string().regex(mongoIdRegex, "Invalid employee id."),
    dailyRate: z
      .number({ error: "Daily rate is required." })
      .positive("Daily rate must be greater than 0."),
    effectiveDate: z.coerce.date({
      error: "Effective date must be a valid date.",
    }),
    note: z.string().trim().optional(),
  })
  .strict({
    error:
      "Only employee, dailyRate, effectiveDate, and note can be submitted.",
  });

const employeeRateIdSchema = z.object({
  id: z.string().regex(mongoIdRegex, "Invalid employee rate id."),
});

const employeeRateQuerySchema = z
  .object({
    employee: z.string().regex(mongoIdRegex, "Invalid employee id.").optional(),
    search: z.string().trim().optional(),
    sort: z.string().trim().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  })
  .strict({
    error: "Only employee, search, sort, page, and limit are allowed.",
  });

const updateEmployeeRateSchema = z
  .object({
    dailyRate: z
      .number({ error: "Daily rate must be a number." })
      .positive("Daily rate must be greater than 0.")
      .optional(),
    effectiveDate: z.coerce.date({
      error: "Effective date must be a valid date.",
    }).optional(),
    note: z.string().trim().optional(),
  })
  .strict({
    error:
      "Only dailyRate, effectiveDate, and note can be submitted.",
  });

export {
  createEmployeeRateSchema,
  updateEmployeeRateSchema,
  employeeRateIdSchema,
  employeeRateQuerySchema,
};

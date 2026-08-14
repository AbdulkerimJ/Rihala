import { z } from "zod";
import { emptyToUndefined } from "../../core/utils/zod.js";
import { isValidEthiopianPhone } from "../../core/utils/phone.js";

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;

const employeeStatusSchema = z.enum(["active", "inactive"], {
  error: "Status must be active or inactive.",
});

const normalizeDate = (value) => {
  const parsedDate = new Date(value);
  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate;
};



const createEmployeeSchema = z
  .object({
    name: z
      .string({ error: "Employee name is required." })
      .trim()
      .min(2, "Name must be at least 2 characters."),

    phone: z
      .string({ error: "Phone number is required." })
      .trim()
      .min(1, "Phone number is required.")
      .refine((value) => isValidEthiopianPhone(value), {
        message: "Please enter a valid Ethiopian phone number.",
      }),

    employmentStartDate: z.coerce.date({
      error: "Employment start date must be a valid date.",
    }),

    employmentEndDate: emptyToUndefined(
      z.coerce
        .date({ error: "Employment end date must be a valid date." })
        .optional(),
    ),

    status: employeeStatusSchema.optional().default("active"),
  })
  .strict({
    error:
      "Only name, phone, employmentStartDate, employmentEndDate, and status can be submitted.",
  })
  .refine(
    (data) => {
      const startDate = normalizeDate(data.employmentStartDate);
      const endDate = data.employmentEndDate
        ? normalizeDate(data.employmentEndDate)
        : null;

      return !endDate || endDate >= startDate;
    },
    {
      message: "employmentEndDate cannot be before employmentStartDate.",
    },
  );

const updateEmployeeSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters.")
      .optional(),

    phone: z
      .string()
      .trim()
      .min(1, "Phone number is required.")
      .refine((value) => isValidEthiopianPhone(value), {
        message: "Please enter a valid Ethiopian phone number.",
      })
      .optional(),

    employmentStartDate: emptyToUndefined(
      z.coerce
        .date({ error: "Employment start date must be a valid date." })
        .optional(),
    ),

    employmentEndDate: emptyToUndefined(
      z.coerce
        .date({ error: "Employment end date must be a valid date." })
        .optional(),
    ),

    status: employeeStatusSchema.optional(),
  })
  .strict({
    error:
      "Only name, phone, employmentStartDate, employmentEndDate, and status can be updated.",
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update.",
  });

const employeeIdSchema = z.object({
  id: z.string().regex(mongoIdRegex, "Invalid employee id."),
});

const employeeQuerySchema = z
  .object({
    status: employeeStatusSchema.optional(),
    search: z.string().trim().optional(),
    sort: z.string().trim().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  })
  .strict({
    error: "Only status, search, sort, page, and limit are allowed.",
  });

export {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeIdSchema,
  employeeQuerySchema,
};

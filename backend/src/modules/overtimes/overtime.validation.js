import { z } from "zod";

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
const overtimeDurations = ["HALF_DAY", "FULL_DAY"];

const overtimeDurationSchema = z.enum(overtimeDurations, {
  error: "Duration must be HALF_DAY or FULL_DAY.",
});

const normalizeDateValue = (value) => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate;
};

const createOvertimeSchema = z
  .object({
    employee: z.string().regex(mongoIdRegex, "Invalid employee id."),
    workDate: z.coerce.date({ error: "Work date must be a valid date." }),
    duration: overtimeDurationSchema,
    note: z.string().trim().optional(),
  })
  .strict({
    error: "Only employee, workDate, duration, and note can be submitted.",
  })
  .refine((data) => normalizeDateValue(data.workDate) !== null, {
    message: "Work date must be a valid date.",
    path: ["workDate"],
  });

const updateOvertimeSchema = z
  .object({
    duration: overtimeDurationSchema.optional(),
    note: z.string().trim().optional(),
  })
  .strict({
    error: "Only duration and note can be updated.",
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update.",
  });

const overtimeIdSchema = z.object({
  id: z.string().regex(mongoIdRegex, "Invalid overtime id."),
});

const overtimeQuerySchema = z
  .object({
    employee: z.string().regex(mongoIdRegex, "Invalid employee id.").optional(),
    workDate: z.coerce
      .date({ error: "Work date must be a valid date." })
      .optional(),
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
      "Only employee, workDate, from, to, search, sort, page, and limit are allowed.",
  });

export {
  createOvertimeSchema,
  updateOvertimeSchema,
  overtimeIdSchema,
  overtimeQuerySchema,
};

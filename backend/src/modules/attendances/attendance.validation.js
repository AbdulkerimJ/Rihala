import { z } from "zod";
import { isWorkday } from "./attendance.service.js";
import { normalizeDateValue } from "../../core/utils/date.js";

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
const attendanceStatuses = ["PRESENT", "ABSENT", "PERMISSION"];

const attendanceStatusSchema = z.enum(attendanceStatuses);

const createAttendanceSchema = z
  .object({
    employee: z.string().regex(mongoIdRegex, "Invalid employee id."),
    workDate: z.coerce.date({ error: "Work date must be a valid date." }),
    morningStatus: attendanceStatusSchema,
    afternoonStatus: attendanceStatusSchema,
  })
  .strict({
    error:
      "Only employee, workDate, morningStatus, and afternoonStatus can be submitted.",
  })
  .refine((data) => isWorkday(normalizeDateValue(data.workDate)), {
    message: "Attendance can only be recorded for Monday through Saturday.",
    path: ["workDate"],
  });

const updateAttendanceSchema = z
  .object({
    morningStatus: attendanceStatusSchema.optional(),
    afternoonStatus: attendanceStatusSchema.optional(),
  })
  .strict({
    error: "Only morningStatus and afternoonStatus can be updated.",
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update.",
  });

const attendanceIdSchema = z.object({
  id: z.string().regex(mongoIdRegex, "Invalid attendance id."),
});

const attendanceQuerySchema = z
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
  createAttendanceSchema,
  updateAttendanceSchema,
  attendanceIdSchema,
  attendanceQuerySchema,
};

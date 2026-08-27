import { z } from "zod";
import { isWorkday } from "../../utils/validation";

export const ATTENDANCE_STATUSES = [
  {
    value: "PRESENT",
    label: "Present",
    color: "bg-success text-white",
    badgeVariant: "success",
    border: "border-success",
    text: "text-success",
    bg: "bg-success/10",
  },
  {
    value: "ABSENT",
    label: "Absent",
    color: "bg-danger text-white",
    badgeVariant: "danger",
    border: "border-danger",
    text: "text-danger",
    bg: "bg-danger/10",
  },
  {
    value: "PERMISSION",
    label: "Excused",
    color: "bg-warning text-white",
    badgeVariant: "warning",
    border: "border-warning",
    text: "text-warning",
    bg: "bg-warning/10",
  },
];

export const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

export const attendanceSchema = z.object({
  employee: z.string().min(1, "Employee is required"),
  workDate: z
    .string()
    .min(1, "Work date is required")
    .refine((date) => isWorkday(date), {
      message: "Attendance can only be recorded for Monday through Saturday",
    }),
  morningStatus: z.enum(["PRESENT", "ABSENT", "PERMISSION"], {
    errorMap: () => ({ message: "Morning status is required" }),
  }),
  afternoonStatus: z.enum(["PRESENT", "ABSENT", "PERMISSION"], {
    errorMap: () => ({ message: "Afternoon status is required" }),
  }),
});

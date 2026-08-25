import { z } from "zod";

const reportsQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).strict().refine((data) => {
  if (data.startDate && data.endDate && data.endDate < data.startDate) {
    return false;
  }
  return true;
}, {
  message: "endDate cannot be before startDate",
  path: ["endDate"],
});

export {
  reportsQuerySchema,
};

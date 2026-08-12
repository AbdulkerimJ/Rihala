import { z } from "zod";

const createContractSchema = z.object({
  contractor: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid contractor ID"),
  task: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid task ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().positive("Unit price must be positive").optional(), // Service will default to task.defaultUnitPrice
  contractDate: z.coerce.date(),
  expectedCompletionDate: z.coerce.date().optional().nullable(),
  note: z.string().trim().optional().nullable(),
}).strict().refine((data) => {
  if (data.expectedCompletionDate && data.expectedCompletionDate < data.contractDate) {
    return false;
  }
  return true;
}, {
  message: "Expected completion date cannot be before contract date",
  path: ["expectedCompletionDate"],
});

const cancelContractSchema = z.object({
  cancellationReason: z.string().trim().min(1, "Cancellation reason is required").max(500),
}).strict();

const contractIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid contract ID"),
});

const contractQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default("1").optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).default("10").optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  contractor: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid contractor ID").optional(),
  task: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid task ID").optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export {
  createContractSchema,
  cancelContractSchema,
  contractIdSchema,
  contractQuerySchema,
};

import { z } from "zod";

const createContractorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  phone: z.string().trim().min(5, "Phone must be at least 5 characters").optional().nullable(),
  notes: z.string().trim().max(1000, "Notes cannot exceed 1000 characters").optional().nullable(),
  status: z.enum(["active", "inactive"]).optional().default("active"),
}).strict();

const updateContractorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .optional(),
  phone: z.string().trim().min(5, "Phone must be at least 5 characters").optional().nullable(),
  notes: z.string().trim().max(1000, "Notes cannot exceed 1000 characters").optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
}).strict().refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided to update",
});

const contractorIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid contractor ID"),
});

const contractorQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default("1").optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).default("10").optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export {
  createContractorSchema,
  updateContractorSchema,
  contractorIdSchema,
  contractorQuerySchema,
};

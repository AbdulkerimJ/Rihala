import { z } from "zod";

const createTaskSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  taskType: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid task type ID"),
  defaultUnitPrice: z.number().positive("Default unit price must be positive"),
  isActive: z.boolean().optional().default(true),
}).strict();

const updateTaskSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .optional(),
  taskType: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid task type ID").optional(),
  defaultUnitPrice: z.number().positive("Default unit price must be positive").optional(),
  isActive: z.boolean().optional(),
}).strict().refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided to update",
});

const taskIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid task ID"),
});

const taskQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default("1").optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).default("10").optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  taskType: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid task type ID").optional(),
  isActive: z.enum(["true", "false"]).transform((val) => val === "true").optional(),
})
  .strict({ error: "Invalid query parameters." });

export {
  createTaskSchema,
  updateTaskSchema,
  taskIdSchema,
  taskQuerySchema,
};

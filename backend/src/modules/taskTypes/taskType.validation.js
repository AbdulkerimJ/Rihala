import { z } from "zod";

const createTaskTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  isActive: z.boolean().optional().default(true),
}).strict();

const updateTaskTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .optional(),
  isActive: z.boolean().optional(),
}).strict().refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided to update",
});

const taskTypeIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid task type ID"),
});

const taskTypeQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default("1").optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).default("10").optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  isActive: z.enum(["true", "false"]).transform((val) => val === "true").optional(),
})
  .strict({ error: "Invalid query parameters." });

export {
  createTaskTypeSchema,
  updateTaskTypeSchema,
  taskTypeIdSchema,
  taskTypeQuerySchema,
};

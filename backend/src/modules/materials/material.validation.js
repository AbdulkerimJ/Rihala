import { z } from "zod";

const CATEGORIES = [
  "MDF",
  "Wood",
  "Fabric",
  "Foam",
  "Safarian",
  "Nails",
  "Paint",
  "Adhesives",
  "Hardware",
  "Chemicals",
  "Other",
];

const UNITS = ["piece", "kg", "meter", "liter", "roll"];

const createMaterialSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: "Invalid material category" }),
  }),
  unit: z.enum(UNITS, {
    errorMap: () => ({ message: "Invalid material unit" }),
  }),
  status: z.enum(["active", "inactive"]).default("active").optional(),
});

const updateMaterialSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .optional(),
  category: z.enum(CATEGORIES).optional(),
  unit: z.enum(UNITS).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

const materialIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid material ID"),
});

const materialQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default("1")
    .optional(),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default("10")
    .optional(),
  sort: z.string().optional(),
  name: z.string().optional(),
  category: z.enum(CATEGORIES).optional(),
  unit: z.enum(UNITS).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  search: z.string().optional(),
})
  .strict({ error: "Invalid query parameters." });

export {
  createMaterialSchema,
  updateMaterialSchema,
  materialIdSchema,
  materialQuerySchema,
};

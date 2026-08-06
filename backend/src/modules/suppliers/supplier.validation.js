import { z } from "zod";

const createSupplierSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  phone: z.string().min(9, "Please enter a valid phone number"),
  address: z.string().max(255).optional(),
  note: z.string().max(1000).optional(),
  status: z.enum(["active", "inactive"]).default("active").optional(),
});

const updateSupplierSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .optional(),
  phone: z.string().min(9, "Please enter a valid phone number").optional(),
  address: z.string().max(255).optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
});

const supplierIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid supplier ID"),
});

const supplierQuerySchema = z.object({
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
  phone: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  search: z.string().optional(),
});

export {
  createSupplierSchema,
  updateSupplierSchema,
  supplierIdSchema,
  supplierQuerySchema,
};

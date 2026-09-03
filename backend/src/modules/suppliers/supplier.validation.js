import { z } from "zod";
import { emptyToUndefined } from "../../core/utils/zod.js";
import { isValidEthiopianPhone } from "../../core/utils/phone.js";



const createSupplierSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  phone: z
    .string({ error: "Phone number is required." })
    .trim()
    .min(1, "Phone number is required.")
    .refine((value) => isValidEthiopianPhone(value), {
      message: "Please enter a valid Ethiopian phone number.",
    }),
  address: emptyToUndefined(z.string().max(255).optional().nullable()),
  note: emptyToUndefined(z.string().max(1000).optional().nullable()),
  notes: emptyToUndefined(z.string().max(1000).optional().nullable()),
  status: z.enum(["active", "inactive"]).default("active").optional(),
});

const updateSupplierSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .optional(),
  phone: emptyToUndefined(
    z
      .string()
      .trim()
      .min(1, "Phone number is required.")
      .refine((value) => isValidEthiopianPhone(value), {
        message: "Please enter a valid Ethiopian phone number.",
      })
      .optional(),
  ),
  address: emptyToUndefined(z.string().max(255).optional().nullable()),
  note: emptyToUndefined(z.string().max(1000).optional().nullable()),
  notes: emptyToUndefined(z.string().max(1000).optional().nullable()),
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
  status: z.enum(["active", "inactive"]).optional(),
  search: z.string().optional(),
})
  .strict({ error: "Invalid query parameters." });

export {
  createSupplierSchema,
  updateSupplierSchema,
  supplierIdSchema,
  supplierQuerySchema,
};

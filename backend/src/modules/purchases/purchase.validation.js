import { z } from "zod";

const purchaseItemSchema = z.object({
  material: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid material ID"),
  quantity: z.number().positive("Quantity must be positive"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
});

const createPurchaseSchema = z.object({
  purchaseNumber: z.string().trim().min(1, "Purchase number is required").optional(),
  supplier: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid supplier ID"),
  date: z.string().datetime({ message: "Invalid ISO datetime string" }),
  items: z.array(purchaseItemSchema).min(1, "At least one item is required"),
  note: z.string().max(1000).optional().nullable(),
});

const updatePurchaseSchema = z.object({
  supplier: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid supplier ID").optional(),
  date: z.string().datetime({ message: "Invalid ISO datetime string" }).optional(),
  items: z.array(purchaseItemSchema).min(1, "At least one item is required").optional(),
  note: z.string().max(1000).optional().nullable(),
});

const purchaseIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid purchase ID"),
});

const purchaseQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default("1").optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).default("10").optional(),
  sort: z.string().optional(),
  supplier: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  paymentStatus: z.enum(["UNPAID", "PARTIALLY_PAID", "PAID"]).optional(),
  paymentStatuses: z.string().optional(),
  from: z.coerce.date({ error: "The from date must be a valid date." }).optional(),
  to: z.coerce.date({ error: "The to date must be a valid date." }).optional(),
  search: z.string().optional(),
})
  .strict({ error: "Invalid query parameters." });

export {
  createPurchaseSchema,
  updatePurchaseSchema,
  purchaseIdSchema,
  purchaseQuerySchema,
};

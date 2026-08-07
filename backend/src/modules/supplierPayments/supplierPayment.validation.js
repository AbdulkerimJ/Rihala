import { z } from "zod";

const createSpecificPaymentSchema = z.object({
  type: z.literal("SPECIFIC"),
  supplier: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid supplier ID"),
  purchaseId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid purchase ID"),
  amount: z.number().positive("Payment amount must be positive"),
  date: z.string().datetime({ message: "Invalid ISO datetime string" }),
  paymentReference: z.string().trim().optional(),
  note: z.string().max(1000).optional().nullable(),
}).strict({ error: "Invalid fields in specific payment payload" });

const createGeneralPaymentSchema = z.object({
  type: z.literal("GENERAL"),
  supplier: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid supplier ID"),
  amount: z.number().positive("Payment amount must be positive"),
  date: z.string().datetime({ message: "Invalid ISO datetime string" }),
  paymentReference: z.string().trim().optional(),
  note: z.string().max(1000).optional().nullable(),
}).strict({ error: "Invalid fields in general payment payload" });

const createSupplierPaymentSchema = z.union([
  createSpecificPaymentSchema,
  createGeneralPaymentSchema,
]);

const updateSupplierPaymentSchema = z.object({
  amount: z.number().positive("Payment amount must be positive").optional(),
  date: z.string().datetime({ message: "Invalid ISO datetime string" }).optional(),
  note: z.string().max(1000).optional().nullable(),
}).strict({ error: "Only amount, date, and note can be updated" });

const supplierPaymentIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid payment ID"),
});

const supplierPaymentQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default("1").optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).default("10").optional(),
  sort: z.string().optional(),
  supplier: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  type: z.enum(["SPECIFIC", "GENERAL"]).optional(),
  search: z.string().optional(),
}).strict({ error: "Invalid query parameters" });

const voidSupplierPaymentSchema = z.object({
  voidReason: z.string().min(1, "Void reason is required").max(1000, "Void reason too long"),
}).strict({ error: "Only voidReason is allowed" });

export {
  createSupplierPaymentSchema,
  updateSupplierPaymentSchema,
  supplierPaymentIdSchema,
  supplierPaymentQuerySchema,
  voidSupplierPaymentSchema,
};

import { z } from "zod";

const createContractorPaymentSchema = z.object({
  contract: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid contract ID"),
  amount: z.number().positive("Amount must be positive"),
  paymentDate: z.coerce.date(),
  note: z.string().trim().optional().nullable(),
}).strict();

const voidContractorPaymentSchema = z.object({
  voidReason: z.string().trim().min(1, "Void reason is required").max(500),
}).strict();

const contractorPaymentIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid contractor payment ID"),
});

const contractorPaymentQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default("1").optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).default("10").optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  contract: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid contract ID").optional(),
  status: z.enum(["active", "voided"]).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export {
  createContractorPaymentSchema,
  voidContractorPaymentSchema,
  contractorPaymentIdSchema,
  contractorPaymentQuerySchema,
};

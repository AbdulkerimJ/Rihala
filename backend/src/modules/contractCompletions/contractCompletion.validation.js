import { z } from "zod";

const createContractCompletionSchema = z.object({
  contract: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid contract ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  recordedAt: z.coerce.date(),
  note: z.string().trim().optional().nullable(),
}).strict();

const voidContractCompletionSchema = z.object({
  voidReason: z.string().trim().min(1, "Void reason is required").max(500),
}).strict();

const contractCompletionIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid contract completion ID"),
});

const contractCompletionQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default("1").optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).default("10").optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  contract: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid contract ID").optional(),
  status: z.enum(["ACTIVE", "VOIDED"]).optional(),
})
  .strict({ error: "Invalid query parameters." });

export {
  createContractCompletionSchema,
  voidContractCompletionSchema,
  contractCompletionIdSchema,
  contractCompletionQuerySchema,
};

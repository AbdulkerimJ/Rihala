import { z } from "zod";
import { isValidEthiopianPhone } from "../../core/utils/phone.js";

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;

const customerStatusSchema = z.enum(["active", "inactive"], {
  error: "Status must be active or inactive.",
});

const createCustomerSchema = z.object({
  name: z
    .string({ error: "Customer name is required." })
    .trim()
    .min(2, "Name must be at least 2 characters."),

  phone: z
    .string({ error: "Phone number is required." })
    .trim()
    .min(1, "Phone number is required.")
    .refine((value) => isValidEthiopianPhone(value), {
      message: "Please enter a valid Ethiopian phone number.",
    }),

  email: z
    .string({ error: "Please enter a valid email address." })
    .trim()
    .email("Please enter a valid email address.")
    .optional(),

  address: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  status: customerStatusSchema.optional().default("active"),
});

const updateCustomerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters.")
      .optional(),
    phone: z
      .string()
      .trim()
      .min(1, "Phone number is required.")
      .refine((value) => isValidEthiopianPhone(value), {
        message: "Please enter a valid Ethiopian phone number.",
      })
      .optional(),
    email: z
      .string({ error: "Please enter a valid email address." })
      .trim()
      .email("Please enter a valid email address.")
      .optional(),
    address: z.string().trim().optional(),
    notes: z.string().trim().optional(),
    status: customerStatusSchema.optional(),
  })
  .strict({
    error:
      "Only name, phone, email, address, notes, and status can be updated.",
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update.",
  });

const customerIdSchema = z.object({
  id: z.string().regex(mongoIdRegex, "Invalid customer id."),
});

const customerQuerySchema = z
  .object({
    status: customerStatusSchema.optional(),
    search: z.string().trim().optional(),
    sort: z.string().trim().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  })
  .strict({
    error: "Only status, search, sort, page, and limit are allowed.",
  });

export {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdSchema,
  customerQuerySchema,
};

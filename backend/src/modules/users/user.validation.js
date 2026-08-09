import { z } from "zod";

const createUserSchema = z.object({
  name: z
    .string({
      error: "Name is required.",
    })
    .min(2, "Name must be at least 2 characters."),

  email: z
    .string({
      error: "Email is required.",
    })
    .email("Please enter a valid email address."),

  roles: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid role id."))
    .optional(),
});

const updateUserSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters.").optional(),

    email: z.string().email("Please enter a valid email address.").optional(),
    roles: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid role id.")).optional(),
  })
  .strict({
    error: "Only name, email, and roles can be updated.",
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update.",
  });

const userIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user id."),
});

const userQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
  status: z.enum(["active", "inactive", "invited"]).optional(),
});

export { createUserSchema, updateUserSchema, userIdSchema, userQuerySchema };

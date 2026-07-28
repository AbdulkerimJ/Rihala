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

  password: z
    .string({
      error: "Password is required.",
    })
    .min(6, "Password must be at least 6 characters."),
});

const updateUserSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters.").optional(),

    email: z.string().email("Please enter a valid email address.").optional(),
  })
  .strict({
    error: "Only name and email can be updated.",
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update.",
  });

const userIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user id."),
});

export { createUserSchema, updateUserSchema, userIdSchema };

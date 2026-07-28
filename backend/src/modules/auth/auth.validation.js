import { z } from "zod";

const loginSchema = z.object({
  email: z
    .string({
      error: "Email is required.",
    })
    .email("Please enter a valid email address."),

  password: z
    .string({
      error: "Password is required.",
    })
    .min(1, "Password is required."),
});

const verifyEmailSchema = z.object({
  token: z
    .string({
      error: "Verification token is required.",
    })
    .min(1, "Verification token is required."),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

const forgotPasswordSchema = z.object({
  email: z
    .string({
      error: "Email is required.",
    })
    .email("Please enter a valid email address."),
});

const resetPasswordSchema = z.object({
  token: z
    .string({
      error: "Reset token is required.",
    })
    .min(1, "Reset token is required."),

  newPassword: z
    .string({
      error: "New password is required.",
    })
    .min(6, "New password must be at least 6 characters."),
});

export {
  loginSchema,
  verifyEmailSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};

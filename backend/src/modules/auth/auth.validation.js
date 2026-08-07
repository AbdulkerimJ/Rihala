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

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required."),
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

const acceptInvitationSchema = z
  .object({
    token: z
      .string({ error: "Token is required." })
      .min(1, "Token is required."),

    code: z
      .string({ error: "Verification code is required." })
      .regex(/^\d{4}$/, "Verification code must be 4 digits."),

    password: z
      .string({ error: "Password is required." })
      .min(6, "Password must be at least 6 characters."),

    confirmPassword: z
      .string({ error: "Please confirm your password." })
      .min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export {
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  acceptInvitationSchema,
};

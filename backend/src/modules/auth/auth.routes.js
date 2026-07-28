import express from "express";
import validate from "../../core/middleware/validate.js";
import {
  verifyEmailSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.validation.js";
import {
  verifyEmailController,
  loginController,
  refreshController,
  logoutController,
  forgotPasswordController,
  resetPasswordController,
} from "./auth.controller.js";

const router = express.Router();

// Verify user email address
router.post(
  "/verify-email",
  validate(verifyEmailSchema, "Please provide a valid verification token."),
  verifyEmailController,
);

// User login
router.post(
  "/login",
  validate(loginSchema, "Please check login credentials."),
  loginController,
);

// Refresh access token
router.post(
  "/refresh",
  validate(refreshTokenSchema, "Please check refresh token input."),
  refreshController,
);

// Logout user
router.post("/logout", logoutController);

// Request password reset link
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema, "Please check email input."),
  forgotPasswordController,
);

// Reset password using token
router.post(
  "/reset-password",
  validate(resetPasswordSchema, "Please check password reset information."),
  resetPasswordController,
);

export default router;

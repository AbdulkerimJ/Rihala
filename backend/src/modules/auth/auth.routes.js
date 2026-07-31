import express from "express";
import validate from "../../core/middleware/validate.js";
import {
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  acceptInvitationSchema,
} from "./auth.validation.js";
import {
  loginController,
  refreshController,
  logoutController,
  forgotPasswordController,
  resetPasswordController,
  validateInvitationController,
  acceptInvitationController,
} from "./auth.controller.js";

const router = express.Router();

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

// Validate an invitation token (GET - called on page load)
router.get("/invitation/validate/:token", validateInvitationController);

// Accept an invitation and set password (POST)
router.post(
  "/invitation/accept",
  validate(acceptInvitationSchema, "Please check the invitation details."),
  acceptInvitationController,
);

export default router;

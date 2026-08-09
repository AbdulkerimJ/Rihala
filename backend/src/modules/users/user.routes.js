import express from "express";

import {
  activateUserController,
  createUserController,
  deactivateUserController,
  getAllUsersController,
  getUserByIdController,
  getDeletedUsersController,
  resendInvitationController,
  restoreUserController,
  softDeleteUserController,
  updateUserController,
} from "./user.controller.js";
import {
  assignRolesToUserController,
  removeRoleFromUserController,
} from "./user.roles.controller.js";
import validate from "../../core/middleware/validate.js";
import authenticate from "../../core/middleware/authenticate.js";
import authorize from "../../core/middleware/authorize.js";
import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  userQuerySchema,
} from "./user.validation.js";
import {
  assignRolesToUserSchema,
  userRoleParamsSchema,
} from "../roles/role.validation.js";

const router = express.Router();

// Protect all user routes with authentication
router.use(authenticate);

// Get all active users.
router.get(
  "/",
  authorize("users.read"),
  validate(userQuerySchema, "Please check the user filters.", "query"),
  getAllUsersController,
);

// Get all soft-deleted users.
router.get(
  "/deleted",
  authorize("users.read"),
  validate(userQuerySchema, "Please check the user filters.", "query"),
  getDeletedUsersController,
);

// Create a new user.
router.post(
  "/",
  authorize("users.create"),
  validate(createUserSchema, "Please check the user information."),
  createUserController,
);

// Update an existing user.
router.patch(
  "/:id",
  authorize("users.update"),
  validate(userIdSchema, "Please check the user id.", "params"),
  validate(updateUserSchema, "Please check the user information."),
  updateUserController,
);

// Get a user by id.
router.get(
  "/:id",
  authorize("users.read"),
  validate(userIdSchema, "Please check the user id.", "params"),
  getUserByIdController,
);

// Resend invitation.
router.post(
  "/:id/resend-invitation",
  authorize("users.update"),
  validate(userIdSchema, "Please check the user id.", "params"),
  resendInvitationController,
);

// Deactivate a user account.
router.patch(
  "/:id/deactivate",
  authorize("users.update"),
  validate(userIdSchema, "Please check the user id.", "params"),
  deactivateUserController,
);

// Activate a user account.
router.patch(
  "/:id/activate",
  authorize("users.update"),
  validate(userIdSchema, "Please check the user id.", "params"),
  activateUserController,
);

// Restore a soft-deleted user.
router.patch(
  "/:id/restore",
  authorize("users.restore"),
  validate(userIdSchema, "Please check the user id.", "params"),
  restoreUserController,
);

// Soft delete a user account.
router.delete(
  "/:id",
  authorize("users.delete"),
  validate(userIdSchema, "Please check the user id.", "params"),
  softDeleteUserController,
);

// Assign roles to a user.
router.post(
  "/:id/roles",
  authorize("users.assign-role"),
  validate(userIdSchema, "Please check the user id.", "params"),
  validate(assignRolesToUserSchema, "Please check the role ids."),
  assignRolesToUserController,
);

// Remove a role from a user.
router.delete(
  "/:id/roles/:roleId",
  authorize("users.assign-role"),
  validate(userRoleParamsSchema, "Please check the ids.", "params"),
  removeRoleFromUserController,
);

export default router;

import express from "express";

import authenticate from "../../core/middleware/authenticate.js";
import authorize from "../../core/middleware/authorize.js";
import validate from "../../core/middleware/validate.js";
import {
  getAllRolesController,
  createRoleController,
  getRoleByIdController,
  updateRoleController,
  deleteRoleController,
  addPermissionsController,
  removePermissionController,
} from "./role.controller.js";
import {
  createRoleSchema,
  updateRoleSchema,
  roleIdSchema,
  addPermissionsSchema,
  removePermissionParamsSchema,
} from "./role.validation.js";

const router = express.Router();

// Protect all role routes with authentication
router.use(authenticate);

// Get all roles.
router.get("/", authorize("roles.read"), getAllRolesController);

// Create a new role.
router.post(
  "/",
  authorize("roles.create"),
  validate(createRoleSchema, "Please check the role information."),
  createRoleController,
);

// Get a role by id.
router.get(
  "/:id",
  authorize("roles.read"),
  validate(roleIdSchema, "Please check the role id.", "params"),
  getRoleByIdController,
);

// Update a role.
router.patch(
  "/:id",
  authorize("roles.update"),
  validate(roleIdSchema, "Please check the role id.", "params"),
  validate(updateRoleSchema, "Please check the role information."),
  updateRoleController,
);

// Delete a role.
router.delete(
  "/:id",
  authorize("roles.delete"),
  validate(roleIdSchema, "Please check the role id.", "params"),
  deleteRoleController,
);

// Add permissions to a role.
router.post(
  "/:id/permissions",
  authorize("roles.assign-permission"),
  validate(roleIdSchema, "Please check the role id.", "params"),
  validate(addPermissionsSchema, "Please check the permission ids."),
  addPermissionsController,
);

// Remove a permission from a role.
router.delete(
  "/:id/permissions/:permissionId",
  authorize("roles.assign-permission"),
  validate(removePermissionParamsSchema, "Please check the ids.", "params"),
  removePermissionController,
);

export default router;

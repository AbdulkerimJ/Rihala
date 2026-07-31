import { catchAsync } from "../../core/utils/catchAsync.js";
import {
  createRoleService,
  getAllRolesService,
  getRoleByIdService,
  updateRoleService,
  deleteRoleService,
  addPermissionsToRoleService,
  removePermissionsFromRoleService,
} from "./role.service.js";

// Get all roles.
const getAllRolesController = catchAsync(async (req, res) => {
  const roles = await getAllRolesService();

  res.status(200).json({
    status: "success",
    data: roles,
  });
});

// Create a new role.
const createRoleController = catchAsync(async (req, res) => {
  const role = await createRoleService(req.validatedBody);

  res.status(201).json({
    status: "success",
    data: role,
  });
});

// Get a role by id.
const getRoleByIdController = catchAsync(async (req, res) => {
  const role = await getRoleByIdService(req.validatedParams.id);

  res.status(200).json({
    status: "success",
    data: role,
  });
});

// Update a role.
const updateRoleController = catchAsync(async (req, res) => {
  const role = await updateRoleService(req.validatedParams.id, req.validatedBody);

  res.status(200).json({
    status: "success",
    data: role,
  });
});

// Delete a role.
const deleteRoleController = catchAsync(async (req, res) => {
  await deleteRoleService(req.validatedParams.id);

  res.status(200).json({
    status: "success",
    message: "Role deleted successfully.",
  });
});

// Add permissions to a role.
const addPermissionsController = catchAsync(async (req, res) => {
  const role = await addPermissionsToRoleService(
    req.validatedParams.id,
    req.validatedBody.permissionIds,
  );

  res.status(200).json({
    status: "success",
    data: role,
  });
});

// Remove permissions from a role.
const removePermissionsController = catchAsync(async (req, res) => {
  const role = await removePermissionsFromRoleService(
    req.validatedParams.id,
    req.validatedBody.permissionIds,
  );

  res.status(200).json({
    status: "success",
    data: role,
  });
});

export {
  getAllRolesController,
  createRoleController,
  getRoleByIdController,
  updateRoleController,
  deleteRoleController,
  addPermissionsController,
  removePermissionsController,
};

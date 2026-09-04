import Role from "./role.model.js";
import Permission from "../permissions/permission.model.js";
import User from "../users/user.model.js";
import ConflictError from "../../core/errors/ConflictError.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import ForbiddenError from "../../core/errors/ForbiddenError.js";

const ADMIN_ROLE_NAME = "Admin";

// Create a new role.
// The Admin role name is reserved and cannot be created manually.
// New roles start with zero permissions.
const createRoleService = async ({ name, permissions = [] }) => {
  if (name.trim().toLowerCase() === ADMIN_ROLE_NAME.toLowerCase()) {
    const msg = `The role name "${ADMIN_ROLE_NAME}" is reserved and cannot be created manually.`;
    throw new ConflictError(msg, [{ field: "name", message: msg }]);
  }

  const existingRole = await Role.findOne({ name: name.trim() });

  if (existingRole) {
    const msg = `A role with the name "${name}" already exists.`;
    throw new ConflictError(msg, [{ field: "name", message: msg }]);
  }

  let finalPermissions = [];
  if (permissions && permissions.length > 0) {
    const validPermissions = await Permission.find({
      _id: { $in: permissions },
    }).select("_id");

    if (validPermissions.length !== permissions.length) {
      throw new NotFoundError("One or more permission ids are invalid.");
    }
    finalPermissions = validPermissions.map((p) => p._id);
  }

  const role = await Role.create({ name: name.trim(), permissions: finalPermissions });

  return role;
};

// Get all roles, with permissions populated.
const getAllRolesService = async () => {
  const roles = await Role.find().populate("permissions").sort({ name: 1 });

  return roles;
};

// Get a single role by id, with permissions populated.
const getRoleByIdService = async (roleId) => {
  const role = await Role.findById(roleId).populate("permissions");

  if (!role) {
    throw new NotFoundError("Role not found.");
  }

  return role;
};

// Update a role's name and/or permissions.
// System roles cannot be updated.
const updateRoleService = async (roleId, updateData) => {
  const role = await Role.findById(roleId);

  if (!role) {
    throw new NotFoundError("Role not found.");
  }

  if (role.isSystemRole) {
    throw new ForbiddenError("System roles cannot be modified.");
  }

  if (updateData.name && updateData.name.trim().toLowerCase() === ADMIN_ROLE_NAME.toLowerCase()) {
    const msg = `The role name "${ADMIN_ROLE_NAME}" is reserved and cannot be used.`;
    throw new ConflictError(msg, [{ field: "name", message: msg }]);
  }

  if (updateData.name && updateData.name.trim() !== role.name) {
    const existingRole = await Role.findOne({ name: updateData.name.trim() });

    if (existingRole) {
      const msg = `A role with the name "${updateData.name}" already exists.`;
      throw new ConflictError(msg, [{ field: "name", message: msg }]);
    }
  }

  if (updateData.name !== undefined) {
    role.name = updateData.name.trim();
  }

  if (updateData.permissions !== undefined) {
    // Validate that all given permission ids exist
    const validPermissions = await Permission.find({
      _id: { $in: updateData.permissions },
    }).select("_id");

    if (validPermissions.length !== updateData.permissions.length) {
      throw new NotFoundError("One or more permission ids are invalid.");
    }

    role.permissions = validPermissions.map((p) => p._id);
  }

  await role.save();

  return role.populate("permissions");
};

// Delete a role.
// System roles cannot be deleted.
const deleteRoleService = async (roleId) => {
  const role = await Role.findById(roleId);

  if (!role) {
    throw new NotFoundError("Role not found.");
  }

  if (role.isSystemRole) {
    throw new ForbiddenError("System roles cannot be deleted.");
  }

  await Role.deleteOne({ _id: roleId });

  // Remove the deleted role from all users who held it
  await User.updateMany(
    { roles: roleId },
    { $pull: { roles: roleId } },
  );

  return role;
};

// Add permissions to a role (merges, no duplicates).
const addPermissionsToRoleService = async (roleId, permissionIds) => {
  const role = await Role.findById(roleId);

  if (!role) {
    throw new NotFoundError("Role not found.");
  }

  if (role.isSystemRole) {
    throw new ForbiddenError("System roles cannot be modified.");
  }

  // Validate that all given permission ids exist
  const validPermissions = await Permission.find({
    _id: { $in: permissionIds },
  }).select("_id");

  if (validPermissions.length !== permissionIds.length) {
    throw new NotFoundError("One or more permission ids are invalid.");
  }

  const existingIds = role.permissions.map((id) => id.toString());

  const newIds = validPermissions
    .map((p) => p._id)
    .filter((id) => !existingIds.includes(id.toString()));

  role.permissions.push(...newIds);

  await role.save();

  return role.populate("permissions");
};

// Remove permissions from a role.
const removePermissionsFromRoleService = async (roleId, permissionIds) => {
  const role = await Role.findById(roleId);

  if (!role) {
    throw new NotFoundError("Role not found.");
  }

  if (role.isSystemRole) {
    throw new ForbiddenError("System roles cannot be modified.");
  }

  // Validate that all given permission ids exist
  const validPermissions = await Permission.find({
    _id: { $in: permissionIds },
  }).select("_id");

  if (validPermissions.length !== permissionIds.length) {
    throw new NotFoundError("One or more permission ids are invalid.");
  }

  const idsToRemove = validPermissions.map(p => p._id.toString());

  role.permissions = role.permissions.filter(
    (id) => !idsToRemove.includes(id.toString()),
  );

  await role.save();

  return role.populate("permissions");
};

export {
  createRoleService,
  getAllRolesService,
  getRoleByIdService,
  updateRoleService,
  deleteRoleService,
  addPermissionsToRoleService,
  removePermissionsFromRoleService,
};

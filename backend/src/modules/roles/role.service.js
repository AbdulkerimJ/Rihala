import Role from "./role.model.js";
import Permission from "../permissions/permission.model.js";
import ConflictError from "../../core/errors/ConflictError.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import ForbiddenError from "../../core/errors/ForbiddenError.js";

const ADMIN_ROLE_NAME = "Admin";

// Create a new role.
// The Admin role name is reserved and cannot be created manually.
// New roles start with zero permissions.
const createRoleService = async ({ name }) => {
  if (name.trim() === ADMIN_ROLE_NAME) {
    throw new ConflictError(
      `The role name "${ADMIN_ROLE_NAME}" is reserved and cannot be created manually.`,
    );
  }

  const existingRole = await Role.findOne({ name: name.trim() });

  if (existingRole) {
    throw new ConflictError(`A role with the name "${name}" already exists.`);
  }

  const role = await Role.create({ name: name.trim(), permissions: [] });

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

  if (updateData.name && updateData.name.trim() === ADMIN_ROLE_NAME) {
    throw new ConflictError(
      `The role name "${ADMIN_ROLE_NAME}" is reserved and cannot be used.`,
    );
  }

  if (updateData.name && updateData.name.trim() !== role.name) {
    const existingRole = await Role.findOne({ name: updateData.name.trim() });

    if (existingRole) {
      throw new ConflictError(
        `A role with the name "${updateData.name}" already exists.`,
      );
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

// Remove a single permission from a role.
const removePermissionFromRoleService = async (roleId, permissionId) => {
  const role = await Role.findById(roleId);

  if (!role) {
    throw new NotFoundError("Role not found.");
  }

  if (role.isSystemRole) {
    throw new ForbiddenError("System roles cannot be modified.");
  }

  const permissionExists = role.permissions.some(
    (id) => id.toString() === permissionId,
  );

  if (!permissionExists) {
    throw new NotFoundError("Permission not found in this role.");
  }

  role.permissions = role.permissions.filter(
    (id) => id.toString() !== permissionId,
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
  removePermissionFromRoleService,
};

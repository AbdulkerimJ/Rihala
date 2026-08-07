import User from "./user.model.js";
import Role from "../roles/role.model.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import ForbiddenError from "../../core/errors/ForbiddenError.js";

const ADMIN_ROLE_NAME = "Admin";

// Assign one or more roles to a user (merges, no duplicates).
// Users cannot assign the system Admin role to others or themselves.
const assignRolesToUserService = async (userId, roleIds, requestingUserId) => {
  const user = await User.findOne({ _id: userId, deletedAt: null });

  if (!user) {
    throw new NotFoundError("User not found.");
  }

  // Validate that all given role ids exist
  const roles = await Role.find({ _id: { $in: roleIds } });

  if (roles.length !== roleIds.length) {
    throw new NotFoundError("One or more role ids are invalid.");
  }

  // Prevent assigning the Admin system role through this endpoint
  const hasAdminRole = roles.some((role) => role.name === ADMIN_ROLE_NAME);

  if (hasAdminRole) {
    throw new ForbiddenError(
      `The "${ADMIN_ROLE_NAME}" role cannot be assigned through this endpoint.`,
    );
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { roles: { $each: roles.map((r) => r._id) } } },
    { new: true },
  ).populate("roles");

  return updatedUser;
};

// Remove a single role from a user.
const removeRoleFromUserService = async (userId, roleId) => {
  const user = await User.findOne({ _id: userId, deletedAt: null });

  if (!user) {
    throw new NotFoundError("User not found.");
  }

  const roleExists = user.roles.some((id) => id.toString() === roleId);

  if (!roleExists) {
    throw new NotFoundError("Role not assigned to this user.");
  }

  user.roles = user.roles.filter((id) => id.toString() !== roleId);

  await user.save();

  return user.populate("roles");
};

export { assignRolesToUserService, removeRoleFromUserService };

import User from "../../modules/users/user.model.js";
import UnauthorizedError from "../errors/UnauthorizedError.js";
import ForbiddenError from "../errors/ForbiddenError.js";

/**
 * Authorization middleware factory.
 *
 * Usage:
 *   router.post("/expenses", authenticate, authorize("expenses.create"), controller);
 *
 * Flow:
 *   1. Ensure req.user is populated (authenticate must run first).
 *   2. Load user's roles and their nested permissions from the database.
 *   3. Build the union of all permission names across all roles.
 *   4. Allow or reject based on whether the required permission is present.
 */
const authorize = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication is required.");
      }

      const user = await User.findOne({
        _id: req.user.id,
        deletedAt: null,
      }).populate({
        path: "roles",
        populate: {
          path: "permissions",
          select: "name",
        },
      });

      if (!user || user.status === "inactive" || user.status === "invited") {
        throw new UnauthorizedError("User is not authorized or inactive.");
      }

      // Collect the union of all permission names across all roles
      const userPermissions = new Set();

      for (const role of user.roles) {
        for (const permission of role.permissions) {
          userPermissions.add(permission.name);
        }
      }

      if (!userPermissions.has(requiredPermission)) {
        throw new ForbiddenError(
          `You do not have permission to perform this action.`,
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default authorize;

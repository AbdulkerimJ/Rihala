import { catchAsync } from "../../core/utils/catchAsync.js";
import {
  assignRolesToUserService,
  removeRoleFromUserService,
} from "./user.roles.service.js";

// Assign roles to a user.
const assignRolesToUserController = catchAsync(async (req, res) => {
  const user = await assignRolesToUserService(
    req.validatedParams.id,
    req.validatedBody.roleIds,
    req.user?.id,
  );

  res.status(200).json({
    status: "success",
    data: user,
  });
});

// Remove a role from a user.
const removeRoleFromUserController = catchAsync(async (req, res) => {
  const user = await removeRoleFromUserService(
    req.validatedParams.id,
    req.validatedParams.roleId,
  );

  res.status(200).json({
    status: "success",
    data: user,
  });
});

export { assignRolesToUserController, removeRoleFromUserController };

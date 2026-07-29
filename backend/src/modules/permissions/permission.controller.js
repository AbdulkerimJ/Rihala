import { catchAsync } from "../../core/utils/catchAsync.js";
import { getAllPermissionsService } from "./permission.service.js";

// Get all permissions.
const getAllPermissionsController = catchAsync(async (req, res) => {
  const permissions = await getAllPermissionsService();

  res.status(200).json({
    status: "success",
    data: permissions,
  });
});

export { getAllPermissionsController };

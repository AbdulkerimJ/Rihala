import Permission from "./permission.model.js";

// Get all permissions.
const getAllPermissionsService = async () => {
  const permissions = await Permission.find().sort({ name: 1 });

  return permissions;
};

export { getAllPermissionsService };

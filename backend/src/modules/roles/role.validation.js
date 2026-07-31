import { z } from "zod";

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;

const createRoleSchema = z.object({
  name: z
    .string({
      error: "Role name is required.",
    })
    .min(2, "Role name must be at least 2 characters."),
});

const updateRoleSchema = z
  .object({
    name: z.string().min(2, "Role name must be at least 2 characters.").optional(),

    permissions: z
      .array(
        z.string().regex(mongoIdRegex, "Each permission id must be a valid ObjectId."),
      )
      .optional(),
  })
  .strict({
    error: "Only name and permissions can be updated.",
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update.",
  });

const roleIdSchema = z.object({
  id: z.string().regex(mongoIdRegex, "Invalid role id."),
});

const addPermissionsSchema = z.object({
  permissionIds: z
    .array(
      z.string().regex(mongoIdRegex, "Each permission id must be a valid ObjectId."),
    )
    .min(1, "At least one permission id is required."),
});

const removePermissionsSchema = z.object({
  permissionIds: z
    .array(
      z.string().regex(mongoIdRegex, "Each permission id must be a valid ObjectId."),
    )
    .min(1, "At least one permission id is required."),
});

const assignRolesToUserSchema = z.object({
  roleIds: z
    .array(
      z.string().regex(mongoIdRegex, "Each role id must be a valid ObjectId."),
    )
    .min(1, "At least one role id is required."),
});

const userRoleParamsSchema = z.object({
  id: z.string().regex(mongoIdRegex, "Invalid user id."),
  roleId: z.string().regex(mongoIdRegex, "Invalid role id."),
});

export {
  createRoleSchema,
  updateRoleSchema,
  roleIdSchema,
  addPermissionsSchema,
  removePermissionsSchema,
  assignRolesToUserSchema,
  userRoleParamsSchema,
};

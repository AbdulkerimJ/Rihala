import { catchAsync } from "../../core/utils/catchAsync.js";
import {
  activateUserService,
  createUserService,
  deactivateUserService,
  getAllUsersService,
  getUserByIdService,
  getDeletedUsersService,
  restoreUserService,
  softDeleteUserService,
  updateUserService,
} from "./user.service.js";

// Get all active users.
const getAllUsersController = catchAsync(async (req, res) => {
  const users = await getAllUsersService();

  res.status(200).json({
    status: "success",
    data: users,
  });
});

// Create a new invited user.
const createUserController = catchAsync(async (req, res) => {
  const result = await createUserService(req.validatedBody);
  const user = result.user;

  res.status(201).json({
    status: "success",
    message: `Invitation sent to ${user.email}. They will receive a link to set their password.`,
    data: {
      user,
      invitationCode: result.invitationCode,
    },
  });
});

// Deactivate a user account.
const deactivateUserController = catchAsync(async (req, res) => {
  const user = await deactivateUserService(req.validatedParams.id);

  res.status(200).json({
    status: "success",
    data: user,
  });
});

// Activate a user account.
const activateUserController = catchAsync(async (req, res) => {
  const user = await activateUserService(req.validatedParams.id);

  res.status(200).json({
    status: "success",
    data: user,
  });
});

// Get a user by id.
const getUserByIdController = catchAsync(async (req, res) => {
  const user = await getUserByIdService(req.validatedParams.id);

  res.status(200).json({
    status: "success",
    data: user,
  });
});

// Get all soft-deleted users.
const getDeletedUsersController = catchAsync(async (req, res) => {
  const users = await getDeletedUsersService();

  res.status(200).json({
    status: "success",
    data: users,
  });
});

// Restore a soft-deleted user.
const restoreUserController = catchAsync(async (req, res) => {
  const user = await restoreUserService(req.validatedParams.id);

  res.status(200).json({
    status: "success",
    data: user,
  });
});

// Soft delete a user account.
const softDeleteUserController = catchAsync(async (req, res) => {
  const user = await softDeleteUserService(
    req.validatedParams.id,
    req.user?.id,
  );

  res.status(200).json({
    status: "success",
    data: user,
  });
});

// Update an existing user.
const updateUserController = catchAsync(async (req, res) => {
  const result = await updateUserService(
    req.validatedParams.id,
    req.validatedBody,
  );

  res.status(200).json({
    status: "success",
    data: {
      user: result.user,
      invitationCode: result.invitationCode,
    },
  });
});

export {
  activateUserController,
  createUserController,
  deactivateUserController,
  getAllUsersController,
  getUserByIdController,
  getDeletedUsersController,
  restoreUserController,
  softDeleteUserController,
  updateUserController,
};

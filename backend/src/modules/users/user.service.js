import User from "./user.model.js";
import ConflictError from "../../core/errors/ConflictError.js";
import NotFoundError from "../../core/errors/NotFoundError.js";

// Create a new user record.
const createUserService = async (userData) => {
  const existingUser = await User.findOne({
    email: userData.email,
  });

  if (existingUser) {
    throw new ConflictError("Email already exists.");
  }

  const user = await User.create(userData);

  return user;
};

// Mark a user as inactive.
const deactivateUserService = async (userId) => {
  const user = await User.findOne({
    _id: userId,
    deletedAt: null,
  });

  if (!user) {
    throw new NotFoundError("User not found.");
  }

  user.status = "inactive";

  await user.save();

  return user;
};

// Mark a user as active.
const activateUserService = async (userId) => {
  const user = await User.findOne({
    _id: userId,
    deletedAt: null,
  });

  if (!user) {
    throw new NotFoundError("User not found.");
  }

  user.status = "active";

  await user.save();

  return user;
};

// Update an existing user record.
const updateUserService = async (userId, updateData) => {
  const user = await User.findOne({
    _id: userId,
    deletedAt: null,
  });

  if (!user) {
    throw new NotFoundError("User not found.");
  }

  if (updateData.email && updateData.email !== user.email) {
    const existingUser = await User.findOne({
      email: updateData.email,
    });

    if (existingUser) {
      throw new ConflictError("Email already exists.");
    }
  }

  Object.assign(user, updateData);

  await user.save();

  return user;
};

// Soft delete a user record.
const softDeleteUserService = async (userId, deletedByUserId) => {
  const user = await User.findOne({
    _id: userId,
    deletedAt: null,
  });

  if (!user) {
    throw new NotFoundError("User not found.");
  }

  user.status = "inactive";
  user.deletedAt = new Date();
  user.deletedBy = deletedByUserId ?? null;

  await user.save();

  return user;
};

// Get a user by id.
const getUserByIdService = async (userId) => {
  const user = await User.findOne({
    _id: userId,
    deletedAt: null,
  });

  if (!user) {
    throw new NotFoundError("User not found.");
  }

  return user;
};

// Get all active users.
const getAllUsersService = async () => {
  const users = await User.find({ deletedAt: null });

  return users;
};

// Get all soft-deleted users.
const getDeletedUsersService = async () => {
  const users = await User.find({ deletedAt: { $ne: null } });

  return users;
};

// Restore a soft-deleted user.
const restoreUserService = async (userId) => {
  const user = await User.findOne({
    _id: userId,
    deletedAt: { $ne: null },
  });

  if (!user) {
    throw new NotFoundError("User not found.");
  }

  user.deletedAt = null;
  user.deletedBy = null;
  user.status = "active";

  await user.save();

  return user;
};

export {
  createUserService,
  activateUserService,
  deactivateUserService,
  getAllUsersService,
  getDeletedUsersService,
  getUserByIdService,
  restoreUserService,
  softDeleteUserService,
  updateUserService,
};

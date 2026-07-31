import User from "./user.model.js";
import VerificationToken from "../auth/verificationToken.model.js";
import ConflictError from "../../core/errors/ConflictError.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import ValidationError from "../../core/errors/ValidationError.js";
import { generateRandomToken, hashToken } from "../../core/utils/token.js";
import { parseDurationToMs } from "../../core/utils/jwt.js";

// Parse invitation expiry duration from env (supports "24h", "7d" etc.)
const getInvitationExpiresAt = () => {
  const raw = process.env.INVITATION_TOKEN_EXPIRES_IN || "24h";
  const ms = parseDurationToMs(raw);
  return new Date(Date.now() + ms);
};

// Create a new invited user (no password required).
// Generates a secure invitation token and logs the invite link to the console.
const createUserService = async ({ name, email, roles }) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ConflictError("Email already exists.");
  }

  // Create user in invited state (no password)
  const user = await User.create({
    name,
    email,
    status: "invited",
    emailVerified: false,
    roles: roles || [],
  });

  // Generate secure invitation token
  const rawToken = generateRandomToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = getInvitationExpiresAt();

  await VerificationToken.create({
    user: user._id,
    type: "invitation",
    tokenHash,
    expiresAt,
  });

  // Log the invitation link (replace with real email service later)
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const invitationLink = `${clientUrl}/accept-invitation/${rawToken}`;
  console.log(
    `[INVITATION] Invitation sent to ${email}:\n  Link: ${invitationLink}\n  Expires: ${expiresAt.toISOString()}`,
  );

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

    // If the user is invited and admin corrects the email, regenerate invitation token
    if (user.status === "invited") {
      // delete any existing invitation tokens for this user
      await VerificationToken.deleteMany({
        user: user._id,
        type: "invitation",
      });

      // update the email on the user object so the new token/log uses it
      user.email = updateData.email;

      // create new invitation token
      const rawToken = generateRandomToken();
      const tokenHash = hashToken(rawToken);
      const expiresAt = getInvitationExpiresAt();

      await VerificationToken.create({
        user: user._id,
        type: "invitation",
        tokenHash,
        expiresAt,
      });

      const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
      const invitationLink = `${clientUrl}/accept-invitation/${rawToken}`;
      console.log(
        `[INVITATION] Invitation re-sent to ${user.email}:
  Link: ${invitationLink}
  Expires: ${expiresAt.toISOString()}`,
      );
      // remove email from updateData to avoid double-assigning below
      delete updateData.email;
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
  }).populate({
    path: "roles",
    populate: {
      path: "permissions",
    },
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

import User from "../users/user.model.js";
import RefreshToken from "./refreshToken.model.js";
import VerificationToken from "./verificationToken.model.js";
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiresAt,
} from "../../core/utils/jwt.js";
import { generateRandomToken, hashToken } from "../../core/utils/token.js";
import UnauthorizedError from "../../core/errors/UnauthorizedError.js";
import ValidationError from "../../core/errors/ValidationError.js";
import NotFoundError from "../../core/errors/NotFoundError.js";

// Verify user email address using verification token.
const verifyEmailService = async (token) => {
  const tokenHash = hashToken(token);

  const verificationToken = await VerificationToken.findOne({
    tokenHash,
    type: "email_verification",
  });

  if (!verificationToken) {
    throw new ValidationError("Invalid verification token.");
  }

  if (verificationToken.expiresAt < new Date()) {
    throw new ValidationError("Verification token has expired.");
  }

  if (verificationToken.usedAt) {
    throw new ValidationError("Verification token has already been used.");
  }

  const user = await User.findById(verificationToken.user);

  if (!user || user.deletedAt) {
    throw new NotFoundError("User not found.");
  }

  user.emailVerified = true;
  await user.save();

  await VerificationToken.deleteOne({ _id: verificationToken._id });

  const userObj = user.toObject();
  delete userObj.password;

  return userObj;
};

// Authenticate user and issue access & refresh tokens.
const loginService = async ({
  email,
  password,
  deviceInfo,
  ipAddress,
  userAgent,
}) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new UnauthorizedError("Invalid email or password.");
  }

  if (user.deletedAt) {
    throw new UnauthorizedError("Account has been deleted.");
  }

  if (user.status === "inactive") {
    throw new UnauthorizedError("Account is inactive.");
  }

  if (!user.emailVerified) {
    throw new UnauthorizedError(
      "Please verify your email address before logging in.",
    );
  }

  const isPasswordValid = await user.comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new UnauthorizedError("Invalid email or password.");
  }

  const accessToken = generateAccessToken({
    id: user._id,
    email: user.email,
  });

  const refreshToken = generateRefreshToken({
    id: user._id,
  });

  const refreshTokenHash = hashToken(refreshToken);

  const expiresAt = getRefreshTokenExpiresAt();

  await RefreshToken.create({
    user: user._id,
    tokenHash: refreshTokenHash,
    expiresAt,
    deviceInfo: deviceInfo || null,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  });

  const userObj = user.toObject();
  delete userObj.password;

  return {
    user: userObj,
    accessToken,
    refreshToken,
  };
};

// Refresh access token using a valid refresh token.
const refreshAccessTokenService = async (refreshToken) => {
  if (!refreshToken) {
    throw new UnauthorizedError("Refresh token is required.");
  }

  const refreshTokenHash = hashToken(refreshToken);

  const refreshTokenDoc = await RefreshToken.findOne({
    tokenHash: refreshTokenHash,
  });

  if (!refreshTokenDoc) {
    throw new UnauthorizedError("Invalid refresh token.");
  }

  if (refreshTokenDoc.revokedAt) {
    throw new UnauthorizedError("Refresh token has been revoked.");
  }

  if (refreshTokenDoc.expiresAt < new Date()) {
    throw new UnauthorizedError("Refresh token has expired.");
  }

  const user = await User.findOne({
    _id: refreshTokenDoc.user,
    deletedAt: null,
  });

  if (!user || user.status === "inactive") {
    throw new UnauthorizedError("User is inactive or not found.");
  }

  refreshTokenDoc.lastUsedAt = new Date();
  await refreshTokenDoc.save();

  const newAccessToken = generateAccessToken({
    id: user._id,
    email: user.email,
  });

  return {
    accessToken: newAccessToken,
  };
};

// Revoke refresh token on logout.
const logoutService = async (refreshToken) => {
  if (!refreshToken) {
    return;
  }
  const refreshTokenHash = hashToken(refreshToken);

  const refreshTokenDoc = await RefreshToken.findOne({
    tokenHash: refreshTokenHash,
  });

  if (refreshTokenDoc) {
    refreshTokenDoc.revokedAt = new Date();
    await refreshTokenDoc.save();
  }
};

// Send password reset token if user exists.
const forgotPasswordService = async (email) => {
  const user = await User.findOne({
    email,
    deletedAt: null,
    status: "active",
  });

  if (user) {
    const rawResetToken = generateRandomToken();
    const tokenHash = hashToken(rawResetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await VerificationToken.create({
      user: user._id,
      type: "password_reset",
      tokenHash,
      expiresAt,
    });

    console.log(
      `[PASSWORD RESET] Sent password reset token to ${user.email}: ${rawResetToken}`,
    );
  }

  return {
    message:
      "If an account with that email exists, a password reset link has been sent.",
  };
};

// Reset user password with verification token.
const resetPasswordService = async (token, newPassword) => {
  const tokenHash = hashToken(token);

  const verificationToken = await VerificationToken.findOne({
    tokenHash,
    type: "password_reset",
  });

  if (!verificationToken) {
    throw new ValidationError("Invalid password reset token.");
  }

  if (verificationToken.expiresAt < new Date()) {
    throw new ValidationError("Password reset token has expired.");
  }

  if (verificationToken.usedAt) {
    throw new ValidationError("Password reset token has already been used.");
  }

  const user = await User.findOne({
    _id: verificationToken.user,
    deletedAt: null,
  });

  if (!user) {
    throw new NotFoundError("User not found.");
  }

  user.password = newPassword;
  await user.save();

  await VerificationToken.deleteOne({ _id: verificationToken._id });

  // Revoke all refresh tokens for that user
  await RefreshToken.updateMany(
    { user: user._id, revokedAt: null },
    { revokedAt: new Date() },
  );

  return {
    message: "Password has been reset successfully.",
  };
};

export {
  verifyEmailService,
  loginService,
  refreshAccessTokenService,
  logoutService,
  forgotPasswordService,
  resetPasswordService,
};

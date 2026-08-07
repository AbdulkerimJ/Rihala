import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import {
  loginService,
  resetPasswordService,
  acceptInvitationService,
} from "../src/modules/auth/auth.service.js";

import User from "../src/modules/users/user.model.js";
import VerificationToken from "../src/modules/auth/verificationToken.model.js";
import UnauthorizedError from "../src/core/errors/UnauthorizedError.js";
import NotFoundError from "../src/core/errors/NotFoundError.js";
import ValidationError from "../src/core/errors/ValidationError.js";
import { hashToken } from "../src/core/utils/token.js";

test("Auth RBAC test suite", async (t) => {
  await t.test("Setup database connection", async () => {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not set in .env");
    }
    await mongoose.connect(process.env.MONGODB_URI, { dbName: "rihala_test_auth_rbac" });
    await User.createCollection();
    await VerificationToken.createCollection();
  });

  await t.test("loginService - invited user cannot log in", async () => {
    await User.deleteMany({});
    await User.create({
      name: "Invited User",
      email: "invited@test.local",
      status: "invited",
      emailVerified: false,
    });

    await assert.rejects(
      () => loginService({ email: "invited@test.local", password: "any" }),
      UnauthorizedError,
      /Please accept your invitation before logging in/
    );
  });

  await t.test("loginService - inactive user cannot log in", async () => {
    await User.deleteMany({});
    await User.create({
      name: "Inactive User",
      email: "inactive@test.local",
      status: "inactive",
      emailVerified: true,
      password: "password123",
    });

    await assert.rejects(
      () => loginService({ email: "inactive@test.local", password: "password123" }),
      UnauthorizedError,
      /Account is inactive/
    );
  });

  await t.test("loginService - deleted user cannot log in", async () => {
    await User.deleteMany({});
    await User.create({
      name: "Deleted User",
      email: "deleted@test.local",
      status: "active",
      emailVerified: true,
      password: "password123",
      deletedAt: new Date(),
    });

    await assert.rejects(
      () => loginService({ email: "deleted@test.local", password: "password123" }),
      UnauthorizedError,
      /Account has been deleted/
    );
  });

  await t.test("resetPasswordService - inactive user cannot use token", async () => {
    await User.deleteMany({});
    await VerificationToken.deleteMany({});
    
    const user = await User.create({
      name: "Inactive User",
      email: "inactive2@test.local",
      status: "inactive",
      emailVerified: true,
      password: "password123",
    });

    const token = "dummy-reset-token";
    const tokenHash = hashToken(token);

    await VerificationToken.create({
      user: user._id,
      type: "password_reset",
      tokenHash,
      expiresAt: new Date(Date.now() + 10000),
    });

    await assert.rejects(
      () => resetPasswordService(token, "newpassword"),
      NotFoundError,
      /User not found/
    );
  });

  await t.test("acceptInvitationService - deleted invited user cannot accept", async () => {
    await User.deleteMany({});
    await VerificationToken.deleteMany({});
    
    const user = await User.create({
      name: "Deleted Invited",
      email: "deleted-invited@test.local",
      status: "invited",
      emailVerified: false,
      deletedAt: new Date(),
    });

    const token = "dummy-invite-token";
    const tokenHash = hashToken(token);
    const code = "1234";
    const codeHash = hashToken(code);

    await VerificationToken.create({
      user: user._id,
      type: "invitation",
      tokenHash,
      codeHash,
      expiresAt: new Date(Date.now() + 10000),
    });

    await assert.rejects(
      () => acceptInvitationService(token, code, "newpassword"),
      NotFoundError,
      /User not found/
    );
  });

  await t.test("acceptInvitationService - expired token rejected", async () => {
    await User.deleteMany({});
    await VerificationToken.deleteMany({});
    
    const user = await User.create({
      name: "Invited User",
      email: "invited2@test.local",
      status: "invited",
      emailVerified: false,
    });

    const token = "dummy-invite-token-expired";
    const tokenHash = hashToken(token);

    await VerificationToken.create({
      user: user._id,
      type: "invitation",
      tokenHash,
      expiresAt: new Date(Date.now() - 10000), // Expired
    });

    await assert.rejects(
      () => acceptInvitationService(token, "1234", "newpassword"),
      ValidationError,
      /This invitation link has expired/
    );
  });

  await t.test("acceptInvitationService - max code attempts locks token", async () => {
    await User.deleteMany({});
    await VerificationToken.deleteMany({});
    
    const user = await User.create({
      name: "Invited User 3",
      email: "invited3@test.local",
      status: "invited",
      emailVerified: false,
    });

    const token = "dummy-invite-token-max-attempts";
    const tokenHash = hashToken(token);
    const code = "1234";
    const codeHash = hashToken(code);

    await VerificationToken.create({
      user: user._id,
      type: "invitation",
      tokenHash,
      codeHash,
      expiresAt: new Date(Date.now() + 10000),
      codeAttempts: Number(process.env.INVITATION_CODE_MAX_ATTEMPTS || 5),
    });

    await assert.rejects(
      () => acceptInvitationService(token, "0000", "newpassword"),
      ValidationError,
      /Maximum invitation code attempts reached/
    );
  });

  await t.test("Teardown database connection", async () => {
    await mongoose.disconnect();
  });
});

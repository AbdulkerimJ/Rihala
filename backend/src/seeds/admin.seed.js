import "dotenv/config";
import mongoose from "mongoose";
import connectDatabase from "../core/database/mongodb.js";
import User from "../modules/users/user.model.js";
import Role from "../modules/roles/role.model.js";
import Permission from "../modules/permissions/permission.model.js";

// All system-level permissions
const ALL_PERMISSIONS = [
  "users.read",
  "users.create",
  "users.update",
  "users.delete",
  "users.restore",
  "users.assign-role",

  "roles.read",
  "roles.create",
  "roles.update",
  "roles.delete",
  "roles.assign-permission",

  "permissions.read",
];

const ADMIN_ROLE_NAME = "Admin";

const seedAdmin = async () => {
  try {
    const adminName = process.env.ADMIN_NAME || "Admin User";
    const adminEmail = process.env.ADMIN_EMAIL || "kerimewa@gmail.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "123456";

    console.log("Connecting to database...");
    await connectDatabase();

    // ── Step 1: Upsert all permissions ──────────────────────────────────────
    console.log("Seeding permissions...");

    const permissionDocs = await Promise.all(
      ALL_PERMISSIONS.map((name) =>
        Permission.findOneAndUpdate(
          { name },
          { name },
          { upsert: true, new: true },
        ),
      ),
    );

    console.log(`Seeded ${permissionDocs.length} permissions.`);

    // ── Step 2: Upsert Admin system role with all permissions ────────────────
    console.log("Seeding Admin role...");

    const permissionIds = permissionDocs.map((p) => p._id);

    const adminRole = await Role.findOneAndUpdate(
      { name: ADMIN_ROLE_NAME },
      {
        name: ADMIN_ROLE_NAME,
        permissions: permissionIds,
        isSystemRole: true,
      },
      { upsert: true, new: true },
    );

    console.log(`Admin role seeded with ${permissionIds.length} permissions.`);

    // ── Step 3: Create or update the admin user ──────────────────────────────
    console.log("Seeding admin user...");

    const existingAdmin = await User.findOne({
      email: adminEmail.toLowerCase(),
    });

    if (existingAdmin) {
      existingAdmin.emailVerified = true;
      existingAdmin.status = "active";
      existingAdmin.password = adminPassword;

      // Assign Admin role if not already assigned
      const alreadyHasAdminRole = existingAdmin.roles.some(
        (id) => id.toString() === adminRole._id.toString(),
      );

      if (!alreadyHasAdminRole) {
        existingAdmin.roles.push(adminRole._id);
      }

      await existingAdmin.save();
      console.log(`Admin user "${adminEmail}" updated successfully.`);
    } else {
      await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        emailVerified: true,
        status: "active",
        roles: [adminRole._id],
      });
      console.log(`Admin user "${adminEmail}" created successfully!`);
    }

    console.log("Seed completed successfully.");
  } catch (error) {
    console.error("Error seeding:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Database connection closed.");
  }
};

seedAdmin();

import "dotenv/config";
import mongoose from "mongoose";
import connectDatabase from "../core/database/mongodb.js";
import User from "../modules/users/user.model.js";
import Role from "../modules/roles/role.model.js";
import Permission from "../modules/permissions/permission.model.js";

// All system-level permissions
const ALL_PERMISSIONS = [
  { name: "users.read", description: "View all users" },
  { name: "users.create", description: "Create a new user" },
  { name: "users.update", description: "Update user details" },
  { name: "users.delete", description: "Delete a user" },
  { name: "users.restore", description: "Restore a deleted user" },
  { name: "users.assign-role", description: "Assign roles to a user" },

  { name: "roles.read", description: "View all roles" },
  { name: "roles.create", description: "Create a new role" },
  { name: "roles.update", description: "Update role details" },
  { name: "roles.delete", description: "Delete a role" },
  {
    name: "roles.assign-permission",
    description: "Assign permissions to a role",
  },

  { name: "permissions.read", description: "View all permissions" },

  { name: "expenses.read", description: "View expenses" },
  { name: "expenses.create", description: "Create expenses" },
  { name: "expenses.update", description: "Update expenses" },
  { name: "expenses.delete", description: "Delete expenses" },

  // Customer module permissions
  { name: "customers.read", description: "View customers" },
  { name: "customers.create", description: "Create customers" },
  { name: "customers.update", description: "Update customers" },

  // Order module permissions
  { name: "orders.read", description: "View orders" },
  { name: "orders.create", description: "Create orders" },
  { name: "orders.update", description: "Update orders" },

  // Employee module permissions
  { name: "employees.read", description: "View employees" },
  { name: "employees.create", description: "Create employees" },
  { name: "employees.update", description: "Update employees" },

  // Employee rate module permissions
  { name: "employeeRates.read", description: "View employee rates" },
  { name: "employeeRates.create", description: "Create employee rates" },
  { name: "employeeRates.update", description: "Update employee rates" },

  // Attendance module permissions
  { name: "attendances.read", description: "View attendances" },
  { name: "attendances.create", description: "Create attendances" },
  { name: "attendances.update", description: "Update attendances" },
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
      ALL_PERMISSIONS.map((perm) =>
        Permission.findOneAndUpdate(
          { name: perm.name },
          { name: perm.name, description: perm.description },
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

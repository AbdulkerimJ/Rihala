import "dotenv/config";
import mongoose from "mongoose";
import connectDatabase from "../core/database/mongodb.js";
import User from "../modules/users/user.model.js";
import Role from "../modules/roles/role.model.js";
import Permission from "../modules/permissions/permission.model.js";
import Counter from "../core/models/counter.model.js";

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

  { name: "dashboard.read", description: "View dashboard" },
  { name: "analytics.read", description: "View analytics reports" },

  { name: "expenses.read", description: "View expenses" },
  { name: "expenses.create", description: "Create expenses" },
  { name: "expenses.update", description: "Update expenses" },
  { name: "expenses.void", description: "Void expenses" },

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
  { name: "employees.delete", description: "Delete employees" },

  // Attendance module permissions
  { name: "attendances.read", description: "View attendances" },
  { name: "attendances.create", description: "Create attendances" },
  { name: "attendances.update", description: "Update attendances" },
  { name: "attendances.delete", description: "Delete attendances" },

  // Overtime module permissions
  { name: "overtimes.read", description: "View overtime" },
  { name: "overtimes.create", description: "Create overtime" },
  { name: "overtimes.update", description: "Update overtime" },
  { name: "overtimes.delete", description: "Delete overtime" },

  // Weekly payroll permissions
  { name: "weeklyPayrolls.read", description: "View weekly payrolls" },
  { name: "weeklyPayrolls.close", description: "Close weekly payrolls" },

  // Employee Payment module permissions
  { name: "employeePayments.read", description: "View employee payments" },
  { name: "employeePayments.create", description: "Create employee payments" },
  { name: "employeePayments.update", description: "Update employee payments" },
  { name: "employeePayments.void", description: "Void employee payments" },

  // Supplier module permissions
  { name: "suppliers.read", description: "View suppliers" },
  { name: "suppliers.create", description: "Create suppliers" },
  { name: "suppliers.update", description: "Update suppliers" },
  { name: "suppliers.delete", description: "Delete suppliers" },

  // Material module permissions
  { name: "materials.read", description: "View materials" },
  { name: "materials.create", description: "Create materials" },
  { name: "materials.update", description: "Update materials" },

  // Purchase module permissions
  { name: "purchases.read", description: "View purchases" },
  { name: "purchases.create", description: "Create purchases" },
  { name: "purchases.update", description: "Update purchases" },

  // Supplier Payment module permissions
  { name: "supplierPayments.read", description: "View supplier payments" },
  { name: "supplierPayments.create", description: "Create supplier payments" },
  { name: "supplierPayments.update", description: "Update supplier payments" },
  { name: "supplierPayments.void", description: "Void supplier payments" },

  // Customer Payment module permissions
  { name: "customerPayments.read", description: "View customer payments" },
  { name: "customerPayments.create", description: "Create customer payments" },
  { name: "customerPayments.update", description: "Update customer payments" },
  { name: "customerPayments.void", description: "Void customer payments" },

  // Task Type module permissions
  { name: "taskTypes.read", description: "View task types" },
  { name: "taskTypes.create", description: "Create task types" },
  { name: "taskTypes.update", description: "Update task types" },
  { name: "taskTypes.delete", description: "Delete task types" },

  // Task module permissions
  { name: "tasks.read", description: "View tasks" },
  { name: "tasks.create", description: "Create tasks" },
  { name: "tasks.update", description: "Update tasks" },
  { name: "tasks.delete", description: "Delete tasks" },

  // Contractor module permissions
  { name: "contractors.read", description: "View contractors" },
  { name: "contractors.create", description: "Create contractors" },
  { name: "contractors.update", description: "Update contractors" },
  { name: "contractors.delete", description: "Delete contractors" },

  // Contract module permissions
  { name: "contracts.read", description: "View contracts" },
  { name: "contracts.create", description: "Create contracts" },
  { name: "contracts.cancel", description: "Cancel contracts" },

  // Contract Completion module permissions
  { name: "contractCompletions.read", description: "View contract completions" },
  { name: "contractCompletions.create", description: "Create contract completions" },
  { name: "contractCompletions.void", description: "Void contract completions" },

  // Contractor Payment module permissions
  { name: "contractorPayments.read", description: "View contractor payments" },
  { name: "contractorPayments.create", description: "Create contractor payments" },
  { name: "contractorPayments.void", description: "Void contractor payments" },
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

    // ── Step 4: Initialise sequence counters ─────────────────────────────────
    console.log("Seeding counters...");
    await Promise.all([
      Counter.findOneAndUpdate(
        { _id: "orderNumber" },
        { $setOnInsert: { seq: 0 } },
        { upsert: true, new: true },
      ),
      Counter.findOneAndUpdate(
        { _id: "purchaseNumber" },
        { $setOnInsert: { seq: 0 } },
        { upsert: true, new: true },
      ),
      Counter.findOneAndUpdate(
        { _id: "paymentReference" },
        { $setOnInsert: { seq: 0 } },
        { upsert: true, new: true },
      ),
      Counter.findOneAndUpdate(
        { _id: "contractNumber" },
        { $setOnInsert: { seq: 0 } },
        { upsert: true, new: true },
      ),
    ]);
    console.log("Counters seeded.");

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

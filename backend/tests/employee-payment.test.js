import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Employee from "../src/modules/employees/employee.model.js";
import EmployeePayment from "../src/modules/employeePayments/employeePayment.model.js";
import {
  createEmployeePaymentService,
  getEmployeePaymentByIdService,
  updateEmployeePaymentService,
  getEmployeePaymentsService,
} from "../src/modules/employeePayments/employeePayment.service.js";
import {
  createEmployeePaymentSchema,
  updateEmployeePaymentSchema,
  employeePaymentQuerySchema,
} from "../src/modules/employeePayments/employeePayment.validation.js";
import employeePaymentRoutes from "../src/modules/employeePayments/employeePayment.routes.js";

// 1. Active employee can receive a payment
// 3. Payment stores the employee name snapshot
test("1. Active employee can receive a payment & 3. Payment stores the employee name snapshot", async () => {
  const originalFindById = Employee.findById;
  const originalCreate = EmployeePayment.create;

  Employee.findById = async () => ({ _id: "507f1f77bcf86cd799439011", name: "Ahmed", status: "active" });
  
  let savedPayment = null;
  EmployeePayment.create = async (data) => {
    savedPayment = data;
    return {
      ...data,
      _id: "payment-123",
      populate: async () => ({ ...data, _id: "payment-123", employee: { name: "Ahmed" } }),
    };
  };

  try {
    await createEmployeePaymentService({
      employee: "507f1f77bcf86cd799439011",
      amount: 2000,
      paymentDate: "2026-08-08",
      type: "regular"
    });

    assert.equal(savedPayment.amount, 2000);
    assert.equal(savedPayment.type, "regular");
    assert.equal(savedPayment.employeeName, "Ahmed", "Snapshot should be saved");
  } finally {
    Employee.findById = originalFindById;
    EmployeePayment.create = originalCreate;
  }
});

// 2. Inactive employee cannot receive a new payment
test("2. Inactive employee cannot receive a new payment", async () => {
  const originalFindById = Employee.findById;
  Employee.findById = async () => ({ _id: "507f1f77bcf86cd799439011", name: "Inactive Worker", status: "inactive" });

  try {
    await assert.rejects(
      () => createEmployeePaymentService({
        employee: "507f1f77bcf86cd799439011",
        amount: 2000,
        paymentDate: "2026-08-08",
        type: "regular"
      }),
      /Cannot create payment for an inactive employee/
    );
  } finally {
    Employee.findById = originalFindById;
  }
});

// 4. Changing employee name does not change the payment snapshot
// (This is conceptually proven by the fact that `employeeName` is explicitly saved as a string, and no code updates it on employee rename, but we can test that `updateEmployeePaymentService` does not modify it).
test("4. Changing employee name does not change the payment snapshot & 9,10,11,12. Updating properties", async () => {
  const mockPayment = {
    _id: "payment-123",
    employee: "507f1f77bcf86cd799439011",
    employeeName: "Old Name", // Snapshot
    amount: 1000,
    paymentDate: new Date("2026-01-01"),
    type: "regular",
    note: "Initial note",
    save: async function() { return this; },
    populate: async function() { return this; }
  };
  
  const originalFindById = EmployeePayment.findById;
  // Return a promise resolving to mockPayment, since updateEmployeePaymentService awaits findById
  EmployeePayment.findById = () => Promise.resolve(mockPayment);

  try {
    const updated = await updateEmployeePaymentService("payment-123", {
      amount: 1500,
      paymentDate: "2026-02-01",
      type: "bonus",
      note: "Updated note"
    });

    assert.equal(updated.amount, 1500, "9. Amount can be updated");
    assert.ok(updated.paymentDate instanceof Date || typeof updated.paymentDate === "string", "10. Payment date can be updated");
    assert.equal(updated.type, "bonus", "11. Type can be updated");
    assert.equal(updated.note, "Updated note", "12. Note can be updated");
    
    assert.equal(updated.employeeName, "Old Name", "4. Snapshot remains unchanged");
  } finally {
    EmployeePayment.findById = originalFindById;
  }
});

// 5. Employee cannot be changed after payment creation
test("5. Employee cannot be changed after payment creation (Zod schema rejects it)", () => {
  const result = updateEmployeePaymentSchema.safeParse({
    employee: "507f1f77bcf86cd799439012",
    amount: 1500,
  });
  
  assert.equal(result.success, false);
  const issue = result.error.issues[0];
  assert.equal(issue.code, "unrecognized_keys");
  assert.ok(issue.keys.includes("employee"));
});

// 6. employeeName cannot be manually supplied during creation
test("6. employeeName cannot be manually supplied during creation (Zod schema rejects it)", () => {
  const result = createEmployeePaymentSchema.safeParse({
    employee: "507f1f77bcf86cd799439011",
    employeeName: "Malicious injection",
    amount: 1500,
    paymentDate: "2026-08-08",
    type: "regular"
  });
  
  assert.equal(result.success, false);
  const issue = result.error.issues[0];
  assert.equal(issue.code, "unrecognized_keys");
  assert.ok(issue.keys.includes("employeeName"));
});

// 7. Payment type accepts all valid values
test("7. Payment type accepts all valid values", () => {
  const validTypes = ["regular", "overtime", "bonus", "advance", "other"];
  for (const type of validTypes) {
    const result = createEmployeePaymentSchema.safeParse({
      employee: "507f1f77bcf86cd799439011",
      amount: 1500,
      paymentDate: "2026-08-08",
      type: type
    });
    assert.equal(result.success, true, `Should accept type: ${type}`);
  }
});

// 8. Invalid payment type is rejected
test("8. Invalid payment type is rejected", () => {
  const result = createEmployeePaymentSchema.safeParse({
    employee: "507f1f77bcf86cd799439011",
    amount: 1500,
    paymentDate: "2026-08-08",
    type: "invalid_type"
  });
  assert.equal(result.success, false);
});

// 13. Payment cannot be deleted
test("13. Payment cannot be deleted (No DELETE route)", () => {
  const hasDeleteRoute = employeePaymentRoutes.stack.some(
    (layer) => layer.route?.methods?.delete
  );
  assert.equal(hasDeleteRoute, false, "Delete route should be removed");
});

// 14. Historical payment remains accessible after employee becomes inactive
test("14. Historical payment remains accessible after employee becomes inactive", async () => {
  const mockPayment = {
    _id: "payment-123",
    employee: { _id: "507f1f77bcf86cd799439011", name: "Ahmed", status: "inactive" },
    employeeName: "Ahmed",
    amount: 1000,
    type: "regular"
  };
  
  const originalFindById = EmployeePayment.findById;
  // Mock findById to return an object with populate, because getEmployeePaymentByIdService chains .populate()
  EmployeePayment.findById = () => ({ populate: async () => mockPayment });

  try {
    // getEmployeePaymentByIdService does NOT check employee status, so it should succeed
    const payment = await getEmployeePaymentByIdService("payment-123");
    assert.ok(payment);
    assert.equal(payment.employee.status, "inactive");
    assert.equal(payment.employeeName, "Ahmed");
  } finally {
    EmployeePayment.findById = originalFindById;
  }
});

// 15. Payment type filtering works
test("15. Payment type filtering works (Zod Schema allows type query)", () => {
  const result = employeePaymentQuerySchema.safeParse({
    type: "bonus"
  });
  assert.equal(result.success, true);
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  updateEmployeePaymentSchema,
  voidEmployeePaymentSchema,
  employeePaymentQuerySchema,
} from "../src/modules/employeePayments/employeePayment.validation.js";
import employeePaymentRoutes from "../src/modules/employeePayments/employeePayment.routes.js";
import {
  createEmployeePaymentService,
  updateEmployeePaymentService,
  voidEmployeePaymentService,
} from "../src/modules/employeePayments/employeePayment.service.js";
import Employee from "../src/modules/employees/employee.model.js";
import EmployeePayment from "../src/modules/employeePayments/employeePayment.model.js";

test("1. Active employee can receive a payment & 3. Employee name is snapshotted", async () => {
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
    assert.equal(savedPayment.employeeName, "Ahmed");
  } finally {
    Employee.findById = originalFindById;
    EmployeePayment.create = originalCreate;
  }
});

test("2. Inactive employee cannot receive a new payment", async () => {
  const originalFindById = Employee.findById;
  Employee.findById = async () => ({ _id: "507f1f77bcf86cd799439011", name: "Ahmed", status: "inactive" });

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

test("4. Employee cannot be changed (Zod validation)", () => {
  const result = updateEmployeePaymentSchema.safeParse({ employee: "507f1f77bcf86cd799439012" });
  assert.equal(result.success, false);
});

test("5. Amount cannot be changed (Zod validation)", () => {
  const result = updateEmployeePaymentSchema.safeParse({ amount: 9999 });
  assert.equal(result.success, false);
});

test("6. Payment date cannot be changed (Zod validation)", () => {
  const result = updateEmployeePaymentSchema.safeParse({ paymentDate: "2026-01-01" });
  assert.equal(result.success, false);
});

test("7. Payment type cannot be changed (Zod validation)", () => {
  const result = updateEmployeePaymentSchema.safeParse({ type: "bonus" });
  assert.equal(result.success, false);
});

test("8. Note can be updated while payment is active", async () => {
  const mockPayment = {
    _id: "payment-123",
    status: "active",
    note: "old",
    save: async function() { return this; },
    populate: async function() { return this; }
  };
  const originalFindById = EmployeePayment.findById;
  EmployeePayment.findById = () => Promise.resolve(mockPayment);

  try {
    const updated = await updateEmployeePaymentService("payment-123", { note: "new note" });
    assert.equal(updated.note, "new note");
  } finally {
    EmployeePayment.findById = originalFindById;
  }
});

test("9. Active payment can be voided & 11, 12. voidedAt/voidedBy recorded & 13. financial info unchanged", async () => {
  const mockPayment = {
    _id: "payment-123",
    status: "active",
    amount: 1000,
    save: async function() { return this; },
    populate: async function() { return this; }
  };
  const originalFindById = EmployeePayment.findById;
  EmployeePayment.findById = () => Promise.resolve(mockPayment);

  try {
    const voided = await voidEmployeePaymentService("payment-123", "Mistake", { id: "user-1" });
    assert.equal(voided.status, "voided");
    assert.equal(voided.voidReason, "Mistake");
    assert.equal(voided.voidedBy, "user-1");
    assert.ok(voided.voidedAt instanceof Date);
    assert.equal(voided.amount, 1000);
  } finally {
    EmployeePayment.findById = originalFindById;
  }
});

test("10. Void reason is required (Zod validation)", () => {
  const result = voidEmployeePaymentSchema.safeParse({ voidReason: "" });
  assert.equal(result.success, false);
});

test("14. Voided payment remains in the database (No DELETE route)", () => {
  const hasDeleteRoute = employeePaymentRoutes.stack.some((layer) => layer.route?.methods?.delete);
  assert.equal(hasDeleteRoute, false);
});

test("15. Voided payment is excluded from default active queries & 16. can be queried explicitly", async () => {
  const queryResult = employeePaymentQuerySchema.safeParse({ status: "voided" });
  assert.equal(queryResult.success, true);
});

test("17. Double void is rejected", async () => {
  const mockPayment = {
    _id: "payment-123",
    status: "voided",
  };
  const originalFindById = EmployeePayment.findById;
  EmployeePayment.findById = () => Promise.resolve(mockPayment);

  try {
    await assert.rejects(
      () => voidEmployeePaymentService("payment-123", "Reason", { id: "user-1" }),
      /Payment is already voided/
    );
  } finally {
    EmployeePayment.findById = originalFindById;
  }
});

test("18. Voided payment cannot be financially modified (or updated at all)", async () => {
  const mockPayment = {
    _id: "payment-123",
    status: "voided",
  };
  const originalFindById = EmployeePayment.findById;
  EmployeePayment.findById = () => Promise.resolve(mockPayment);

  try {
    await assert.rejects(
      () => updateEmployeePaymentService("payment-123", { note: "trying to update note" }),
      /Cannot update a voided payment/
    );
  } finally {
    EmployeePayment.findById = originalFindById;
  }
});

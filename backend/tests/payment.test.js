import test from "node:test";
import assert from "node:assert/strict";
import Employee from "../src/modules/employees/employee.model.js";
import Payment from "../src/modules/payments/payment.model.js";
import {
  createPaymentService,
  deletePaymentService,
  getPaymentByIdService,
  updatePaymentService,
} from "../src/modules/payments/payment.service.js";
import {
  createPaymentSchema,
  updatePaymentSchema,
  paymentQuerySchema,
} from "../src/modules/payments/payment.validation.js";
import paymentRoutes from "../src/modules/payments/payment.routes.js";

// ── Validation: createPaymentSchema ─────────────────────────────────────────

test("createPaymentSchema accepts a valid payment payload", () => {
  const result = createPaymentSchema.safeParse({
    employee: "507f1f77bcf86cd799439011",
    amount: 2000,
    paymentDate: "2026-08-08",
    note: "Advance",
  });

  assert.equal(result.success, true);
});

test("createPaymentSchema accepts a payload without note", () => {
  const result = createPaymentSchema.safeParse({
    employee: "507f1f77bcf86cd799439011",
    amount: 500,
    paymentDate: "2026-08-08",
  });

  assert.equal(result.success, true);
});

test("createPaymentSchema rejects an invalid employee id", () => {
  const result = createPaymentSchema.safeParse({
    employee: "invalid-id",
    amount: 2000,
    paymentDate: "2026-08-08",
  });

  assert.equal(result.success, false);
});

test("createPaymentSchema rejects missing employee", () => {
  const result = createPaymentSchema.safeParse({
    amount: 2000,
    paymentDate: "2026-08-08",
  });

  assert.equal(result.success, false);
});

test("createPaymentSchema rejects zero amount", () => {
  const result = createPaymentSchema.safeParse({
    employee: "507f1f77bcf86cd799439011",
    amount: 0,
    paymentDate: "2026-08-08",
  });

  assert.equal(result.success, false);
});

test("createPaymentSchema rejects negative amount", () => {
  const result = createPaymentSchema.safeParse({
    employee: "507f1f77bcf86cd799439011",
    amount: -500,
    paymentDate: "2026-08-08",
  });

  assert.equal(result.success, false);
});

test("createPaymentSchema accepts a large amount (no earnings cap)", () => {
  const result = createPaymentSchema.safeParse({
    employee: "507f1f77bcf86cd799439011",
    amount: 999999,
    paymentDate: "2026-08-08",
    note: "Large advance",
  });

  assert.equal(result.success, true);
});

test("createPaymentSchema rejects unknown fields", () => {
  const result = createPaymentSchema.safeParse({
    employee: "507f1f77bcf86cd799439011",
    amount: 2000,
    paymentDate: "2026-08-08",
    weeklyPayroll: "507f1f77bcf86cd799439012",
  });

  assert.equal(result.success, false);
});

// ── Validation: updatePaymentSchema ─────────────────────────────────────────

test("updatePaymentSchema accepts a valid partial update", () => {
  const result = updatePaymentSchema.safeParse({
    amount: 3000,
  });

  assert.equal(result.success, true);
});

test("updatePaymentSchema accepts updating paymentDate", () => {
  const result = updatePaymentSchema.safeParse({
    paymentDate: "2026-08-10",
  });

  assert.equal(result.success, true);
});

test("updatePaymentSchema accepts updating note", () => {
  const result = updatePaymentSchema.safeParse({
    note: "Updated note",
  });

  assert.equal(result.success, true);
});

test("updatePaymentSchema rejects empty update", () => {
  const result = updatePaymentSchema.safeParse({});

  assert.equal(result.success, false);
});

test("updatePaymentSchema rejects unknown fields", () => {
  const result = updatePaymentSchema.safeParse({
    weeklyPayroll: "507f1f77bcf86cd799439012",
  });

  assert.equal(result.success, false);
});

// ── Validation: paymentQuerySchema ──────────────────────────────────────────

test("paymentQuerySchema accepts valid query parameters", () => {
  const result = paymentQuerySchema.safeParse({
    employee: "507f1f77bcf86cd799439011",
    from: "2026-08-01",
    to: "2026-08-31",
    sort: "-paymentDate",
    page: "1",
    limit: "20",
  });

  assert.equal(result.success, true);
});

test("paymentQuerySchema rejects unknown query parameters", () => {
  const result = paymentQuerySchema.safeParse({
    weeklyPayroll: "507f1f77bcf86cd799439012",
  });

  assert.equal(result.success, false);
});

// ── Service: createPaymentService ───────────────────────────────────────────

test("createPaymentService rejects when the employee does not exist", async () => {
  const originalFindById = Employee.findById;
  Employee.findById = async () => null;

  try {
    await assert.rejects(
      () =>
        createPaymentService({
          employee: "507f1f77bcf86cd799439011",
          amount: 2000,
          paymentDate: "2026-08-08",
        }),
      /Employee not found\./,
    );
  } finally {
    Employee.findById = originalFindById;
  }
});

test("createPaymentService creates a payment for a valid employee", async () => {
  const originalFindById = Employee.findById;
  const originalCreate = Payment.create;

  Employee.findById = async () => ({ _id: "507f1f77bcf86cd799439011" });
  Payment.create = async (data) => ({
    ...data,
    _id: "payment-id-1",
    populate: async () => ({
      ...data,
      _id: "payment-id-1",
      employee: { _id: "507f1f77bcf86cd799439011", name: "Ahmed" },
    }),
  });

  try {
    const payment = await createPaymentService({
      employee: "507f1f77bcf86cd799439011",
      amount: 2000,
      paymentDate: "2026-08-08",
      note: "Advance",
    });

    assert.equal(payment.amount, 2000);
    assert.equal(payment.note, "Advance");
    assert.equal(payment.employee.name, "Ahmed");
  } finally {
    Employee.findById = originalFindById;
    Payment.create = originalCreate;
  }
});

// ── Service: getPaymentByIdService ──────────────────────────────────────────

test("getPaymentByIdService throws NotFoundError for nonexistent payment", async () => {
  const originalFindById = Payment.findById;
  Payment.findById = () => ({
    populate: async () => null,
  });

  try {
    await assert.rejects(
      () => getPaymentByIdService("507f1f77bcf86cd799439011"),
      /Payment not found\./,
    );
  } finally {
    Payment.findById = originalFindById;
  }
});

// ── Service: updatePaymentService ───────────────────────────────────────────

test("updatePaymentService throws NotFoundError for nonexistent payment", async () => {
  const originalFindById = Payment.findById;
  Payment.findById = async () => null;

  try {
    await assert.rejects(
      () =>
        updatePaymentService("507f1f77bcf86cd799439011", { amount: 3000 }),
      /Payment not found\./,
    );
  } finally {
    Payment.findById = originalFindById;
  }
});

// ── Service: deletePaymentService ───────────────────────────────────────────

test("deletePaymentService throws NotFoundError for nonexistent payment", async () => {
  const originalFindById = Payment.findById;
  Payment.findById = async () => null;

  try {
    await assert.rejects(
      () => deletePaymentService("507f1f77bcf86cd799439011"),
      /Payment not found\./,
    );
  } finally {
    Payment.findById = originalFindById;
  }
});

test("deletePaymentService deletes an existing payment", async () => {
  const originalFindById = Payment.findById;
  const originalDeleteOne = Payment.deleteOne;
  const mockPayment = {
    _id: "507f1f77bcf86cd799439011",
    amount: 2000,
    paymentDate: new Date("2026-08-08"),
  };

  Payment.findById = async () => mockPayment;
  Payment.deleteOne = async () => ({ deletedCount: 1 });

  try {
    const result = await deletePaymentService("507f1f77bcf86cd799439011");

    assert.equal(result.amount, 2000);
  } finally {
    Payment.findById = originalFindById;
    Payment.deleteOne = originalDeleteOne;
  }
});

// ── Route verification ──────────────────────────────────────────────────────

test("payment routes expose GET / endpoint", () => {
  const hasRoute = paymentRoutes.stack.some(
    (layer) => layer.route?.path === "/" && layer.route.methods.get,
  );

  assert.equal(hasRoute, true);
});

test("payment routes expose POST / endpoint", () => {
  const hasRoute = paymentRoutes.stack.some(
    (layer) => layer.route?.path === "/" && layer.route.methods.post,
  );

  assert.equal(hasRoute, true);
});

test("payment routes expose GET /:id endpoint", () => {
  const hasRoute = paymentRoutes.stack.some(
    (layer) => layer.route?.path === "/:id" && layer.route.methods.get,
  );

  assert.equal(hasRoute, true);
});

test("payment routes expose PATCH /:id endpoint", () => {
  const hasRoute = paymentRoutes.stack.some(
    (layer) => layer.route?.path === "/:id" && layer.route.methods.patch,
  );

  assert.equal(hasRoute, true);
});

test("payment routes expose DELETE /:id endpoint", () => {
  const hasRoute = paymentRoutes.stack.some(
    (layer) => layer.route?.path === "/:id" && layer.route.methods.delete,
  );

  assert.equal(hasRoute, true);
});

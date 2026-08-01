import test from "node:test";
import assert from "node:assert/strict";
import { isValidStatusTransition } from "../src/modules/orders/order.service.js";
import {
  createOrderSchema,
  updateOrderSchema,
} from "../src/modules/orders/order.validation.js";

test("allows the expected status progression for orders", () => {
  assert.equal(isValidStatusTransition("pending", "in_progress"), true);
  assert.equal(isValidStatusTransition("in_progress", "ready"), true);
  assert.equal(isValidStatusTransition("ready", "completed"), true);
  assert.equal(isValidStatusTransition("pending", "cancelled"), true);
  assert.equal(isValidStatusTransition("in_progress", "cancelled"), true);
});

test("rejects invalid order status transitions", () => {
  assert.equal(isValidStatusTransition("pending", "completed"), false);
  assert.equal(isValidStatusTransition("ready", "cancelled"), false);
  assert.equal(isValidStatusTransition("completed", "pending"), false);
  assert.equal(isValidStatusTransition("cancelled", "pending"), false);
});

test("createOrderSchema rejects unsupported fields and createdBy", () => {
  const result = createOrderSchema.safeParse({
    customer: "507f1f77bcf86cd799439011",
    createdBy: "507f1f77bcf86cd799439012",
    description: "Dining table",
    agreedAmount: 1200,
    expectedCompletionDate: "2026-10-10",
    notes: "Need a custom finish",
  });

  assert.equal(result.success, false);
});

test("updateOrderSchema rejects immutable and unsupported fields", () => {
  const result = updateOrderSchema.safeParse({
    createdBy: "507f1f77bcf86cd799439012",
    createdAt: "2026-01-01",
    status: "ready",
    description: "Updated description",
  });

  assert.equal(result.success, false);
});

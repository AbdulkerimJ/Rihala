import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateOvertimeAmount,
  createOvertimeService,
} from "../src/modules/overtimes/overtime.service.js";
import {
  createOvertimeSchema,
  updateOvertimeSchema,
} from "../src/modules/overtimes/overtime.validation.js";

test("calculateOvertimeAmount returns 500 for 500 and HALF_DAY", () => {
  assert.equal(calculateOvertimeAmount(500, "HALF_DAY"), 500);
});

test("calculateOvertimeAmount returns 1000 for 500 and FULL_DAY", () => {
  assert.equal(calculateOvertimeAmount(500, "FULL_DAY"), 1000);
});

test("createOvertimeSchema accepts a valid overtime payload", () => {
  const result = createOvertimeSchema.safeParse({
    employee: "507f1f77bcf86cd799439011",
    workDate: "2026-08-05",
    duration: "HALF_DAY",
    note: "Sunday delivery",
  });

  assert.equal(result.success, true);
});

test("createOvertimeSchema rejects invalid duration", () => {
  const result = createOvertimeSchema.safeParse({
    employee: "507f1f77bcf86cd799439011",
    workDate: "2026-08-05",
    duration: "THREE_HOURS",
    note: "Unexpected",
  });

  assert.equal(result.success, false);
});

test("createOvertimeSchema rejects dailyRate and amount", () => {
  const result = createOvertimeSchema.safeParse({
    employee: "507f1f77bcf86cd799439011",
    workDate: "2026-08-05",
    duration: "FULL_DAY",
    dailyRate: 700,
    amount: 1400,
  });

  assert.equal(result.success, false);
});

test("updateOvertimeSchema accepts duration updates", () => {
  const result = updateOvertimeSchema.safeParse({
    duration: "FULL_DAY",
  });

  assert.equal(result.success, true);
});

test("updateOvertimeSchema accepts note updates", () => {
  const result = updateOvertimeSchema.safeParse({
    note: "Updated note",
  });

  assert.equal(result.success, true);
});

test("updateOvertimeSchema rejects employee and workDate changes", () => {
  const employeeResult = updateOvertimeSchema.safeParse({
    employee: "507f1f77bcf86cd799439011",
  });
  const workDateResult = updateOvertimeSchema.safeParse({
    workDate: "2026-08-10",
  });

  assert.equal(employeeResult.success, false);
  assert.equal(workDateResult.success, false);
});

test("updateOvertimeSchema rejects dailyRate, amount, and unknown fields", () => {
  const dailyRateResult = updateOvertimeSchema.safeParse({
    dailyRate: 700,
  });
  const amountResult = updateOvertimeSchema.safeParse({
    amount: 1400,
  });
  const unknownResult = updateOvertimeSchema.safeParse({
    unexpected: true,
  });

  assert.equal(dailyRateResult.success, false);
  assert.equal(amountResult.success, false);
  assert.equal(unknownResult.success, false);
});

test("updateOvertimeSchema rejects empty updates", () => {
  const result = updateOvertimeSchema.safeParse({});

  assert.equal(result.success, false);
});

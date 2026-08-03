import test from "node:test";
import assert from "node:assert/strict";
import Employee from "../src/modules/employees/employee.model.js";
import EmployeeRate from "../src/modules/employeeRates/employeeRate.model.js";
import {
  createEmployeeRateService,
  getApplicableRateService,
} from "../src/modules/employeeRates/employeeRate.service.js";
import { createEmployeeRateSchema } from "../src/modules/employeeRates/employeeRate.validation.js";
import employeeRateRoutes from "../src/modules/employeeRates/employeeRate.routes.js";

test("createEmployeeRateSchema accepts a valid rate payload", () => {
  const result = createEmployeeRateSchema.safeParse({
    employee: "507f1f77bcf86cd799439011",
    dailyRate: 500,
    effectiveDate: "2026-09-01",
    note: "Standard daily rate",
  });

  assert.equal(result.success, true);
});

test("createEmployeeRateService rejects when the employee does not exist", async () => {
  const originalFindById = Employee.findById;
  Employee.findById = async () => null;

  try {
    await assert.rejects(
      () =>
        createEmployeeRateService({
          employee: "507f1f77bcf86cd799439011",
          dailyRate: 500,
          effectiveDate: "2026-09-01",
        }),
      /Employee not found\./,
    );
  } finally {
    Employee.findById = originalFindById;
  }
});

test("createEmployeeRateService rejects duplicate effective dates for an employee", async () => {
  const originalFindById = Employee.findById;
  const originalFindOne = EmployeeRate.findOne;
  Employee.findById = async () => ({ _id: "507f1f77bcf86cd799439011" });
  EmployeeRate.findOne = async () => ({ _id: "existing-rate" });

  try {
    await assert.rejects(
      () =>
        createEmployeeRateService({
          employee: "507f1f77bcf86cd799439011",
          dailyRate: 500,
          effectiveDate: "2026-09-01",
        }),
      /already exists/i,
    );
  } finally {
    Employee.findById = originalFindById;
    EmployeeRate.findOne = originalFindOne;
  }
});

test("createEmployeeRateSchema rejects non-positive daily rates", () => {
  const result = createEmployeeRateSchema.safeParse({
    employee: "507f1f77bcf86cd799439011",
    dailyRate: 0,
    effectiveDate: "2026-09-01",
  });

  assert.equal(result.success, false);
});

test("getApplicableRateService returns the most recent applicable rate", async () => {
  const originalFindOne = EmployeeRate.findOne;
  EmployeeRate.findOne = () => ({
    sort: () => ({
      populate: async () => ({
        dailyRate: 700,
        effectiveDate: new Date("2026-09-01"),
        employee: { name: "Ahmed" },
      }),
    }),
  });

  try {
    const rate = await getApplicableRateService(
      "507f1f77bcf86cd799439011",
      "2026-09-15",
    );

    assert.equal(rate.dailyRate, 700);
  } finally {
    EmployeeRate.findOne = originalFindOne;
  }
});

test("getApplicableRateService throws when no applicable rate exists", async () => {
  const originalFindOne = EmployeeRate.findOne;
  EmployeeRate.findOne = () => ({
    sort: () => ({
      populate: async () => null,
    }),
  });

  try {
    await assert.rejects(
      () => getApplicableRateService("507f1f77bcf86cd799439011", "2026-07-31"),
      /No applicable employee rate found/i,
    );
  } finally {
    EmployeeRate.findOne = originalFindOne;
  }
});

test("employee rate routes do not expose a patch endpoint", () => {
  const hasPatchRoute = employeeRateRoutes.stack.some(
    (layer) => layer.route?.path === "/:id" && layer.route.methods.patch,
  );

  assert.equal(hasPatchRoute, false);
});

test("employee rate routes do not expose an applicable endpoint", () => {
  const hasApplicableRoute = employeeRateRoutes.stack.some((layer) =>
    layer.route?.path?.includes("applicable"),
  );

  assert.equal(hasApplicableRoute, false);
});

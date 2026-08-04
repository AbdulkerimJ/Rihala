import express from "express";

import authenticate from "../../core/middleware/authenticate.js";
import authorize from "../../core/middleware/authorize.js";
import validate from "../../core/middleware/validate.js";
import {
  getAllWeeklyPayrollsController,
  getWeeklyPayrollByIdController,
  getCurrentPayrollCalculationController,
  closeEmployeeWeeklyPayrollController,
} from "./weeklyPayroll.controller.js";
import {
  employeeIdSchema,
  weeklyPayrollIdSchema,
  weeklyPayrollQuerySchema,
} from "./weeklyPayroll.validation.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("weeklyPayrolls.read"),
  validate(
    weeklyPayrollQuerySchema,
    "Please check the weekly payroll filters.",
    "query",
  ),
  getAllWeeklyPayrollsController,
);

router.get(
  "/employees/:employeeId/current",
  authorize("weeklyPayrolls.read"),
  validate(employeeIdSchema, "Please check the employee id.", "params"),
  getCurrentPayrollCalculationController,
);

router.post(
  "/employees/:employeeId/close",
  authorize("weeklyPayrolls.close"),
  validate(employeeIdSchema, "Please check the employee id.", "params"),
  closeEmployeeWeeklyPayrollController,
);

router.get(
  "/:id",
  authorize("weeklyPayrolls.read"),
  validate(
    weeklyPayrollIdSchema,
    "Please check the weekly payroll id.",
    "params",
  ),
  getWeeklyPayrollByIdController,
);

export default router;

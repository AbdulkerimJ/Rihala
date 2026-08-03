import express from "express";

import authenticate from "../../core/middleware/authenticate.js";
import authorize from "../../core/middleware/authorize.js";
import validate from "../../core/middleware/validate.js";
import {
  getAllEmployeesController,
  createEmployeeController,
  getEmployeeByIdController,
  updateEmployeeController,
} from "./employee.controller.js";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeIdSchema,
  employeeQuerySchema,
} from "./employee.validation.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("employees.read"),
  validate(employeeQuerySchema, "Please check the employee filters.", "query"),
  getAllEmployeesController,
);

router.post(
  "/",
  authorize("employees.create"),
  validate(createEmployeeSchema, "Please check the employee information."),
  createEmployeeController,
);

router.get(
  "/:id",
  authorize("employees.read"),
  validate(employeeIdSchema, "Please check the employee id.", "params"),
  getEmployeeByIdController,
);

router.patch(
  "/:id",
  authorize("employees.update"),
  validate(employeeIdSchema, "Please check the employee id.", "params"),
  validate(updateEmployeeSchema, "Please check the employee information."),
  updateEmployeeController,
);

export default router;

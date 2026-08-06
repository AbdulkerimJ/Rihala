import express from "express";

import authenticate from "../../core/middleware/authenticate.js";
import authorize from "../../core/middleware/authorize.js";
import validate from "../../core/middleware/validate.js";
import {
  getAllEmployeePaymentsController,
  createEmployeePaymentController,
  getEmployeePaymentByIdController,
  updateEmployeePaymentController,
} from "./employeePayment.controller.js";
import {
  createEmployeePaymentSchema,
  updateEmployeePaymentSchema,
  employeePaymentIdSchema,
  employeePaymentQuerySchema,
} from "./employeePayment.validation.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("employeePayments.read"),
  validate(employeePaymentQuerySchema, "Please check the payment filters.", "query"),
  getAllEmployeePaymentsController,
);

router.post(
  "/",
  authorize("employeePayments.create"),
  validate(createEmployeePaymentSchema, "Please check the payment information."),
  createEmployeePaymentController,
);

router.get(
  "/:id",
  authorize("employeePayments.read"),
  validate(employeePaymentIdSchema, "Please check the payment id.", "params"),
  getEmployeePaymentByIdController,
);

router.patch(
  "/:id",
  authorize("employeePayments.update"),
  validate(employeePaymentIdSchema, "Please check the payment id.", "params"),
  validate(updateEmployeePaymentSchema, "Please check the payment information."),
  updateEmployeePaymentController,
);

export default router;

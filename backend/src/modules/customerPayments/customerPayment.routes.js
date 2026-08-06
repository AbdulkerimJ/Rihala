import express from "express";

import authenticate from "../../core/middleware/authenticate.js";
import authorize from "../../core/middleware/authorize.js";
import validate from "../../core/middleware/validate.js";
import {
  getAllCustomerPaymentsController,
  createCustomerPaymentController,
  getCustomerPaymentByIdController,
  updateCustomerPaymentController,
  voidCustomerPaymentController,
} from "./customerPayment.controller.js";
import {
  createCustomerPaymentSchema,
  updateCustomerPaymentSchema,
  customerPaymentIdSchema,
  voidCustomerPaymentSchema,
  customerPaymentQuerySchema,
} from "./customerPayment.validation.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("customerPayments.read"),
  validate(customerPaymentQuerySchema, "Please check the customer payment filters.", "query"),
  getAllCustomerPaymentsController
);

router.post(
  "/",
  authorize("customerPayments.create"),
  validate(createCustomerPaymentSchema, "Please check the customer payment information."),
  createCustomerPaymentController
);

router.get(
  "/:id",
  authorize("customerPayments.read"),
  validate(customerPaymentIdSchema, "Please check the customer payment id.", "params"),
  getCustomerPaymentByIdController
);

router.patch(
  "/:id",
  authorize("customerPayments.update"),
  validate(customerPaymentIdSchema, "Please check the customer payment id.", "params"),
  validate(updateCustomerPaymentSchema, "Please check the customer payment information."),
  updateCustomerPaymentController
);

router.patch(
  "/:id/void",
  authorize("customerPayments.void"),
  validate(customerPaymentIdSchema, "Please check the customer payment id.", "params"),
  validate(voidCustomerPaymentSchema, "Please check the void reason."),
  voidCustomerPaymentController
);

export default router;

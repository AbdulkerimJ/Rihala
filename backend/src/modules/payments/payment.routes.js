import express from "express";

import authenticate from "../../core/middleware/authenticate.js";
import authorize from "../../core/middleware/authorize.js";
import validate from "../../core/middleware/validate.js";
import {
  getAllPaymentsController,
  createPaymentController,
  getPaymentByIdController,
  updatePaymentController,
  deletePaymentController,
} from "./payment.controller.js";
import {
  createPaymentSchema,
  updatePaymentSchema,
  paymentIdSchema,
  paymentQuerySchema,
} from "./payment.validation.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("payments.read"),
  validate(paymentQuerySchema, "Please check the payment filters.", "query"),
  getAllPaymentsController,
);

router.post(
  "/",
  authorize("payments.create"),
  validate(createPaymentSchema, "Please check the payment information."),
  createPaymentController,
);

router.get(
  "/:id",
  authorize("payments.read"),
  validate(paymentIdSchema, "Please check the payment id.", "params"),
  getPaymentByIdController,
);

router.patch(
  "/:id",
  authorize("payments.update"),
  validate(paymentIdSchema, "Please check the payment id.", "params"),
  validate(updatePaymentSchema, "Please check the payment information."),
  updatePaymentController,
);

router.delete(
  "/:id",
  authorize("payments.delete"),
  validate(paymentIdSchema, "Please check the payment id.", "params"),
  deletePaymentController,
);

export default router;

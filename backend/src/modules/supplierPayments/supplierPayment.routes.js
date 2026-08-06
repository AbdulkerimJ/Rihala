import express from "express";

import authenticate from "../../core/middleware/authenticate.js";
import authorize from "../../core/middleware/authorize.js";
import validate from "../../core/middleware/validate.js";
import {
  getAllSupplierPaymentsController,
  createSupplierPaymentController,
  getSupplierPaymentByIdController,
  updateSupplierPaymentController,
} from "./supplierPayment.controller.js";
import {
  createSupplierPaymentSchema,
  updateSupplierPaymentSchema,
  supplierPaymentIdSchema,
  supplierPaymentQuerySchema,
} from "./supplierPayment.validation.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("supplier_payments.read"),
  validate(supplierPaymentQuerySchema, "Please check the payment filters.", "query"),
  getAllSupplierPaymentsController,
);

router.post(
  "/",
  authorize("supplier_payments.create"),
  validate(createSupplierPaymentSchema, "Please check the payment information."),
  createSupplierPaymentController,
);

router.get(
  "/:id",
  authorize("supplier_payments.read"),
  validate(supplierPaymentIdSchema, "Please check the payment id.", "params"),
  getSupplierPaymentByIdController,
);

router.patch(
  "/:id",
  authorize("supplier_payments.update"),
  validate(supplierPaymentIdSchema, "Please check the payment id.", "params"),
  validate(updateSupplierPaymentSchema, "Please check the payment information."),
  updateSupplierPaymentController,
);

export default router;

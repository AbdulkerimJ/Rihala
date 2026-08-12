import express from "express";
import * as contractorPaymentController from "./contractorPayment.controller.js";
import { authenticate } from "../../core/middleware/authenticate.js";
import { authorize } from "../../core/middleware/authorize.js";
import { validate } from "../../core/middleware/validate.js";
import {
  createContractorPaymentSchema,
  voidContractorPaymentSchema,
  contractorPaymentIdSchema,
  contractorPaymentQuerySchema,
} from "./contractorPayment.validation.js";

const router = express.Router();

router.use(authenticate);

router
  .route("/")
  .get(
    authorize("contractorPayments.read"),
    validate(contractorPaymentQuerySchema, "query"),
    contractorPaymentController.getPayments
  )
  .post(
    authorize("contractorPayments.create"),
    validate(createContractorPaymentSchema, "body"),
    contractorPaymentController.createPayment
  );

router
  .route("/:id")
  .get(
    authorize("contractorPayments.read"),
    validate(contractorPaymentIdSchema, "params"),
    contractorPaymentController.getPaymentById
  );

router
  .route("/:id/void")
  .patch(
    authorize("contractorPayments.void"),
    validate(contractorPaymentIdSchema, "params"),
    validate(voidContractorPaymentSchema, "body"),
    contractorPaymentController.voidPayment
  );

export default router;

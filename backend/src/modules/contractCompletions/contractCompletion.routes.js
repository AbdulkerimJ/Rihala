import express from "express";
import * as contractCompletionController from "./contractCompletion.controller.js";
import { authenticate } from "../../core/middleware/authenticate.js";
import { authorize } from "../../core/middleware/authorize.js";
import { validate } from "../../core/middleware/validate.js";
import {
  createContractCompletionSchema,
  voidContractCompletionSchema,
  contractCompletionIdSchema,
  contractCompletionQuerySchema,
} from "./contractCompletion.validation.js";

const router = express.Router();

router.use(authenticate);

router
  .route("/")
  .get(
    authorize("contractCompletions.read"),
    validate(contractCompletionQuerySchema, "query"),
    contractCompletionController.getCompletions
  )
  .post(
    authorize("contractCompletions.create"),
    validate(createContractCompletionSchema, "body"),
    contractCompletionController.recordCompletion
  );

router
  .route("/:id")
  .get(
    authorize("contractCompletions.read"),
    validate(contractCompletionIdSchema, "params"),
    contractCompletionController.getCompletionById
  );

router
  .route("/:id/void")
  .patch(
    authorize("contractCompletions.void"),
    validate(contractCompletionIdSchema, "params"),
    validate(voidContractCompletionSchema, "body"),
    contractCompletionController.voidCompletion
  );

export default router;

import express from "express";
import * as contractController from "./contract.controller.js";
import authenticate from "../../core/middleware/authenticate.js";
import authorize from "../../core/middleware/authorize.js";
import validate from "../../core/middleware/validate.js";
import {
  createContractSchema,
  cancelContractSchema,
  contractIdSchema,
  contractQuerySchema,
} from "./contract.validation.js";

const router = express.Router();

router.use(authenticate);

router
  .route("/")
  .get(
    authorize("contracts.read"),
    validate(contractQuerySchema, "Invalid query parameters", "query"),
    contractController.getContracts
  )
  .post(
    authorize("contracts.create"),
    validate(createContractSchema, "Please correct the highlighted fields", "body"),
    contractController.createContract
  );

router
  .route("/:id")
  .get(
    authorize("contracts.read"),
    validate(contractIdSchema, "Invalid request parameters", "params"),
    contractController.getContractById
  );

router
  .route("/:id/cancel")
  .patch(
    authorize("contracts.cancel"),
    validate(contractIdSchema, "Invalid request parameters", "params"),
    validate(cancelContractSchema, "Please correct the highlighted fields", "body"),
    contractController.cancelContract
  );

export default router;

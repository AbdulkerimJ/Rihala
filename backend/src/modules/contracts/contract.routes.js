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
    validate(contractQuerySchema, "query"),
    contractController.getContracts
  )
  .post(
    authorize("contracts.create"),
    validate(createContractSchema, "body"),
    contractController.createContract
  );

router
  .route("/:id")
  .get(
    authorize("contracts.read"),
    validate(contractIdSchema, "params"),
    contractController.getContractById
  );

router
  .route("/:id/cancel")
  .patch(
    authorize("contracts.cancel"),
    validate(contractIdSchema, "params"),
    validate(cancelContractSchema, "body"),
    contractController.cancelContract
  );

export default router;

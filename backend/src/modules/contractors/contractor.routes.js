import express from "express";
import * as contractorController from "./contractor.controller.js";
import { authenticate } from "../../core/middleware/authenticate.js";
import { authorize } from "../../core/middleware/authorize.js";
import { validate } from "../../core/middleware/validate.js";
import {
  createContractorSchema,
  updateContractorSchema,
  contractorIdSchema,
  contractorQuerySchema,
} from "./contractor.validation.js";

const router = express.Router();

router.use(authenticate);

router
  .route("/")
  .get(
    authorize("contractors.read"),
    validate(contractorQuerySchema, "query"),
    contractorController.getContractors
  )
  .post(
    authorize("contractors.create"),
    validate(createContractorSchema, "body"),
    contractorController.createContractor
  );

router
  .route("/:id")
  .get(
    authorize("contractors.read"),
    validate(contractorIdSchema, "params"),
    contractorController.getContractorById
  )
  .patch(
    authorize("contractors.update"),
    validate(contractorIdSchema, "params"),
    validate(updateContractorSchema, "body"),
    contractorController.updateContractor
  )
  .delete(
    authorize("contractors.delete"),
    validate(contractorIdSchema, "params"),
    contractorController.deleteContractor
  );

export default router;

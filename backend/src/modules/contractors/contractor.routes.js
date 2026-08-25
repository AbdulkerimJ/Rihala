import express from "express";
import * as contractorController from "./contractor.controller.js";
import authenticate from "../../core/middleware/authenticate.js";
import authorize from "../../core/middleware/authorize.js";
import validate from "../../core/middleware/validate.js";
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
    validate(contractorQuerySchema, "Please check the contractor filters.", "query"),
    contractorController.getContractors
  )
  .post(
    authorize("contractors.create"),
    validate(createContractorSchema, "Please check the contractor information.", "body"),
    contractorController.createContractor
  );

router.get(
  "/:id/stats",
  authorize("contractors.read"),
  validate(contractorIdSchema, "Invalid contractor ID.", "params"),
  contractorController.getContractorStats
);

router
  .route("/:id")
  .get(
    authorize("contractors.read"),
    validate(contractorIdSchema, "Invalid contractor ID.", "params"),
    contractorController.getContractorById
  )
  .patch(
    authorize("contractors.update"),
    validate(contractorIdSchema, "Invalid contractor ID.", "params"),
    validate(updateContractorSchema, "Invalid contractor data.", "body"),
    contractorController.updateContractor
  )
  .delete(
    authorize("contractors.delete"),
    validate(contractorIdSchema, "Invalid contractor ID.", "params"),
    contractorController.deleteContractor
  );

export default router;

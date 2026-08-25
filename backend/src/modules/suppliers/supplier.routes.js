import express from "express";

import authenticate from "../../core/middleware/authenticate.js";
import authorize from "../../core/middleware/authorize.js";
import validate from "../../core/middleware/validate.js";
import {
  getAllSuppliersController,
  createSupplierController,
  getSupplierByIdController,
  updateSupplierController,
  softDeleteSupplierController,
} from "./supplier.controller.js";
import {
  createSupplierSchema,
  updateSupplierSchema,
  supplierIdSchema,
  supplierQuerySchema,
} from "./supplier.validation.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("suppliers.read"),
  validate(supplierQuerySchema, "Please check the supplier filters.", "query"),
  getAllSuppliersController,
);

router.post(
  "/",
  authorize("suppliers.create"),
  validate(createSupplierSchema, "Please check the supplier information."),
  createSupplierController,
);

router.get(
  "/:id",
  authorize("suppliers.read"),
  validate(supplierIdSchema, "Please check the supplier id.", "params"),
  getSupplierByIdController,
);

router.patch(
  "/:id",
  authorize("suppliers.update"),
  validate(supplierIdSchema, "Please check the supplier id.", "params"),
  validate(updateSupplierSchema, "Please check the supplier information."),
  updateSupplierController,
);

router.delete(
  "/:id",
  authorize("suppliers.delete"),
  validate(supplierIdSchema, "Please check the supplier id.", "params"),
  softDeleteSupplierController,
);

export default router;

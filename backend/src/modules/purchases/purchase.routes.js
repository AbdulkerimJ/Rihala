import express from "express";

import authenticate from "../../core/middleware/authenticate.js";
import authorize from "../../core/middleware/authorize.js";
import validate from "../../core/middleware/validate.js";
import {
  getAllPurchasesController,
  createPurchaseController,
  getPurchaseByIdController,
  updatePurchaseController,
} from "./purchase.controller.js";
import {
  createPurchaseSchema,
  updatePurchaseSchema,
  purchaseIdSchema,
  purchaseQuerySchema,
} from "./purchase.validation.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("purchases.read"),
  validate(purchaseQuerySchema, "Please check the purchase filters.", "query"),
  getAllPurchasesController,
);

router.post(
  "/",
  authorize("purchases.create"),
  validate(createPurchaseSchema, "Please check the purchase information."),
  createPurchaseController,
);

router.get(
  "/:id",
  authorize("purchases.read"),
  validate(purchaseIdSchema, "Please check the purchase id.", "params"),
  getPurchaseByIdController,
);

router.patch(
  "/:id",
  authorize("purchases.update"),
  validate(purchaseIdSchema, "Please check the purchase id.", "params"),
  validate(updatePurchaseSchema, "Please check the purchase information."),
  updatePurchaseController,
);

export default router;

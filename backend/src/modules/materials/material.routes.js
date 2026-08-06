import express from "express";

import authenticate from "../../core/middleware/authenticate.js";
import authorize from "../../core/middleware/authorize.js";
import validate from "../../core/middleware/validate.js";
import {
  getAllMaterialsController,
  createMaterialController,
  getMaterialByIdController,
  updateMaterialController,
} from "./material.controller.js";
import {
  createMaterialSchema,
  updateMaterialSchema,
  materialIdSchema,
  materialQuerySchema,
} from "./material.validation.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("materials.read"),
  validate(materialQuerySchema, "Please check the material filters.", "query"),
  getAllMaterialsController,
);

router.post(
  "/",
  authorize("materials.create"),
  validate(createMaterialSchema, "Please check the material information."),
  createMaterialController,
);

router.get(
  "/:id",
  authorize("materials.read"),
  validate(materialIdSchema, "Please check the material id.", "params"),
  getMaterialByIdController,
);

router.patch(
  "/:id",
  authorize("materials.update"),
  validate(materialIdSchema, "Please check the material id.", "params"),
  validate(updateMaterialSchema, "Please check the material information."),
  updateMaterialController,
);

export default router;

import express from "express";

import authenticate from "../../core/middleware/authenticate.js";
import authorize from "../../core/middleware/authorize.js";
import validate from "../../core/middleware/validate.js";
import {
  getAllOvertimesController,
  createOvertimeController,
  getOvertimeByIdController,
  updateOvertimeController,
} from "./overtime.controller.js";
import {
  createOvertimeSchema,
  updateOvertimeSchema,
  overtimeIdSchema,
  overtimeQuerySchema,
} from "./overtime.validation.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("overtimes.read"),
  validate(overtimeQuerySchema, "Please check the overtime filters.", "query"),
  getAllOvertimesController,
);

router.post(
  "/",
  authorize("overtimes.create"),
  validate(createOvertimeSchema, "Please check the overtime information."),
  createOvertimeController,
);

router.get(
  "/:id",
  authorize("overtimes.read"),
  validate(overtimeIdSchema, "Please check the overtime id.", "params"),
  getOvertimeByIdController,
);

router.patch(
  "/:id",
  authorize("overtimes.update"),
  validate(overtimeIdSchema, "Please check the overtime id.", "params"),
  validate(updateOvertimeSchema, "Please check the overtime information."),
  updateOvertimeController,
);

export default router;

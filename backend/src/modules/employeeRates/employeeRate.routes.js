import express from "express";

import authenticate from "../../core/middleware/authenticate.js";
import authorize from "../../core/middleware/authorize.js";
import validate from "../../core/middleware/validate.js";
import {
  getAllEmployeeRatesController,
  createEmployeeRateController,
  getEmployeeRateByIdController,
} from "./employeeRate.controller.js";
import {
  createEmployeeRateSchema,
  employeeRateIdSchema,
  employeeRateQuerySchema,
} from "./employeeRate.validation.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("employeeRates.read"),
  validate(
    employeeRateQuerySchema,
    "Please check the employee rate filters.",
    "query",
  ),
  getAllEmployeeRatesController,
);

router.post(
  "/",
  authorize("employeeRates.create"),
  validate(
    createEmployeeRateSchema,
    "Please check the employee rate information.",
  ),
  createEmployeeRateController,
);

router.get(
  "/:id",
  authorize("employeeRates.read"),
  validate(
    employeeRateIdSchema,
    "Please check the employee rate id.",
    "params",
  ),
  getEmployeeRateByIdController,
);

export default router;

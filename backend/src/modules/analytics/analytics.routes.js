import express from "express";
import authenticate from "../../core/middleware/authenticate.js";
import authorize from "../../core/middleware/authorize.js";
import validate from "../../core/middleware/validate.js";
import { getDashboardStatsController, getAnalyticsReportsController } from "./analytics.controller.js";
import { reportsQuerySchema } from "./analytics.validation.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/dashboard",
  authorize("dashboard.read"),
  getDashboardStatsController
);

router.get(
  "/reports",
  authorize("analytics.read"),
  validate(reportsQuerySchema, "Please check the date range.", "query"),
  getAnalyticsReportsController
);

export default router;

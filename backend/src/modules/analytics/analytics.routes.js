import express from "express";
import authenticate from "../../core/middleware/authenticate.js";
import authorize from "../../core/middleware/authorize.js";
import validate from "../../core/middleware/validate.js";
import { 
  getDashboardStatsController, 
  getAnalyticsReportsController,
  getCashFlowTrendController,
  getOrdersTrendController,
  getExpensesByCategoryController,
  getPurchasesByCategoryController,
  getEmployeePaymentsByTypeController,
  getContractorCostTrendController,
  getEmployeeCostTrendController
} from "./analytics.controller.js";
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

router.get(
  "/cash-flow-trend",
  authorize("analytics.read"),
  validate(reportsQuerySchema, "Please check the date range.", "query"),
  getCashFlowTrendController
);

router.get(
  "/orders-trend",
  authorize("analytics.read"),
  validate(reportsQuerySchema, "Please check the date range.", "query"),
  getOrdersTrendController
);

router.get(
  "/expenses-by-category",
  authorize("analytics.read"),
  validate(reportsQuerySchema, "Please check the date range.", "query"),
  getExpensesByCategoryController
);

router.get(
  "/purchases-by-category",
  authorize("analytics.read"),
  validate(reportsQuerySchema, "Please check the date range.", "query"),
  getPurchasesByCategoryController
);

router.get(
  "/employee-payments-by-type",
  authorize("analytics.read"),
  validate(reportsQuerySchema, "Please check the date range.", "query"),
  getEmployeePaymentsByTypeController
);

router.get(
  "/contractor-cost-trend",
  authorize("analytics.read"),
  validate(reportsQuerySchema, "Please check the date range.", "query"),
  getContractorCostTrendController
);

router.get(
  "/employee-cost-trend",
  authorize("analytics.read"),
  validate(reportsQuerySchema, "Please check the date range.", "query"),
  getEmployeeCostTrendController
);

export default router;

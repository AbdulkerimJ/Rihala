import { Router } from "express";

import { getDashboard } from "./dashboard.controller.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", getDashboard);

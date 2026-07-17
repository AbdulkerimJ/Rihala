import { Router } from "express";

import { getExpenses } from "./expenses.controller.js";

export const expensesRouter = Router();

expensesRouter.get("/", getExpenses);

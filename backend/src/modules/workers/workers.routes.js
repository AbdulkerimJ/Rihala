import { Router } from "express";

import { getWorkers } from "./workers.controller.js";

export const workersRouter = Router();

workersRouter.get("/", getWorkers);

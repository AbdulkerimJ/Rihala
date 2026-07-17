import { Router } from "express";

import { getWorkerPayments } from "./worker-payments.controller.js";

export const workerPaymentsRouter = Router();

workerPaymentsRouter.get("/", getWorkerPayments);

import { authRouter } from "../modules/auth/auth.routes.js";
import { dashboardRouter } from "../modules/dashboard/dashboard.routes.js";
import { expensesRouter } from "../modules/expenses/expenses.routes.js";
import { workersRouter } from "../modules/workers/workers.routes.js";
import { workerPaymentsRouter } from "../modules/worker-payments/worker-payments.routes.js";
import {
  API_VERSION,
  HEALTH_CHECK_PATH,
} from "../shared/constants/api.constants.js";

export function registerRoutes(app) {
  const apiBasePath = `/api/${API_VERSION}`;

  app.get(`${apiBasePath}${HEALTH_CHECK_PATH}`, (_request, response) => {
    response.status(200).json({
      status: "ok",
      service: "rihala-backend",
      version: API_VERSION,
    });
  });

  app.use(`${apiBasePath}/auth`, authRouter);
  app.use(`${apiBasePath}/dashboard`, dashboardRouter);
  app.use(`${apiBasePath}/expenses`, expensesRouter);
  app.use(`${apiBasePath}/workers`, workersRouter);
  app.use(`${apiBasePath}/worker-payments`, workerPaymentsRouter);
}

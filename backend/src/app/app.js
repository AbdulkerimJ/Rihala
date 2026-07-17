import { registerProviders } from "./providers/index.js";
import { registerRoutes } from "./routes.js";
import {
  errorHandler,
  notFoundHandler,
} from "../shared/middleware/error.middleware.js";

export function createApp() {
  const app = registerProviders();

  registerRoutes(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

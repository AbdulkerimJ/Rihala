import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";

import { corsOptions } from "../../config/cors.js";
import { env } from "../../config/env.js";

export function registerProviders() {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(env.logFormat));
  app.use(cors(corsOptions));

  return app;
}

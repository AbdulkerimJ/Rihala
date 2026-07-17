import { env } from "./env.js";

const allowedOrigins = env.corsOrigin
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

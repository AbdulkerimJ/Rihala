import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import { errorHandler } from "./core/middleware/errorHandler.js";
import { notFoundHandler } from "./core/middleware/notFoundHandler.js";
import userRoutes from "./modules/users/user.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import roleRoutes from "./modules/roles/role.routes.js";
import permissionRoutes from "./modules/permissions/permission.routes.js";
import expenseRoutes from "./modules/expenses/expense.routes.js";
import customerRoutes from "./modules/customers/customer.routes.js";
import orderRoutes from "./modules/orders/order.routes.js";
import employeeRoutes from "./modules/employees/employee.routes.js";
import employeeRateRoutes from "./modules/employeeRates/employeeRate.routes.js";
import attendanceRoutes from "./modules/attendances/attendance.routes.js";
import overtimeRoutes from "./modules/overtimes/overtime.routes.js";

const app = express();

const allowedOrigins = [
  "https://rihala.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  return allowedOrigins.includes(origin);
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    message: "Rihala backend is running.",
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/roles", roleRoutes);
app.use("/api/v1/permissions", permissionRoutes);
app.use("/api/v1/expenses", expenseRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/employees", employeeRoutes);
app.use("/api/v1/employee-rates", employeeRateRoutes);
app.use("/api/v1/attendances", attendanceRoutes);
app.use("/api/v1/overtimes", overtimeRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

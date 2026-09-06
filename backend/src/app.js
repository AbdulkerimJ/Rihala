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
import attendanceRoutes from "./modules/attendances/attendance.routes.js";
import overtimeRoutes from "./modules/overtimes/overtime.routes.js";
import weeklyPayrollRoutes from "./modules/weeklyPayrolls/weeklyPayroll.routes.js";
import employeePaymentRoutes from "./modules/employeePayments/employeePayment.routes.js";
import supplierRoutes from "./modules/suppliers/supplier.routes.js";
import materialRoutes from "./modules/materials/material.routes.js";
import purchaseRoutes from "./modules/purchases/purchase.routes.js";
import supplierPaymentRoutes from "./modules/supplierPayments/supplierPayment.routes.js";
import customerPaymentRoutes from "./modules/customerPayments/customerPayment.routes.js";
import taskTypeRoutes from "./modules/taskTypes/taskType.routes.js";
import taskRoutes from "./modules/tasks/task.routes.js";
import contractorRoutes from "./modules/contractors/contractor.routes.js";
import contractRoutes from "./modules/contracts/contract.routes.js";
import contractCompletionRoutes from "./modules/contractCompletions/contractCompletion.routes.js";
import contractorPaymentRoutes from "./modules/contractorPayments/contractorPayment.routes.js";
import analyticsRoutes from "./modules/analytics/analytics.routes.js";
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
app.use("/api/v1/attendances", attendanceRoutes);
app.use("/api/v1/overtimes", overtimeRoutes);
app.use("/api/v1/weekly-payrolls", weeklyPayrollRoutes);
app.use("/api/v1/employee-payments", employeePaymentRoutes);
app.use("/api/v1/suppliers", supplierRoutes);
app.use("/api/v1/materials", materialRoutes);
app.use("/api/v1/purchases", purchaseRoutes);
app.use("/api/v1/supplier-payments", supplierPaymentRoutes);
app.use("/api/v1/customer-payments", customerPaymentRoutes);
app.use("/api/v1/task-types", taskTypeRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/contractors", contractorRoutes);
app.use("/api/v1/contracts", contractRoutes);
app.use("/api/v1/contract-completions", contractCompletionRoutes);
app.use("/api/v1/contractor-payments", contractorPaymentRoutes);
app.use("/api/v1/analytics", analyticsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

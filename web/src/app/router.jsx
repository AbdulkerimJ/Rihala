import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthLayout } from "../layouts/AuthLayout";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ProtectedRoute } from "../routes/ProtectedRoute";
import { RequirePermission } from "../routes/RequirePermission";

import { Login } from "../features/auth/pages/Login";
import { ForgotPassword } from "../features/auth/pages/ForgotPassword";
import { ResetPassword } from "../features/auth/pages/ResetPassword";
import { AcceptInvitation } from "../features/auth/pages/AcceptInvitation";
import { Dashboard } from "../features/dashboard/pages/Dashboard";
import { UsersList } from "../features/users/pages/UsersList";
import { UserDetail } from "../features/users/pages/UserDetail";
import { RolesList } from "../features/roles/pages/RolesList";
import { PermissionsList } from "../features/permissions/pages/PermissionsList";
import { ExpensesList } from "../features/expenses/pages/ExpensesList";
import { CustomersList } from "../features/customers/pages/CustomersList";
import { OrdersList } from "../features/orders/pages/OrdersList";
import { OrderDetail } from "../features/orders/pages/OrderDetail";
import { SuppliersList } from "../features/suppliers/pages/SuppliersList";
import { SupplierDetail } from "../features/suppliers/pages/SupplierDetail";
import { MaterialsList } from "../features/materials/pages/MaterialsList";
import { PurchasesList } from "../features/purchases/pages/PurchasesList";
import { PurchaseDetail } from "../features/purchases/pages/PurchaseDetail";
import { CustomerPaymentsList } from "../features/customer-payments/pages/CustomerPaymentsList";
import { SupplierPaymentsList } from "../features/supplier-payments/pages/SupplierPaymentsList";
import { EmployeesList } from "../features/employees/pages/EmployeesList";
import { EmployeeDetail } from "../features/employees/pages/EmployeeDetail";
import { EmployeePaymentsList } from "../features/employee-payments/pages/EmployeePaymentsList";
import { AttendancesList } from "../features/attendances/pages/AttendancesList";
import { OvertimesList } from "../features/overtimes/pages/OvertimesList";
import { WeeklyPayrollsList } from "../features/weekly-payrolls/pages/WeeklyPayrollsList";
import { WeeklyPayrollDetail } from "../features/weekly-payrolls/pages/WeeklyPayrollDetail";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/",
    element: <AuthLayout />,
    children: [
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "forgot-password",
        element: <ForgotPassword />,
      },
      {
        path: "reset-password/:token",
        element: <ResetPassword />,
      },
      {
        path: "accept-invitation/:token",
        element: <AcceptInvitation />,
      },
    ],
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "users",
        element: (
          <RequirePermission permission="users.read">
            <UsersList />
          </RequirePermission>
        ),
      },
      {
        path: "users/:id",
        element: (
          <RequirePermission permission="users.read">
            <UserDetail />
          </RequirePermission>
        ),
      },
      {
        path: "roles",
        element: (
          <RequirePermission permission="roles.read">
            <RolesList />
          </RequirePermission>
        ),
      },
      {
        path: "permissions",
        element: (
          <RequirePermission permission="permissions.read">
            <PermissionsList />
          </RequirePermission>
        ),
      },
      {
        path: "expenses",
        element: (
          <RequirePermission permission="expenses.read">
            <ExpensesList />
          </RequirePermission>
        ),
      },
      {
        path: "customers",
        element: (
          <RequirePermission permission="customers.read">
            <CustomersList />
          </RequirePermission>
        ),
      },
      {
        path: "customer-payments",
        element: (
          <RequirePermission permission="customerPayments.read">
            <CustomerPaymentsList />
          </RequirePermission>
        ),
      },
      {
        path: "orders",
        element: (
          <RequirePermission permission="orders.read">
            <OrdersList />
          </RequirePermission>
        ),
      },
      {
        path: "orders/:id",
        element: (
          <RequirePermission permission="orders.read">
            <OrderDetail />
          </RequirePermission>
        ),
      },
      {
        path: "suppliers",
        element: (
          <RequirePermission permission="suppliers.read">
            <SuppliersList />
          </RequirePermission>
        ),
      },
      {
        path: "suppliers/:id",
        element: (
          <RequirePermission permission="suppliers.read">
            <SupplierDetail />
          </RequirePermission>
        ),
      },
      {
        path: "supplier-payments",
        element: (
          <RequirePermission permission="supplierPayments.read">
            <SupplierPaymentsList />
          </RequirePermission>
        ),
      },
      {
        path: "materials",
        element: (
          <RequirePermission permission="materials.read">
            <MaterialsList />
          </RequirePermission>
        ),
      },
      {
        path: "purchases",
        element: (
          <RequirePermission permission="purchases.read">
            <PurchasesList />
          </RequirePermission>
        ),
      },
      {
        path: "purchases/:id",
        element: (
          <RequirePermission permission="purchases.read">
            <PurchaseDetail />
          </RequirePermission>
        ),
      },
      {
        path: "employees",
        element: (
          <RequirePermission permission="employees.read">
            <EmployeesList />
          </RequirePermission>
        ),
      },
      {
        path: "employees/:id",
        element: (
          <RequirePermission permission="employees.read">
            <EmployeeDetail />
          </RequirePermission>
        ),
      },
      {
        path: "employee-payments",
        element: (
          <RequirePermission permission="employeePayments.read">
            <EmployeePaymentsList />
          </RequirePermission>
        ),
      },
      {
        path: "attendances",
        element: (
          <RequirePermission permission="attendances.read">
            <AttendancesList />
          </RequirePermission>
        ),
      },
      {
        path: "overtimes",
        element: (
          <RequirePermission permission="overtimes.read">
            <OvertimesList />
          </RequirePermission>
        ),
      },
      {
        path: "weekly-payrolls",
        element: (
          <RequirePermission permission="weeklyPayrolls.read">
            <WeeklyPayrollsList />
          </RequirePermission>
        ),
      },
      {
        path: "weekly-payrolls/:id",
        element: (
          <RequirePermission permission="weeklyPayrolls.read">
            <WeeklyPayrollDetail />
          </RequirePermission>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);

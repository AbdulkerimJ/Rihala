import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthLayout } from "../layouts/AuthLayout";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ProtectedRoute } from "../routes/ProtectedRoute";
import { RequirePermission } from "../routes/RequirePermission";
import { RootRedirect } from "../routes/RootRedirect";

import { Login } from "../features/auth/pages/Login";
import { ForgotPassword } from "../features/auth/pages/ForgotPassword";
import { ResetPassword } from "../features/auth/pages/ResetPassword";
import { AcceptInvitation } from "../features/auth/pages/AcceptInvitation";
import { Dashboard } from "../features/dashboard/pages/Dashboard";
import { Welcome } from "../features/dashboard/pages/Welcome";
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
import { CustomerPaymentDetail } from "../features/customer-payments/pages/CustomerPaymentDetail";
import { SupplierPaymentsList } from "../features/supplier-payments/pages/SupplierPaymentsList";
import { EmployeesList } from "../features/employees/pages/EmployeesList";
import { EmployeeDetail } from "../features/employees/pages/EmployeeDetail";
import { EmployeePaymentsList } from "../features/employee-payments/pages/EmployeePaymentsList";
import { AttendancesList } from "../features/attendances/pages/AttendancesList";
import { OvertimesList } from "../features/overtimes/pages/OvertimesList";
import { WeeklyPayrollsList } from "../features/weekly-payrolls/pages/WeeklyPayrollsList";
import { WeeklyPayrollDetail } from "../features/weekly-payrolls/pages/WeeklyPayrollDetail";
import { EmployeeRatesList } from "../features/employee-rates/pages/EmployeeRatesList";

// New Contractor Management Imports
import { TaskTypesList } from "../features/task-types/pages/TaskTypesList";
import { TasksList } from "../features/tasks/pages/TasksList";
import { ContractorsList } from "../features/contractors/pages/ContractorsList";
import { ContractsList } from "../features/contracts/pages/ContractsList";
import { ContractDetail } from "../features/contracts/pages/ContractDetail";
import { ContractCompletionsList } from "../features/contract-completions/pages/ContractCompletionsList";
import { ContractorPaymentsList } from "../features/contractor-payments/pages/ContractorPaymentsList";
import { Analytics } from "../features/dashboard/pages/Analytics";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootRedirect />,
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
        element: (
          <RequirePermission permission="dashboard.read">
            <Dashboard />
          </RequirePermission>
        ),
      },
      {
        path: "analytics",
        element: (
          <RequirePermission permission="dashboard.read">
            <Analytics />
          </RequirePermission>
        ),
      },
      {
        path: "welcome",
        element: <Welcome />,
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
        path: "customer-payments/:id",
        element: (
          <RequirePermission permission="customerPayments.read">
            <CustomerPaymentDetail />
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
        path: "employee-rates",
        element: (
          <RequirePermission permission="employeeRates.read">
            <EmployeeRatesList />
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
      {
        path: "task-types",
        element: (
          <RequirePermission permission="taskTypes.read">
            <TaskTypesList />
          </RequirePermission>
        ),
      },
      {
        path: "tasks",
        element: (
          <RequirePermission permission="tasks.read">
            <TasksList />
          </RequirePermission>
        ),
      },
      {
        path: "contractors",
        element: (
          <RequirePermission permission="contractors.read">
            <ContractorsList />
          </RequirePermission>
        ),
      },
      {
        path: "contracts",
        element: (
          <RequirePermission permission="contracts.read">
            <ContractsList />
          </RequirePermission>
        ),
      },
      {
        path: "contracts/:id",
        element: (
          <RequirePermission permission="contracts.read">
            <ContractDetail />
          </RequirePermission>
        ),
      },
      {
        path: "contract-completions",
        element: (
          <RequirePermission permission="contractCompletions.read">
            <ContractCompletionsList />
          </RequirePermission>
        ),
      },
      {
        path: "contractor-payments",
        element: (
          <RequirePermission permission="contractorPayments.read">
            <ContractorPaymentsList />
          </RequirePermission>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <RootRedirect />,
  },
]);

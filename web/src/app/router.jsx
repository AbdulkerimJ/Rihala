import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthLayout } from "../layouts/AuthLayout";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ProtectedRoute } from "../routes/ProtectedRoute";
import { RequirePermission } from "../routes/RequirePermission";
import { RootRedirect } from "../routes/RootRedirect";
import { RouteErrorScreen } from "../components/ErrorBoundary";

import { Login } from "../features/auth/pages/Login";
import { ForgotPassword } from "../features/auth/pages/ForgotPassword";
import { ResetPassword } from "../features/auth/pages/ResetPassword";
import { AcceptInvitation } from "../features/auth/pages/AcceptInvitation";
import { Dashboard } from "../features/dashboard/pages/Dashboard";
import { Welcome } from "../features/dashboard/pages/Welcome";
import { UsersList } from "../features/users/pages/UsersList";
import { UserDetail } from "../features/users/pages/UserDetail";
import { RolesList } from "../features/roles/pages/RolesList";
import { CustomersList } from "../features/customers/pages/CustomersList";
import { CustomerDetail } from "../features/customers/pages/CustomerDetail";
import { OrdersList } from "../features/orders/pages/OrdersList";
import { OrderDetail } from "../features/orders/pages/OrderDetail";
import { SupplierDetail } from "../features/suppliers/pages/SupplierDetail";
import { PurchaseDetail } from "../features/purchases/pages/PurchaseDetail";
import { EmployeesList } from "../features/employees/pages/EmployeesList";
import { EmployeeDetail } from "../features/employees/pages/EmployeeDetail";
import { AttendancesList } from "../features/attendances/pages/AttendancesList";
import { OvertimesList } from "../features/overtimes/pages/OvertimesList";
import { WeeklyPayrollsList } from "../features/weekly-payrolls/pages/WeeklyPayrollsList";


import { Finance } from "../features/finance/pages/Finance";
import { Purchasing } from "../features/purchasing/pages/Purchasing";
import { TasksList } from "../features/tasks/pages/TasksList";
import { ContractorsList } from "../features/contractors/pages/ContractorsList";
import { ContractorDetail } from "../features/contractors/pages/ContractorDetail";
import { ContractsList } from "../features/contracts/pages/ContractsList";
import { ContractDetail } from "../features/contracts/pages/ContractDetail";

import { Analytics } from "../features/dashboard/pages/Analytics";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootRedirect />,
    errorElement: <RouteErrorScreen />
  },
  {
    path: "/",
    element: <AuthLayout />,
    errorElement: <RouteErrorScreen />,
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
    errorElement: <RouteErrorScreen />,
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
        path: "customers",
        element: (
          <RequirePermission permission="customers.read">
            <CustomersList />
          </RequirePermission>
        ),
      },
      {
        path: "customers/:id",
        element: (
          <RequirePermission permission="customers.read">
            <CustomerDetail />
          </RequirePermission>
        ),
      },
      {
        path: "payments",
        element: <Finance />,
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
        path: "purchases",
        element: <Purchasing />,
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
        path: "contractors/:id",
        element: (
          <RequirePermission permission="contractors.read">
            <ContractorDetail />
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
    ],
  },
  {
    path: "*",
    element: <RootRedirect />,
  },
]);

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
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);

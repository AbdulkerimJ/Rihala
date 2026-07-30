import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import { RequirePermission } from '../routes/RequirePermission';

import { Login } from '../features/auth/pages/Login';
import { Dashboard } from '../features/dashboard/pages/Dashboard';
import { UsersList } from '../features/users/pages/UsersList';
import { RolesList } from '../features/roles/pages/RolesList';
import { PermissionsList } from '../features/permissions/pages/PermissionsList';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <Login />,
      },
    ],
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'users',
        element: (
          <RequirePermission permission="users.read">
            <UsersList />
          </RequirePermission>
        ),
      },
      {
        path: 'roles',
        element: (
          <RequirePermission permission="roles.read">
            <RolesList />
          </RequirePermission>
        ),
      },
      {
        path: 'permissions',
        element: (
          <RequirePermission permission="permissions.read">
            <PermissionsList />
          </RequirePermission>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);

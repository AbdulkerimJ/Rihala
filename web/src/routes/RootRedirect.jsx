import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const RootRedirect = () => {
  const { hasPermission, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return null;
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (hasPermission("dashboard.read")) return <Navigate to="/dashboard" replace />;
  if (hasPermission("users.read")) return <Navigate to="/users" replace />;
  if (hasPermission("roles.read")) return <Navigate to="/roles" replace />;
  if (hasPermission("permissions.read")) return <Navigate to="/permissions" replace />;
  if (hasPermission("expenses.read")) return <Navigate to="/expenses" replace />;
  if (hasPermission("customers.read")) return <Navigate to="/customers" replace />;
  if (hasPermission("customerPayments.read")) return <Navigate to="/customer-payments" replace />;
  if (hasPermission("orders.read")) return <Navigate to="/orders" replace />;
  if (hasPermission("suppliers.read")) return <Navigate to="/suppliers" replace />;
  if (hasPermission("supplierPayments.read")) return <Navigate to="/supplier-payments" replace />;
  if (hasPermission("materials.read")) return <Navigate to="/materials" replace />;
  if (hasPermission("purchases.read")) return <Navigate to="/purchases" replace />;
  if (hasPermission("employees.read")) return <Navigate to="/employees" replace />;
  if (hasPermission("employeePayments.read")) return <Navigate to="/employee-payments" replace />;
  if (hasPermission("attendances.read")) return <Navigate to="/attendances" replace />;
  if (hasPermission("overtimes.read")) return <Navigate to="/overtimes" replace />;
  if (hasPermission("weeklyPayrolls.read")) return <Navigate to="/weekly-payrolls" replace />;

  return <Navigate to="/welcome" replace />;
};

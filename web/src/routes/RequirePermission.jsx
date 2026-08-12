import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';

export const RequirePermission = ({ permission, children }) => {
  const { can } = usePermission();

  if (!can(permission)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

import React from 'react';
import { usePermission } from '../hooks/usePermission';

export const Can = ({ permission, children }) => {
  const { can } = usePermission();

  if (!can(permission)) {
    return null;
  }

  return <>{children}</>;
};

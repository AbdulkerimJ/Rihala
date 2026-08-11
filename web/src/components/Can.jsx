import React from 'react';
import { usePermission } from '../hooks/usePermission';

export const Can = ({ permission, permissions, mode = 'any', children }) => {
  const { can } = usePermission();

  if (permission && !can(permission)) {
    return null;
  }

  if (permissions && permissions.length > 0) {
    if (mode === 'all') {
      const hasAll = permissions.every((p) => can(p));
      if (!hasAll) return null;
    } else {
      const hasAny = permissions.some((p) => can(p));
      if (!hasAny) return null;
    }
  }

  return <>{children}</>;
};

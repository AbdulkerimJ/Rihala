import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

export const Welcome = () => {
  const { currentUser } = useAuth();
  
  const hasAnyPermission = currentUser?.roles?.some(
    (role) => role.permissions && role.permissions.length > 0
  );

  if (hasAnyPermission) {
    return <Navigate to="/" replace />;
  }

  return (

    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50 dark:bg-gray-900 rounded-lg shadow-sm mt-10">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Welcome!
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md">
        You have successfully logged in. You will be able to access your features soon.
      </p>
    </div>
  );
};

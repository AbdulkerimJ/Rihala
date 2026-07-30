import React from 'react';
import { useAuth } from '../../../hooks/useAuth';

export const Dashboard = () => {
  const { currentUser } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
      <p className="mt-4 text-gray-600 dark:text-gray-300">
        Welcome back, {currentUser?.firstName}! This is the Rihala Furniture Workshop Management System.
      </p>
    </div>
  );
};

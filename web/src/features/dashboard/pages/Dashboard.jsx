import React from "react";
import { useAuth } from "../../../hooks/useAuth";

export const Dashboard = () => {
  const { currentUser } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary">Dashboard</h1>
      <p className="mt-4 max-w-2xl text-secondary">
        Welcome back, {currentUser?.name || "there"}. This is the Rihala
        Furniture Workshop Management System.
      </p>
    </div>
  );
};

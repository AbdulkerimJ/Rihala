import React from "react";
import { useAuth } from "../../../hooks/useAuth";

export const Dashboard = () => {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-primary font-display mb-1">Welcome to Rihala</h1>
        <p className="max-w-2xl text-secondary text-base">
          Hello, {currentUser?.name || "there"}. Your workshop management system is ready.
        </p>
      </div>
    </div>
  );
};

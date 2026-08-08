import React from "react";

export const PageHeader = ({ title, description, actions }) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary font-display">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-secondary">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      )}
    </div>
  );
};

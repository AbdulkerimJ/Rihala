import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export const PageHeader = ({ title, description, actions, backTo, backLabel }) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {backTo && (
          <Link
            to={backTo}
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-surface text-secondary hover:text-primary hover:bg-main transition-colors shrink-0"
            title={backLabel || "Back"}
            aria-label={backLabel || "Back"}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary font-display">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-secondary">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      )}
    </div>
  );
};

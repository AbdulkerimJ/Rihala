import React from "react";

export const SummaryCard = ({ title, value, subtitle, icon: Icon, valueClassName = "text-primary" }) => {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm flex items-start gap-4">
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent flex-shrink-0">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <div className="space-y-1 overflow-hidden">
        <h3 className="text-sm font-medium text-secondary truncate">{title}</h3>
        <div className={`text-2xl font-bold truncate ${valueClassName}`}>{value}</div>
        {subtitle && <p className="text-xs text-muted truncate">{subtitle}</p>}
      </div>
    </div>
  );
};

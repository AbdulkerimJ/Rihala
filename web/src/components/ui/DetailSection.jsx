import React from "react";

export const DetailSection = ({ title, children, className = "" }) => {
  return (
    <div className={`rounded-xl border border-border bg-surface shadow-sm overflow-hidden ${className}`}>
      {title && (
        <div className="border-b border-border bg-main/30 px-5 py-3">
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">{title}</h3>
        </div>
      )}
      <div className="p-4 sm:p-5">
        {children}
      </div>
    </div>
  );
};

export const DetailItem = ({ label, value, className = "" }) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between py-1 border-b border-border/50 last:border-0 ${className}`}>
      <span className="text-xs sm:text-sm font-medium text-secondary">{label}</span>
      <div className="text-sm text-primary font-medium text-left sm:text-right">{value}</div>
    </div>
  );
};

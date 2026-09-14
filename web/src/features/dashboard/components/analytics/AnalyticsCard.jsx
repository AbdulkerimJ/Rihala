import React from "react";
import { Loader2 } from "lucide-react";

export const AnalyticsCard = ({ title, subtitle, children, isLoading, className = "" }) => {
  return (
    <div className={`rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-sm flex flex-col ${className}`}>
      <div className="flex flex-col mb-6">
        <h3 className="text-base sm:text-lg font-bold tracking-tight text-primary">{title}</h3>
        {subtitle && <span className="text-xs sm:text-sm text-secondary/70 mt-1">{subtitle}</span>}
      </div>
      
      <div className="flex-1 relative flex items-center justify-center">
        {isLoading ? (
          <div className="flex items-center justify-center h-full w-full min-h-[260px]">
            <Loader2 className="w-8 h-8 animate-spin text-accent/50" />
          </div>
        ) : (
          <div className="w-full h-full min-h-[260px]">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

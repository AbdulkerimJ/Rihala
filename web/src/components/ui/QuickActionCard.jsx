import React from "react";
import { Link } from "react-router-dom";

const ICON_VARIANTS = {
  brand: "text-brand bg-brand/10 border-brand/15",
  success: "text-success bg-success/10 border-success/15",
  accent: "text-accent bg-accent/10 border-accent/15",
  warning: "text-warning bg-warning/10 border-warning/15",
  danger: "text-danger bg-danger/10 border-danger/15",
  default: "text-secondary bg-main/80 border-border/60",
};

export const QuickActionCard = ({
  to,
  icon: Icon,
  label,
  variant = "default",
  className = "",
}) => {
  const iconStyle = ICON_VARIANTS[variant] || ICON_VARIANTS.default;

  return (
    <Link
      to={to}
      className={`
        group flex items-center sm:flex-col justify-start sm:justify-center gap-2.5 sm:gap-2
        p-3 sm:p-3.5 rounded-xl border border-border bg-surface shadow-xs
        hover:border-border/80 hover:bg-main/30 transition-all duration-150 active:scale-[0.98]
        ${className}
      `}
    >
      {Icon && (
        <div
          className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg border transition-transform duration-150 group-hover:scale-105 ${iconStyle}`}
        >
          <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" strokeWidth={2} />
        </div>
      )}
      <span className="text-xs font-semibold text-primary group-hover:text-primary tracking-tight truncate">
        {label}
      </span>
    </Link>
  );
};

import React from "react";

const ICON_VARIANT_STYLES = {
  brand: "bg-brand/10 text-brand",
  accent: "bg-accent/10 text-accent",
  blue: "bg-status-processing/10 text-status-processing",
  success: "bg-success/10 text-success",
  emerald: "bg-status-delivered/10 text-status-delivered",
  danger: "bg-danger/10 text-danger",
  rose: "bg-status-cancelled/10 text-status-cancelled",
  warning: "bg-warning/10 text-warning",
  amber: "bg-status-pending/10 text-status-pending",
  purple: "bg-status-shipped/10 text-status-shipped",
  indigo: "bg-brand/10 text-brand",
  teal: "bg-finance-in/10 text-finance-in",
};

const CARD_VARIANT_STYLES = {
  default: "border-border bg-surface hover:border-border/80",
  brand: "border-border bg-surface hover:border-border/80",
  blue: "border-status-processing/20 bg-status-processing/[0.03] hover:border-status-processing/40",
  accent: "border-accent/20 bg-accent/[0.03] hover:border-accent/40",
  emerald: "border-status-delivered/20 bg-status-delivered/[0.03] hover:border-status-delivered/40",
  success: "border-success/20 bg-success/[0.03] hover:border-success/40",
  amber: "border-status-pending/20 bg-status-pending/[0.03] hover:border-status-pending/40",
  warning: "border-warning/20 bg-warning/[0.03] hover:border-warning/40",
  purple: "border-status-shipped/20 bg-status-shipped/[0.03] hover:border-status-shipped/40",
  indigo: "border-brand/20 bg-brand/[0.03] hover:border-brand/40",
  rose: "border-status-cancelled/20 bg-status-cancelled/[0.03] hover:border-status-cancelled/40",
  danger: "border-danger/20 bg-danger/[0.03] hover:border-danger/40",
  teal: "border-finance-in/20 bg-finance-in/[0.03] hover:border-finance-in/40",
};

export const SummaryCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant,
  iconVariant,
  valueClassName = "text-primary",
  badge,
  children,
  className = "",
}) => {
  const resolvedVariant = variant || "default";
  const resolvedIconVariant = iconVariant || (variant ? variant : "brand");

  const titleString = typeof title === "string" ? title : undefined;
  const valueString =
    typeof value === "string" || typeof value === "number"
      ? String(value)
      : undefined;
  const subtitleString =
    typeof subtitle === "string" ? subtitle : undefined;

  return (
    <div
      className={`group relative flex h-full min-w-0 flex-col justify-between overflow-hidden rounded-xl border p-4 sm:p-5 shadow-xs transition-shadow duration-200 hover:shadow-sm ${
        CARD_VARIANT_STYLES[resolvedVariant] || CARD_VARIANT_STYLES.default
      } ${className}`}
    >
      <div className="flex min-w-0 items-start justify-between gap-3.5">
        <div className="flex min-w-0 flex-1 flex-col justify-center overflow-hidden">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold tracking-wider text-secondary uppercase truncate block"
              title={titleString}
            >
              {title}
            </span>
            {badge && (
              <span className="shrink-0">{badge}</span>
            )}
          </div>
          <div
            className={`mt-1.5 truncate text-base font-bold tracking-tight sm:text-lg md:text-xl tabular-nums leading-tight ${valueClassName}`}
            title={valueString}
          >
            {value}
          </div>
          {subtitle && (
            <p
              className="mt-1 text-xs text-muted truncate block"
              title={subtitleString}
            >
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div
            className={`flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${
              ICON_VARIANT_STYLES[resolvedIconVariant] ||
              ICON_VARIANT_STYLES.brand
            }`}
          >
            <Icon className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
          </div>
        )}
      </div>

      {children && (
        <div className="mt-3 pt-2.5 border-t border-border/40">
          {children}
        </div>
      )}
    </div>
  );
};

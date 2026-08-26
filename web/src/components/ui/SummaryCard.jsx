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

// Left border accent per variant (the "glanceable" stripe)
const LEFT_BORDER_STYLES = {
  default: "border-l-border",
  brand: "border-l-accent/40",
  blue: "border-l-status-processing/50",
  accent: "border-l-accent/60",
  emerald: "border-l-status-delivered/60",
  success: "border-l-success/60",
  amber: "border-l-status-pending/60",
  warning: "border-l-warning/60",
  purple: "border-l-status-shipped/60",
  indigo: "border-l-brand/40",
  rose: "border-l-status-cancelled/60",
  danger: "border-l-danger/60",
  teal: "border-l-finance-in/60",
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
      className={`
        group relative flex h-full min-w-0 flex-col justify-between
        overflow-hidden rounded-xl border border-l-4 p-4 sm:p-5
        shadow-xs transition-all duration-200 hover:shadow-sm
        animate-[fadeSlideUp_0.35s_ease_both]
        ${CARD_VARIANT_STYLES[resolvedVariant] || CARD_VARIANT_STYLES.default}
        ${LEFT_BORDER_STYLES[resolvedVariant] || LEFT_BORDER_STYLES.default}
        ${className}
      `}
    >
      <div className="flex min-w-0 items-start justify-between gap-3.5">
        <div className="flex min-w-0 flex-1 flex-col justify-center overflow-hidden">
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] font-bold tracking-widest text-secondary uppercase truncate block"
              title={titleString}
            >
              {title}
            </span>
            {badge && (
              <span className="shrink-0">{badge}</span>
            )}
          </div>
          <div
            className={`mt-2 truncate text-2xl sm:text-3xl font-black tracking-tight tabular-nums leading-none ${valueClassName}`}
            title={valueString}
          >
            {value}
          </div>
          {subtitle && (
            <p
              className="mt-1.5 text-xs text-muted truncate block"
              title={subtitleString}
            >
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${
              ICON_VARIANT_STYLES[resolvedIconVariant] ||
              ICON_VARIANT_STYLES.brand
            }`}
          >
            <Icon className="h-5 w-5" />
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

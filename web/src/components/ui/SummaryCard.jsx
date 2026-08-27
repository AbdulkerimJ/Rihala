import React from "react";

const ICON_VARIANT_STYLES = {
  brand: "text-brand bg-brand/10 border-brand/15",
  accent: "text-accent bg-accent/10 border-accent/15",
  blue: "text-status-processing bg-status-processing/10 border-status-processing/15",
  success: "text-success bg-success/10 border-success/15",
  emerald: "text-status-delivered bg-status-delivered/10 border-status-delivered/15",
  danger: "text-danger bg-danger/10 border-danger/15",
  rose: "text-status-cancelled bg-status-cancelled/10 border-status-cancelled/15",
  warning: "text-warning bg-warning/10 border-warning/15",
  amber: "text-status-pending bg-status-pending/10 border-status-pending/15",
  purple: "text-status-shipped bg-status-shipped/10 border-status-shipped/15",
  indigo: "text-brand bg-brand/10 border-brand/15",
  teal: "text-finance-in bg-finance-in/10 border-finance-in/15",
  default: "text-secondary bg-main/80 border-border/60",
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
  const resolvedIconVariant = iconVariant || variant || "default";

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
        group relative flex h-full min-w-0 w-full flex-col justify-between
        overflow-hidden rounded-xl border border-border bg-surface p-3 sm:p-4 lg:p-5
        shadow-xs hover:border-border/80 transition-colors duration-150
        ${className}
      `}
    >
      <div className="min-w-0 w-full overflow-hidden">
        {/* Header: Title on left, Clean Icon badge on right */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span
              className="text-xs sm:text-xs lg:text-sm font-medium text-secondary truncate block"
              title={titleString}
            >
              {title}
            </span>
            {badge && (
              <span className="shrink-0">{badge}</span>
            )}
          </div>

          {Icon && (
            <div
              className={`flex h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 shrink-0 items-center justify-center rounded-lg border ${
                ICON_VARIANT_STYLES[resolvedIconVariant] || ICON_VARIANT_STYLES.default
              }`}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-4.5 lg:w-4.5" strokeWidth={2} />
            </div>
          )}
        </div>

        {/* Primary Metric / Value */}
        <div
          className={`mt-2 sm:mt-2.5 min-w-0 w-full text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-medium tracking-tight text-primary tabular-nums leading-tight break-words ${valueClassName}`}
          title={valueString}
        >
          {value}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p
            className="mt-1 text-xs text-muted truncate block"
            title={subtitleString}
          >
            {subtitle}
          </p>
        )}
      </div>

      {children && (
        <div className="mt-3 pt-2.5 border-t border-border/50 text-xs text-secondary min-w-0 w-full">
          {children}
        </div>
      )}
    </div>
  );
};

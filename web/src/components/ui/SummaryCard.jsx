import React from "react";

const ICON_VARIANT_STYLES = {
  brand: "bg-brand/10 text-brand",
  accent: "bg-accent/10 text-accent",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  danger: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
};

const CARD_VARIANT_STYLES = {
  default: "border-border bg-surface hover:border-border/80",
  brand: "border-border bg-surface hover:border-border/80",
  blue: "border-blue-500/20 bg-blue-500/[0.03] dark:bg-blue-500/[0.07] hover:border-blue-500/40",
  accent: "border-accent/20 bg-accent/[0.03] dark:bg-accent/[0.07] hover:border-accent/40",
  emerald: "border-emerald-500/20 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.07] hover:border-emerald-500/40",
  success: "border-emerald-500/20 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.07] hover:border-emerald-500/40",
  amber: "border-amber-500/20 bg-amber-500/[0.03] dark:bg-amber-500/[0.07] hover:border-amber-500/40",
  warning: "border-amber-500/20 bg-amber-500/[0.03] dark:bg-amber-500/[0.07] hover:border-amber-500/40",
  purple: "border-purple-500/20 bg-purple-500/[0.03] dark:bg-purple-500/[0.07] hover:border-purple-500/40",
  indigo: "border-indigo-500/20 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.07] hover:border-indigo-500/40",
  rose: "border-rose-500/20 bg-rose-500/[0.03] dark:bg-rose-500/[0.07] hover:border-rose-500/40",
  danger: "border-rose-500/20 bg-rose-500/[0.03] dark:bg-rose-500/[0.07] hover:border-rose-500/40",
  teal: "border-teal-500/20 bg-teal-500/[0.03] dark:bg-teal-500/[0.07] hover:border-teal-500/40",
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
      className={`group relative flex h-full min-w-0 flex-col justify-between overflow-hidden rounded-xl border p-4 sm:p-5 shadow-xs transition-all duration-200 hover:shadow-sm ${
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

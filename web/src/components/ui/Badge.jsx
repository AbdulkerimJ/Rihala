import React from "react";

const variantStyles = {
  default: "bg-main text-primary border-border",
  brand: "bg-brand/10 text-brand border-brand/20",
  accent: "bg-accent/10 text-accent border-accent/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  outline: "bg-transparent text-secondary border-border",
};

export const Badge = ({
  children,
  variant = "default",
  className = "",
  ...props
}) => {
  const resolvedVariant = variantStyles[variant] || variantStyles.default;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${resolvedVariant} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

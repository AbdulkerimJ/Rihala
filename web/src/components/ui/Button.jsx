import React from "react";
import { Loader2 } from "lucide-react";

const variantStyles = {
  primary: "bg-accent text-white shadow-sm hover:bg-accent-hover focus:ring-accent",
  secondary: "bg-accent/10 text-accent hover:bg-accent/20 focus:ring-accent",
  outline: "border border-border bg-transparent text-primary hover:bg-main focus:ring-accent",
  ghost: "text-secondary hover:text-primary bg-transparent hover:bg-main focus:ring-accent",
  danger: "bg-danger text-white shadow-sm hover:bg-danger-hover focus:ring-danger",
  "danger-ghost": "text-danger hover:bg-danger/10 focus:ring-danger",
};

const sizeStyles = {
  xs: "px-2 py-1 text-xs gap-1",
  sm: "px-3 py-1.5 text-sm gap-1.5 h-8",
  md: "px-4 py-2 text-sm gap-2 min-h-[40px]",
  lg: "px-6 py-3 text-base gap-2.5 min-h-[48px]",
  touch: "px-6 py-3 text-base gap-2 min-h-[48px] w-full sm:w-auto",
  icon: "p-2 min-h-[40px] min-w-[40px]",
  none: "",
};

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  disabled = false,
  isLoading = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  type = "button",
  onClick,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-sm font-medium transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none select-none";

  const combinedClassName = `
    ${baseStyles}
    ${variantStyles[variant] || variantStyles.primary}
    ${sizeStyles[size] || sizeStyles.md}
    ${fullWidth ? "w-full flex" : ""}
    ${className}
  `
    .trim()
    .replace(/\s+/g, " ");

  const isButtonDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isButtonDisabled}
      className={combinedClassName}
      onClick={onClick}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
      {!isLoading && LeftIcon && <LeftIcon className="h-4 w-4 shrink-0" />}
      {children}
      {!isLoading && RightIcon && <RightIcon className="h-4 w-4 shrink-0" />}
    </button>
  );
};

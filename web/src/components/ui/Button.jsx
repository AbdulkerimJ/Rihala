import React from "react";
import { Loader2 } from "lucide-react";

const variantStyles = {
  primary: "bg-accent text-white shadow-sm hover:bg-accent-hover focus:ring-accent",
  secondary: "border border-border bg-surface text-primary shadow-sm hover:bg-main hover:border-muted focus:ring-accent",
  danger: "bg-danger text-white shadow-sm hover:bg-danger-hover focus:ring-danger",
  ghost: "text-muted hover:text-primary bg-transparent hover:bg-black/5 dark:hover:bg-white/5",
  ghostPrimary: "text-primary hover:text-accent bg-transparent hover:bg-black/5 dark:hover:bg-white/5",
  ghostDanger: "text-muted hover:text-danger bg-transparent hover:bg-black/5 dark:hover:bg-white/5",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2.5",
  icon: "p-1.5",
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
    "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none select-none";

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

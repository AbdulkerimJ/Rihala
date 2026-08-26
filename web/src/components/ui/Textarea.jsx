import React, { forwardRef } from "react";

export const Textarea = forwardRef(
  (
    {
      rows = 3,
      error,
      fullWidth = true,
      className = "",
      disabled = false,
      id,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "block bg-main border rounded-md px-3 py-3 min-h-[44px] text-sm text-primary placeholder:text-muted transition-shadow duration-150 focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50 disabled:cursor-not-allowed";

    const borderClasses = error
      ? "border-danger focus:border-danger focus:ring-danger/20"
      : "border-border focus:border-accent";

    const combinedClassName = `
      ${baseClasses}
      ${borderClasses}
      ${fullWidth ? "w-full" : ""}
      ${className}
    `
      .trim()
      .replace(/\s+/g, " ");

    return (
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        disabled={disabled}
        aria-invalid={!!error}
        className={combinedClassName}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

import React, { forwardRef } from "react";

export const Select = forwardRef(
  (
    {
      options = [],
      placeholder,
      error,
      size = "md",
      fullWidth = true,
      className = "",
      disabled = false,
      children,
      id,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "px-2.5 py-1.5 text-xs rounded-md",
      md: "px-3 py-2 text-sm rounded-md",
      lg: "px-4 py-2.5 text-sm rounded-xl",
    };

    const baseClasses =
      "block bg-main border text-primary transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50 disabled:cursor-not-allowed";

    const borderClasses = error
      ? "border-danger focus:border-danger focus:ring-danger/20"
      : "border-border focus:border-accent";

    const combinedClassName = `
      ${baseClasses}
      ${sizeClasses[size] || sizeClasses.md}
      ${borderClasses}
      ${fullWidth ? "w-full" : ""}
      ${className}
    `
      .trim()
      .replace(/\s+/g, " ");

    return (
      <div className={`relative ${fullWidth ? "w-full" : "inline-block"}`}>
        <select
          ref={ref}
          id={id}
          disabled={disabled}
          aria-invalid={!!error}
          className={combinedClassName}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.length > 0
            ? options.map((opt) => (
                <option
                  key={typeof opt === "object" ? opt.value : opt}
                  value={typeof opt === "object" ? opt.value : opt}
                  disabled={typeof opt === "object" ? opt.disabled : false}
                >
                  {typeof opt === "object" ? opt.label : opt}
                </option>
              ))
            : children}
        </select>
      </div>
    );
  }
);

Select.displayName = "Select";

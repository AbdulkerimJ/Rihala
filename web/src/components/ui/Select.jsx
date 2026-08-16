import React, { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

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
      sm: "pl-2.5 pr-8 py-1.5 text-xs rounded-md",
      md: "pl-3 pr-10 py-2 text-sm rounded-lg",
      lg: "pl-4 pr-10 py-2.5 text-sm rounded-xl",
    };

    const baseClasses =
      "block bg-main border text-primary appearance-none cursor-pointer transition-all duration-200 hover:border-accent/50 hover:bg-surface focus:outline-none focus:ring-4 focus:ring-accent/10 disabled:opacity-50 disabled:cursor-not-allowed";

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
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-secondary">
          <ChevronDown className="h-4 w-4 opacity-70" />
        </div>
      </div>
    );
  }
);

Select.displayName = "Select";

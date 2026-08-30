import React from "react";

export const FormField = ({
  label,
  labelRight,
  error,
  required,
  description,
  children,
  className = "",
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-primary">
            {label} {required && <span className="text-danger">*</span>}
          </label>
          {labelRight && <div className="text-xs">{labelRight}</div>}
        </div>
      )}
      {children}
      {description && !error && (
        <p className="text-xs text-secondary">{description}</p>
      )}
      {error && (
        <p className="text-xs font-medium text-danger mt-1 flex items-center gap-1">
          <span className="inline-block h-1 w-1 shrink-0 rounded-full bg-danger" />
          {error}
        </p>
      )}
    </div>
  );
};

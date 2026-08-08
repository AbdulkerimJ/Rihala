import React from "react";

export const FormField = ({ label, error, required, children, className = "" }) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-primary">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-danger font-medium mt-1">{error}</p>}
    </div>
  );
};

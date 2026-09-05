import { forwardRef } from "react";

export const Checkbox = forwardRef(
  (
    {
      label,
      description,
      error,
      checked,
      onChange,
      disabled = false,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    return (
      <div className={`flex items-start gap-2.5 ${className}`}>
        <input
          ref={ref}
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="mt-0.5 h-4 w-4 rounded border-border text-accent focus:ring-accent accent-accent transition-shadow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          {...props}
        />
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={id}
                className="text-sm font-medium text-primary select-none cursor-pointer"
              >
                {label}
              </label>
            )}
            {description && (
              <span className="text-xs text-secondary">{description}</span>
            )}
            {error && (
              <span className="text-xs text-danger font-medium mt-0.5">
                {error}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

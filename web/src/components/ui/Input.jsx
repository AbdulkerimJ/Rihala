import { forwardRef } from "react";

export const Input = forwardRef(
  (
    {
      type = "text",
      error,
      size = "md",
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      fullWidth = true,
      className = "",
      disabled = false,
      id,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "px-2.5 py-1.5 text-xs rounded-md h-9",
      md: "px-3 py-2 text-sm rounded-md h-11",
      lg: "px-4 py-2.5 text-sm rounded-xl h-12",
    };

    const baseClasses =
      "block bg-main border text-primary placeholder:text-muted transition-shadow duration-150 focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50 disabled:cursor-not-allowed";

    const borderClasses = error
      ? "border-danger focus:border-danger focus:ring-danger/20"
      : "border-border focus:border-accent";

    const paddingLeft = LeftIcon ? (size === "lg" ? "pl-11" : "pl-9") : "";
    const paddingRight = RightIcon ? (size === "lg" ? "pr-11" : "pr-9") : "";

    const combinedClassName = `
      ${baseClasses}
      ${sizeClasses[size] || sizeClasses.md}
      ${borderClasses}
      ${paddingLeft}
      ${paddingRight}
      ${fullWidth ? "w-full" : ""}
      ${className}
    `
      .trim()
      .replace(/\s+/g, " ");

    const handleWheel = (e) => {
      if (type === "number") {
        e.currentTarget.blur();
      }
      props.onWheel?.(e);
    };

    return (
      <div className={`relative ${fullWidth ? "w-full" : "inline-block"}`}>
        {LeftIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-secondary">
            <LeftIcon className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} />
          </div>
        )}
        <input
          ref={ref}
          id={id}
          type={type}
          disabled={disabled}
          aria-invalid={!!error}
          className={combinedClassName}
          onWheel={handleWheel}
          inputMode={type === "number" ? "decimal" : type === "tel" ? "tel" : undefined}
          {...props}
        />
        {RightIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-secondary">
            <RightIcon className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} />
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

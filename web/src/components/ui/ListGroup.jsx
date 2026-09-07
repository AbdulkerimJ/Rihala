import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { ListGroupSkeleton } from "./skeletons";

/**
 * ListGroup - A container for grouped vertical list items with clean dividers.
 */
export const ListGroup = ({
  children,
  variant = "card", // "card" | "flush"
  className = "",
  ...props
}) => {
  const baseStyles =
    variant === "card"
      ? "divide-y divide-border/60 rounded-sm border border-border bg-surface shadow-xs [&>*:first-child]:rounded-t-sm [&>*:last-child]:rounded-b-sm"
      : "divide-y divide-border/60";

  return (
    <div className={`${baseStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};

/**
 * ListItem - A single item inside a ListGroup. Supports interactive links, buttons, or static rows.
 */
export const ListItem = ({
  to,
  onClick,
  icon: Icon,
  title,
  subtitle,
  right,
  actions,
  showChevron = false,
  size = "md", // "sm" | "md" | "lg"
  className = "",
  children,
  ...props
}) => {
  const isInteractive = Boolean(to || onClick);
  const Component = to ? Link : onClick ? "button" : "div";

  const sizeStyles = {
    xs: "px-2.5 py-1 gap-2",
    sm: "px-3 py-1.5 gap-2.5",
    md: "px-3 py-1.5 sm:px-3.5 sm:py-2 gap-2.5",
    lg: "px-3.5 py-2.5 sm:px-4 sm:py-3 gap-3",
  };

  const interactiveStyles = isInteractive
    ? "group hover:bg-accent/5 transition-shadow duration-200 active:bg-main/60 text-left cursor-pointer"
    : "";

  return (
    <Component
      to={to}
      onClick={onClick}
      className={`flex items-center justify-between w-full ${sizeStyles[size] || sizeStyles.md} ${interactiveStyles} ${className}`}
      {...props}
    >
      {/* If custom children are passed, render them */}
      {children ? (
        children
      ) : (
        <>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            {Icon && (
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-main/50 text-secondary">
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            )}
            <div className="min-w-0 flex-1 flex flex-col gap-0.5">
              {title && (
                <span className="text-xs sm:text-sm font-medium text-primary truncate block leading-tight">
                  {title}
                </span>
              )}
              {subtitle && (
                <span className="text-[11px] text-muted truncate block leading-tight">
                  {subtitle}
                </span>
              )}
            </div>
          </div>

          {(right || actions || showChevron) && (
            <div className="flex items-center gap-2 shrink-0">
              {right}
              {actions && (
                <div className="flex items-center gap-1.5 ml-1 pl-1">
                  {actions}
                </div>
              )}
              {showChevron && (
                <ChevronRight className="h-4 w-4 text-secondary/30 group-hover:text-accent group-hover:translate-x-1 transition-shadow shrink-0" />
              )}
            </div>
          )}
        </>
      )}
    </Component>
  );
};

export { ListGroupSkeleton };

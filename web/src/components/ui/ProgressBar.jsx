import { useState, useEffect } from "react";

const variantStyles = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  financeIn: "bg-finance-in",
  financeOut: "bg-finance-out",
  accent: "bg-accent",
};

const sizeStyles = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export const ProgressBar = ({
  progress = 0,
  variant = "default",
  size = "md",
  animated = false,
  className = "",
  barClassName = "",
}) => {
  // Start at 0 so it always animates on mount
  const [currentWidth, setCurrentWidth] = useState(0);
  const clampedProgress = Math.min(100, Math.max(0, progress));

  useEffect(() => {
    // Small delay ensures the browser paints the 0% state first before animating
    const timer = setTimeout(() => {
      setCurrentWidth(clampedProgress);
    }, 10);
    return () => clearTimeout(timer);
  }, [clampedProgress]);
  
  return (
    <div className={`w-full bg-main rounded-full overflow-hidden shadow-inner ${sizeStyles[size] || sizeStyles.md} ${className}`}>
      <div
        className={`relative h-full transition-all duration-500 ease-out rounded-full overflow-hidden ${variantStyles[variant] || variantStyles.default} ${barClassName}`}
        style={{ width: `${currentWidth}%` }}
      >
        {animated && currentWidth < 100 && (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        )}
      </div>
    </div>
  );
};

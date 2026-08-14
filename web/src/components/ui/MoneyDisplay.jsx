import React from "react";
import { formatCurrency } from "../../utils/formatters";

export const MoneyDisplay = ({
  amount,
  variant = "default",
  showSymbol = true,
  className = "",
}) => {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const variants = {
    default: "text-primary font-medium",
    success: "text-success font-semibold",
    danger: "text-danger font-semibold",
    warning: "text-warning font-semibold",
    muted: "text-secondary line-through opacity-70",
    accent: "text-accent font-bold",
  };

  return (
    <span
      className={`inline-flex max-w-full items-baseline gap-0.5 whitespace-nowrap tabular-nums ${variants[variant]} ${className}`}
    >
      {isNegative && <span>-</span>}
      <span className="truncate">{formatCurrency(absAmount, showSymbol)}</span>
    </span>
  );
};

import React from "react";
import { formatCurrency } from "../../utils/formatters";

export const MoneyDisplay = ({
  amount = 0,
  variant = "default",
  showSymbol = true,
  className = "",
}) => {
  const num = Number(amount);
  const isNegative = Number.isFinite(num) && num < 0;
  const absAmount = Math.abs(Number.isFinite(num) ? num : 0);

  const variants = {
    default: "text-primary font-medium",
    success: "text-success font-semibold",
    danger: "text-danger font-semibold",
    warning: "text-warning font-semibold",
    muted: "text-secondary line-through opacity-70",
    accent: "text-accent font-bold",
    financeIn: "text-finance-in font-bold",
    financeOut: "text-finance-out font-bold",
  };

  const rawFormatted = formatCurrency(absAmount, showSymbol);
  const formatted =
    typeof rawFormatted === "string"
      ? rawFormatted.replace(/\u00a0|\u202f/g, " ")
      : rawFormatted;

  return (
    <span
      className={`inline-flex flex-wrap items-baseline gap-x-1 tabular-nums break-words ${variants[variant] || variants.default} ${className}`}
    >
      {isNegative && <span>-</span>}
      <span>{formatted}</span>
    </span>
  );
};

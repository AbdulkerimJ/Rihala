import React from "react";
import { formatStatusLabel } from "../../utils/formatters";

const STATUS_STYLES = {
  active: "bg-success/10 text-success",
  inactive: "bg-danger/10 text-danger",
  invited: "bg-warning/10 text-warning",
  pending: "bg-warning/10 text-warning",
  in_progress: "bg-brand/10 text-brand",
  ready: "bg-accent/10 text-accent",
  completed: "bg-success/10 text-success",
  cancelled: "bg-danger/10 text-danger",
};

export const StatusBadge = ({ status, label, className = "" }) => {
  const resolvedLabel = label || formatStatusLabel(status || "");
  const resolvedClassName = STATUS_STYLES[status] || "bg-main text-secondary";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${resolvedClassName} ${className}`}
    >
      {resolvedLabel}
    </span>
  );
};

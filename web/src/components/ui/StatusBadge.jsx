import React from "react";
import { formatStatusLabel } from "../../utils/formatters";

const STATUS_STYLES = {
  active: "bg-success/10 text-success border border-success/20",
  inactive: "bg-danger/10 text-danger border border-danger/20",
  invited: "bg-warning/10 text-warning border border-warning/20",
  pending: "bg-warning/10 text-warning border border-warning/20",
  in_progress: "bg-brand/10 text-brand border border-brand/20",
  ready: "bg-accent/10 text-accent border border-accent/20",
  completed: "bg-success/10 text-success border border-success/20",
  cancelled: "bg-danger/10 text-danger border border-danger/20",
  voided: "bg-danger/10 text-danger border border-danger/20",
  ACTIVE: "bg-success/10 text-success border border-success/20",
  COMPLETED: "bg-success/10 text-success border border-success/20",
  CANCELLED: "bg-danger/10 text-danger border border-danger/20",
  VOIDED: "bg-danger/10 text-danger border border-danger/20",
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

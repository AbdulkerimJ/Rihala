import React from "react";
import { formatStatusLabel } from "../../utils/formatters";

const STATUS_STYLES = {
  active: "bg-success/10 text-success border border-success/20",
  inactive: "bg-status-cancelled/10 text-status-cancelled border border-status-cancelled/20",
  invited: "bg-status-pending/10 text-status-pending border border-status-pending/20",
  pending: "bg-status-pending/10 text-status-pending border border-status-pending/20",
  in_progress: "bg-status-processing/10 text-status-processing border border-status-processing/20",
  ready: "bg-status-shipped/10 text-status-shipped border border-status-shipped/20",
  completed: "bg-status-completed/10 text-status-completed border border-status-completed/20",
  cancelled: "bg-status-cancelled/10 text-status-cancelled border border-status-cancelled/20",
  voided: "bg-status-cancelled/10 text-status-cancelled border border-status-cancelled/20",
  valid: "bg-success/10 text-success border border-success/20",
  ACTIVE: "bg-success/10 text-success border border-success/20",
  COMPLETED: "bg-status-completed/10 text-status-completed border border-status-completed/20",
  CANCELLED: "bg-status-cancelled/10 text-status-cancelled border border-status-cancelled/20",
  VOIDED: "bg-status-cancelled/10 text-status-cancelled border border-status-cancelled/20",
  VALID: "bg-success/10 text-success border border-success/20",
  PENDING: "bg-status-pending/10 text-status-pending border border-status-pending/20",
  IN_PROGRESS: "bg-status-processing/10 text-status-processing border border-status-processing/20",
  READY: "bg-status-shipped/10 text-status-shipped border border-status-shipped/20",
  PRESENT: "bg-success/10 text-success border border-success/20",
  ABSENT: "bg-danger/10 text-danger border border-danger/20",
  PERMISSION: "bg-warning/10 text-warning border border-warning/20",
  present: "bg-success/10 text-success border border-success/20",
  absent: "bg-danger/10 text-danger border border-danger/20",
  permission: "bg-warning/10 text-warning border border-warning/20",
  PAID: "bg-success/10 text-success border border-success/20",
  PARTIALLY_PAID: "bg-warning/10 text-warning border border-warning/20",
  UNPAID: "bg-danger/10 text-danger border border-danger/20",
};

const DOT_COLORS = {
  active: "bg-success",
  completed: "bg-status-completed",
  valid: "bg-success",
  present: "bg-success",
  ACTIVE: "bg-success",
  COMPLETED: "bg-status-completed",
  VALID: "bg-success",
  PRESENT: "bg-success",
  pending: "bg-status-pending",
  invited: "bg-status-pending",
  PENDING: "bg-status-pending",
  permission: "bg-warning",
  PERMISSION: "bg-warning",
  in_progress: "bg-status-processing",
  IN_PROGRESS: "bg-status-processing",
  ready: "bg-status-shipped",
  READY: "bg-status-shipped",
  inactive: "bg-status-cancelled",
  cancelled: "bg-status-cancelled",
  voided: "bg-status-cancelled",
  absent: "bg-danger",
  CANCELLED: "bg-status-cancelled",
  VOIDED: "bg-status-cancelled",
  ABSENT: "bg-danger",
  PAID: "bg-success",
  PARTIALLY_PAID: "bg-warning",
  UNPAID: "bg-danger",
};

export const StatusBadge = ({ status, label, showDot = false, className = "" }) => {
  const resolvedLabel = label || formatStatusLabel(status || "");
  const resolvedClassName = STATUS_STYLES[status] || "bg-accent/10 text-accent border border-accent/20";
  const dotColor = DOT_COLORS[status] || "bg-current";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${resolvedClassName} ${className}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${dotColor}`} />
      )}
      {resolvedLabel}
    </span>
  );
};

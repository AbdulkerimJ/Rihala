import React from "react";
import { formatStatusLabel } from "../../utils/formatters";

const STATUS_STYLES = {
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  inactive: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
  invited: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  in_progress: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  ready: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  cancelled: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
  voided: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
  valid: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  ACTIVE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  CANCELLED: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
  VOIDED: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
  VALID: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  PENDING: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  IN_PROGRESS: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  READY: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
  PRESENT: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  ABSENT: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
  PERMISSION: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  present: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  absent: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
  permission: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
};

const DOT_COLORS = {
  active: "bg-emerald-500",
  completed: "bg-emerald-500",
  valid: "bg-emerald-500",
  present: "bg-emerald-500",
  ACTIVE: "bg-emerald-500",
  COMPLETED: "bg-emerald-500",
  VALID: "bg-emerald-500",
  PRESENT: "bg-emerald-500",
  pending: "bg-amber-500",
  invited: "bg-amber-500",
  PENDING: "bg-amber-500",
  permission: "bg-amber-500",
  PERMISSION: "bg-amber-500",
  in_progress: "bg-blue-500",
  IN_PROGRESS: "bg-blue-500",
  ready: "bg-purple-500",
  READY: "bg-purple-500",
  inactive: "bg-rose-500",
  cancelled: "bg-rose-500",
  voided: "bg-rose-500",
  absent: "bg-rose-500",
  CANCELLED: "bg-rose-500",
  VOIDED: "bg-rose-500",
  ABSENT: "bg-rose-500",
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

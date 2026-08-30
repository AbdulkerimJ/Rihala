import React from "react";
import { Check, XCircle, AlertTriangle, X } from "lucide-react";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_CONFIG,
  ORDER_LIFECYCLE_STEPS,
  getAllowedOrderTransitions,
} from "../constants";

export const OrderStatusPipeline = ({
  status,
  onStatusChange,
  onCancelClick,
  isPending = false,
}) => {
  const isCancelled = status === "cancelled";
  const currentStatusConfig =
    ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.pending;
  const allowedTransitions = getAllowedOrderTransitions(status);

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-border/40 pb-4">
        <div>
          <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            Production Stage Pipeline
          </h3>
          <p className="text-xs text-secondary mt-0.5">
            Live tracking from order reception to workshop delivery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-secondary">Current Stage:</span>
          <StatusBadge status={status} showDot />
        </div>
      </div>

      {isCancelled ? (
        <div className="flex items-start gap-3.5 p-4 rounded-xl bg-status-cancelled/10 border border-status-cancelled/20 text-status-cancelled">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-status-cancelled" />
          <div>
            <h4 className="text-sm font-bold">This Order is Cancelled</h4>
            <p className="text-xs mt-1 text-status-cancelled/90">
              Production has stopped and this order is closed. No further status changes or payments can be recorded.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ORDER_LIFECYCLE_STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            const isPast = currentStatusConfig.stepIndex > idx;
            const isCurrent = currentStatusConfig.stepIndex === idx;

            const statusColorStyles = {
              amber: {
                activeBorder: "border-status-pending/40 bg-status-pending/10 text-status-pending",
                iconBox: "bg-status-pending text-white",
                pill: "bg-status-pending/20 text-status-pending",
                ring: "ring-status-pending/20",
              },
              blue: {
                activeBorder: "border-status-processing/40 bg-status-processing/10 text-status-processing",
                iconBox: "bg-status-processing text-white",
                pill: "bg-status-processing/20 text-status-processing",
                ring: "ring-status-processing/20",
              },
              purple: {
                activeBorder: "border-status-shipped/40 bg-status-shipped/10 text-status-shipped",
                iconBox: "bg-status-shipped text-white",
                pill: "bg-status-shipped/20 text-status-shipped",
                ring: "ring-status-shipped/20",
              },
              emerald: {
                activeBorder: "border-status-completed/40 bg-status-completed/10 text-status-completed",
                iconBox: "bg-status-completed text-white",
                pill: "bg-status-completed/20 text-status-completed",
                ring: "ring-status-completed/20",
              },
            };

            const colorStyle =
              statusColorStyles[step.color] || statusColorStyles.amber;

            return (
              <div
                key={step.key}
                className={`relative flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                  isCurrent
                    ? `${colorStyle.activeBorder} shadow-xs ring-2 ${colorStyle.ring}`
                    : isPast
                    ? "border-status-completed/30 bg-status-completed/5 text-status-completed"
                    : "border-border/60 bg-main/30 text-secondary opacity-60"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                    isPast
                      ? "bg-status-completed text-white"
                      : isCurrent
                      ? colorStyle.iconBox
                      : "bg-border text-secondary"
                  }`}
                >
                  {isPast ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <StepIcon className="w-4 h-4" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate">
                      {step.label}
                    </span>
                    {isCurrent && (
                      <span
                        className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md ${colorStyle.pill}`}
                      >
                        Active
                      </span>
                    )}
                    {isPast && (
                      <span className="text-[10px] font-semibold text-status-completed">
                        Done
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted truncate mt-0.5">
                    {isPast
                      ? "Completed stage"
                      : isCurrent
                      ? "In progress now"
                      : "Upcoming stage"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Status Transition Action Buttons */}
      {allowedTransitions.length > 0 && (
        <div className="mt-5 pt-4 border-t border-border/50 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-secondary font-medium">
            Available Status Actions:
          </span>
          <div className="flex flex-wrap gap-2.5">
            <Can permission="orders.update">
              {allowedTransitions.map((targetStatus) => {
                const targetConfig = ORDER_STATUS_CONFIG[targetStatus];
                const isCancelAction = targetStatus === "cancelled";

                const actionButtonStyles = {
                  in_progress:
                    "bg-status-processing hover:opacity-90 text-white shadow-xs",
                  ready:
                    "bg-status-shipped hover:opacity-90 text-white shadow-xs",
                  completed:
                    "bg-status-completed hover:opacity-90 text-white shadow-xs",
                  cancelled: "",
                };

                if (isCancelAction) {
                  return (
                    <Button
                      key={targetStatus}
                      variant="danger-ghost"
                      size="sm"
                      leftIcon={XCircle}
                      onClick={onCancelClick}
                      disabled={isPending}
                    >
                      Cancel Order
                    </Button>
                  );
                }

                const TargetIcon = targetConfig?.icon || Check;

                return (
                  <button
                    key={targetStatus}
                    type="button"
                    onClick={() => onStatusChange(targetStatus)}
                    disabled={isPending}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      actionButtonStyles[targetStatus] ||
                      "bg-accent text-white hover:bg-accent-hover"
                    }`}
                  >
                    <TargetIcon className="w-3.5 h-3.5" />
                    Mark as {ORDER_STATUS_LABELS[targetStatus]}
                  </button>
                );
              })}
            </Can>
          </div>
        </div>
      )}
    </div>
  );
};

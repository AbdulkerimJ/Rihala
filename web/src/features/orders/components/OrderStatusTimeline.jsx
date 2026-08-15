import React from "react";
import { DetailSection } from "../../../components/ui/DetailSection";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { formatDateTime } from "../../../utils/formatters";
import { ORDER_STATUS_CONFIG } from "../constants";

export const OrderStatusTimeline = ({ statusHistory = [], createdBy }) => {
  if (!statusHistory || statusHistory.length === 0) return null;

  return (
    <DetailSection title="Status Audit Timeline">
      <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
        {statusHistory.map((historyItem, idx) => {
          const historyConfig =
            ORDER_STATUS_CONFIG[historyItem.status] || ORDER_STATUS_CONFIG.pending;

          return (
            <div key={idx} className="relative">
              <span
                className={`absolute -left-6 top-1 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-surface ${
                  historyConfig.bgLight
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    historyItem.status === "completed"
                      ? "bg-status-completed"
                      : historyItem.status === "in_progress"
                      ? "bg-status-processing"
                      : historyItem.status === "ready"
                      ? "bg-status-shipped"
                      : historyItem.status === "cancelled"
                      ? "bg-status-cancelled"
                      : "bg-status-pending"
                  }`}
                />
              </span>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <StatusBadge
                    status={historyItem.status}
                    className="text-[11px] px-2 py-0.5"
                  />
                  <span className="text-[11px] text-muted">
                    {formatDateTime(historyItem.changedAt)}
                  </span>
                </div>
                {historyItem.changedBy && (
                  <span className="text-xs text-secondary mt-0.5">
                    by {historyItem.changedBy?.name || createdBy?.name || "System"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </DetailSection>
  );
};

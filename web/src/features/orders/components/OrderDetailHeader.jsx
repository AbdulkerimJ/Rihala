import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Edit3, Plus, Check } from "lucide-react";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";
import { formatDate } from "../../../utils/formatters";

export const OrderDetailHeader = ({
  order,
  isFullyPaid,
  remainingBalance,
  onOpenEditModal,
  onOpenPaymentModal,
}) => {
  const isCompleted = order?.status === "completed";
  const isCancelled = order?.status === "cancelled";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-surface p-5 shadow-sm sm:flex sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4 relative z-10">
        <Link
          to="/orders"
          className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-border/60 bg-surface/50 text-secondary hover:text-primary hover:bg-main hover:shadow-sm transition-all shrink-0 backdrop-blur-sm"
          title="Back to orders"
          aria-label="Back to orders"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary font-display tracking-tight flex items-center gap-2">
              Order{" "}
              {order?.orderNumber ? (
                <span className="font-mono px-3 py-1 rounded-xl bg-status-processing/10 text-status-processing text-xl border border-status-processing/20 shadow-[0_0_10px_rgba(var(--color-status-processing),0.1)]">
                  #{order.orderNumber}
                </span>
              ) : (
                "Details"
              )}
            </h1>
            <StatusBadge
              status={order?.status}
              showDot
              className="text-xs px-3 py-1 font-semibold"
            />
            {isFullyPaid && (
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-success/10 text-success border border-success/20 shadow-[0_0_10px_rgba(var(--color-success),0.15)]">
                <Check className="w-3.5 h-3.5" /> Fully Paid
              </span>
            )}
          </div>
          <p className="text-sm text-secondary">
            Created on {formatDate(order?.date || order?.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-0 relative z-10">
        <Can permission="orders.update">
          {!isCompleted && !isCancelled && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={Edit3}
              onClick={onOpenEditModal}
            >
              Edit Order
            </Button>
          )}
        </Can>

        <Can permission="customerPayments.create">
          {remainingBalance > 0 && !isCancelled && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={Plus}
              onClick={onOpenPaymentModal}
            >
              Receive Payment
            </Button>
          )}
        </Can>
      </div>
    </div>
  );
};

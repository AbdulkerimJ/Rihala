import React from "react";
import { Plus, Receipt } from "lucide-react";
import { DetailSection } from "../../../components/ui/DetailSection";
import { DataTable } from "../../../components/ui/DataTable";
import { Button } from "../../../components/ui/Button";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { Can } from "../../../components/Can";
import { formatDate } from "../../../utils/formatters";

export const OrderPaymentsSection = ({
  order,
  payments = [],
  totalPaid,
  remainingBalance,
  isLoading = false,
  onOpenPaymentModal,
  onVoidPayment,
}) => {
  const isCancelled = order?.status === "cancelled";

  const paymentColumns = [
    {
      header: "Payment Date",
      accessor: (row) => formatDate(row.paymentDate),
      className: "text-secondary",
    },
    {
      header: "Amount",
      accessor: (row) => (
        <MoneyDisplay
          amount={row.amount}
          className={
            row.status === "voided"
              ? "line-through opacity-50"
              : "font-bold"
          }
        />
      ),
    },
    {
      header: "Notes",
      accessor: (row) => (
        <span className="text-xs text-secondary truncate max-w-[200px] block">
          {row.note || "-"}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (row) => <StatusBadge status={row.status} showDot />,
    },
    {
      header: "Actions",
      isActions: true,
      accessor: (row) => (
        <div className="flex justify-end">
          <Can permission="customerPayments.void">
            {row.status !== "voided" && (
              <Button
                variant="ghostDanger"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onVoidPayment(row);
                }}
              >
                Void
              </Button>
            )}
          </Can>
        </div>
      ),
    },
  ];

  return (
    <DetailSection title="Customer Payments History" className="relative">
      <div className="space-y-4">
        {/* Financial overview mini banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-surface border border-border/60 shadow-sm transition-all duration-300 hover:shadow-md group relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-finance-in/5 blur-2xl rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div>
            <span className="text-xs text-secondary block">Agreed Total</span>
            <span className="text-sm sm:text-base font-bold text-primary tabular-nums">
              <MoneyDisplay amount={order?.agreedAmount} />
            </span>
          </div>
          <div className="relative z-10">
            <span className="text-xs text-finance-in block font-medium">
              Paid to Date
            </span>
            <span className="text-sm sm:text-base font-bold text-finance-in tabular-nums">
              <MoneyDisplay amount={totalPaid} />
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1 relative z-10">
            <span className="text-xs text-secondary block">Remaining Due</span>
            <span
              className={`text-sm sm:text-base font-bold tabular-nums ${
                remainingBalance > 0
                  ? "text-warning"
                  : "text-success"
              }`}
            >
              <MoneyDisplay amount={remainingBalance} />
            </span>
          </div>
        </div>

        <DataTable
          columns={paymentColumns}
          data={payments}
          keyExtractor={(row) => row._id}
          isLoading={isLoading}
          emptyState={
            <div className="text-center py-6 text-secondary text-sm">
              <Receipt className="w-8 h-8 mx-auto mb-2 text-muted opacity-50" />
              <p>No customer payments recorded for this order yet.</p>
              <Can permission="customerPayments.create">
                {remainingBalance > 0 && !isCancelled && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    leftIcon={Plus}
                    onClick={onOpenPaymentModal}
                  >
                    Record Initial Payment
                  </Button>
                )}
              </Can>
            </div>
          }
        />
      </div>
    </DetailSection>
  );
};

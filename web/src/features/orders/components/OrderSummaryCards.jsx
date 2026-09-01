import React from "react";
import { Link } from "react-router-dom";
import { User, Wallet, CreditCard, ChevronRight, ExternalLink, X } from "lucide-react";
import { SummaryCard } from "../../../components/ui/SummaryCard";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { ORDER_STATUS_LABELS, ORDER_STATUS_CONFIG } from "../constants";
import { ProgressBar } from "../../../components/ui/ProgressBar";

export const OrderSummaryCards = ({
  order,
  totalPaid,
  remainingBalance,
  paymentProgress,
  isFullyPaid,
  daysUntilDue,
  canReadCustomers = false,
}) => {
  const currentStatusConfig =
    ORDER_STATUS_CONFIG[order?.status] || ORDER_STATUS_CONFIG.pending;
  const isCompleted = order?.status === "completed";
  const isCancelled = order?.status === "cancelled";

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Customer */}
      <SummaryCard
        title="Customer"
        variant="blue"
        icon={User}
        value={
          <div className="flex items-center gap-1.5 group-hover:text-accent transition-colors">
            <span className="truncate">
              {order.customer?.name || order.customerName || "Unknown"}
            </span>
            {canReadCustomers && (
              <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0" />
            )}
          </div>
        }
        subtitle={
          order.customerPhone || order.customer?.phone
            ? `📞 ${order.customerPhone || order.customer?.phone}`
            : "No phone recorded"
        }
        className={canReadCustomers ? "cursor-pointer" : ""}
      >
        {canReadCustomers && (
          <Link
            to="/customers"
            className="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1"
          >
            View all customers <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </SummaryCard>

      {/* Card 2: Agreed Amount */}
      <SummaryCard
        title="Agreed Amount"
        variant="emerald"
        icon={Wallet}
        value={
          <MoneyDisplay
            amount={order.agreedAmount}
            className="text-primary font-bold"
          />
        }
        subtitle="Agreed project total"
      >
        <div className="flex items-center justify-between text-xs text-secondary">
          <span>Payment status:</span>
          <span
            className={`font-semibold ${
              isFullyPaid
                ? "text-success"
                : totalPaid > 0
                ? "text-warning"
                : "text-danger"
            }`}
          >
            {isFullyPaid
              ? "Settled in Full"
              : totalPaid > 0
              ? "Partially Paid"
              : "Unpaid"}
          </span>
        </div>
      </SummaryCard>

      {/* Card 3: Total Paid & Balance */}
      <SummaryCard
        title="Total Paid"
        variant="teal"
        icon={CreditCard}
        value={
          <MoneyDisplay
            amount={totalPaid}
            variant="financeIn"
          />
        }
        subtitle={
          isFullyPaid
            ? "Fully settled"
            : `Balance: ${formatCurrency(remainingBalance)}`
        }
      >
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-secondary font-medium">
            <span>{paymentProgress}% paid</span>
            <span>{isFullyPaid ? "Fully Paid" : `${formatCurrency(remainingBalance)} left`}</span>
          </div>
          <ProgressBar 
            progress={paymentProgress} 
            variant={isFullyPaid ? 'success' : totalPaid > 0 ? 'warning' : 'financeIn'} 
            size="sm" 
            animated={!isFullyPaid} 
          />
        </div>
      </SummaryCard>

      {/* Card 4: Status / Completion */}
      <SummaryCard
        title="Order Status"
        variant={currentStatusConfig.variant}
        icon={currentStatusConfig.icon}
        value={
          <span className={currentStatusConfig.textClass}>
            {ORDER_STATUS_LABELS[order.status] || order.status}
          </span>
        }
        subtitle={currentStatusConfig.subtitle}
      >
        <div className="flex items-center justify-between text-xs">
          <span className="text-secondary">Due date:</span>
          <span
            className={`font-semibold ${
              isCompleted
                ? "text-success"
                : daysUntilDue !== null && daysUntilDue < 0
                ? "text-danger"
                : "text-primary"
            }`}
          >
            {formatDate(order.expectedCompletionDate)}
            {daysUntilDue !== null && !isCompleted && !isCancelled && (
              <span className="ml-1 text-[11px] font-normal text-secondary">
                ({daysUntilDue > 0
                  ? `${daysUntilDue}d left`
                  : daysUntilDue === 0
                  ? "Today"
                  : `${Math.abs(daysUntilDue)}d overdue`})
              </span>
            )}
          </span>
        </div>
      </SummaryCard>
    </div>
  );
};

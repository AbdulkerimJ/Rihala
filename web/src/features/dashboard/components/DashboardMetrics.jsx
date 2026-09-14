import { TrendingUp, TrendingDown, Wallet, ShoppingCart } from "lucide-react";
import { Can } from "../../../components/Can";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { InlineSkeleton } from "../../../components/ui/skeletons";

export const DashboardMetrics = ({
  stats,
  loadingStats,
  reports,
  loadingReports,
  periodLabel = "this month",
  hideStats = false,
}) => {
  const cashIn = reports?.cashFlow?.cashIn || 0;
  const cashOut = reports?.cashFlow?.cashOut || 0;
  const net = reports?.cashFlow?.net || 0;

  const activeOrdersCount = (stats?.pendingOrders || 0) + (stats?.inProgressOrders || 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Total Revenue */}
      <Can permission="customerPayments.read">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-secondary truncate">
              Total Revenue
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-finance-in/10 text-finance-in shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            {loadingReports ? (
              <InlineSkeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl lg:text-3xl font-bold tracking-tight text-primary tabular-nums">
                <MoneyDisplay amount={cashIn} />
              </div>
            )}
            <p className="text-xs text-muted mt-1.5 truncate capitalize">
              Customer receipts ({periodLabel})
            </p>
          </div>
        </div>
      </Can>

      {/* 2. Total Expenses */}
      <Can permission="analytics.read">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-secondary truncate">
              Total Expenses
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-finance-out/10 text-finance-out shrink-0">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            {loadingReports ? (
              <InlineSkeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl lg:text-3xl font-bold tracking-tight text-primary tabular-nums">
                <MoneyDisplay amount={cashOut} />
              </div>
            )}
            <p className="text-xs text-muted mt-1.5 truncate capitalize">
              Total outlay ({periodLabel})
            </p>
          </div>
        </div>
      </Can>

      {/* 3. Net Balance */}
      <Can permissions={["customerPayments.read", "analytics.read"]} mode="all">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-secondary truncate">
              Net Balance
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            {loadingReports ? (
              <InlineSkeleton className="h-8 w-24" />
            ) : (
              <div
                className={`text-2xl lg:text-3xl font-bold tracking-tight tabular-nums ${
                  net >= 0 ? "text-primary" : "text-finance-out"
                }`}
              >
                <MoneyDisplay amount={net} />
              </div>
            )}
            <p className="text-xs text-muted mt-1.5 truncate capitalize">
              Revenue minus expenses ({periodLabel})
            </p>
          </div>
        </div>
      </Can>

      {/* 4. Active Orders */}
      {!hideStats && (
        <Can permission="orders.read">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-secondary truncate">
                Active Orders
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand shrink-0">
                <ShoppingCart className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              {loadingStats ? (
                <InlineSkeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl lg:text-3xl font-bold tracking-tight text-primary tabular-nums">
                  {activeOrdersCount}
                </div>
              )}
              <p className="text-xs text-muted mt-1.5 truncate">
                {stats?.pendingOrders || 0} pending • {stats?.inProgressOrders || 0} in progress
              </p>
            </div>
          </div>
        </Can>
      )}
    </div>
  );
};

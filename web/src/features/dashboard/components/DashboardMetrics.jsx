import { TrendingUp, TrendingDown, Wallet, ShoppingCart } from "lucide-react";
import { Can } from "../../../components/Can";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { InlineSkeleton } from "../../../components/ui/skeletons";

/**
 * Stat card — always a compact horizontal row (icon | label + value).
 *
 * Text scale rationale:
 *   mobile (<640):   2-col → card ≈47vw  → value text-sm
 *   sm    (≥640):    2-col → card ≈46vw  → value text-base
 *   md    (≥768):    2-col → card ≈46vw  → value text-lg
 *   lg    (≥1024):   4-col → card ≈23vw  → value text-base  (narrower card!)
 *   xl    (≥1280):   4-col → card ≈23vw  → value text-xl
 */
const StatCard = ({ icon, iconBg, iconColor, label, sublabel, loading, valueEl }) => (
  <div
    className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden
      flex flex-row items-center
      gap-2.5 px-3 py-2.5
      sm:gap-3 sm:px-4 sm:py-3
      xl:gap-4 xl:px-5 xl:py-4"
  >
    {/* Icon */}
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg
        h-8 w-8
        sm:h-9 sm:w-9
        xl:h-10 xl:w-10 xl:rounded-xl
        ${iconBg} ${iconColor}`}
    >
      {icon}
    </div>

    {/* Text stack */}
    <div className="flex flex-col min-w-0 flex-1">
      <span className="text-[10px] sm:text-[11px] xl:text-xs font-medium text-secondary leading-tight truncate">
        {label}
      </span>
      <div className="mt-0.5">
        {loading ? (
          <InlineSkeleton className="h-4 sm:h-5 xl:h-6 w-14 sm:w-16 xl:w-20 mt-0.5" />
        ) : (
          valueEl
        )}
      </div>
      {sublabel && (
        <p className="hidden xl:block text-[10px] text-muted mt-0.5 truncate">
          {sublabel}
        </p>
      )}
    </div>
  </div>
);

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

  // Value text: grows sm→md, shrinks at lg (4-col makes cards narrower), grows again at xl
  const valueBase = "font-bold tracking-tight tabular-nums leading-none";
  const valueSz   = "text-sm sm:text-base md:text-lg lg:text-base xl:text-xl";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 xl:gap-4">

      {/* 1. Total Revenue */}
      <Can permission="customerPayments.read">
        <StatCard
          icon={<TrendingUp className="h-4 w-4 xl:h-5 xl:w-5" />}
          iconBg="bg-finance-in/10"
          iconColor="text-finance-in"
          label="Revenue"
          sublabel={`Customer receipts · ${periodLabel}`}
          loading={loadingReports}
          valueEl={
            <div className={`${valueBase} ${valueSz} text-primary`}>
              <MoneyDisplay amount={cashIn} />
            </div>
          }
        />
      </Can>

      {/* 2. Total Expenses */}
      <Can permission="analytics.read">
        <StatCard
          icon={<TrendingDown className="h-4 w-4 xl:h-5 xl:w-5" />}
          iconBg="bg-finance-out/10"
          iconColor="text-finance-out"
          label="Expenses"
          sublabel={`Total outlay · ${periodLabel}`}
          loading={loadingReports}
          valueEl={
            <div className={`${valueBase} ${valueSz} text-primary`}>
              <MoneyDisplay amount={cashOut} />
            </div>
          }
        />
      </Can>

      {/* 3. Net Balance */}
      <Can permissions={["customerPayments.read", "analytics.read"]} mode="all">
        <StatCard
          icon={<Wallet className="h-4 w-4 xl:h-5 xl:w-5" />}
          iconBg="bg-accent/10"
          iconColor="text-accent"
          label="Net Balance"
          sublabel={`Revenue minus expenses · ${periodLabel}`}
          loading={loadingReports}
          valueEl={
            <div className={`${valueBase} ${valueSz} ${net >= 0 ? "text-primary" : "text-finance-out"}`}>
              <MoneyDisplay amount={net} />
            </div>
          }
        />
      </Can>

      {/* 4. Active Orders */}
      {!hideStats && (
        <Can permission="orders.read">
          <StatCard
            icon={<ShoppingCart className="h-4 w-4 xl:h-5 xl:w-5" />}
            iconBg="bg-brand/10"
            iconColor="text-brand"
            label="Active Orders"
            sublabel={`${stats?.pendingOrders || 0} pending · ${stats?.inProgressOrders || 0} in progress`}
            loading={loadingStats}
            valueEl={
              <div className={`${valueBase} ${valueSz} text-primary`}>
                {activeOrdersCount}
              </div>
            }
          />
        </Can>
      )}
    </div>
  );
};

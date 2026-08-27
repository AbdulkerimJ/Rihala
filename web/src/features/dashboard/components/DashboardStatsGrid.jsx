import React from "react";
import { TrendingUp, TrendingDown, ShoppingCart, Wallet } from "lucide-react";
import { Can } from "../../../components/Can";
import { SummaryCard } from "../../../components/ui/SummaryCard";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { InlineSkeleton } from "../../../components/ui/skeletons";

export const DashboardStatsGrid = ({
  totalRevenue,
  loadingPayments,
  totalExpenses,
  loadingExpenses,
  activeOrdersCount,
  loadingOrders,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <Can permission="customerPayments.read">
        <SummaryCard
          title="Total Received"
          value={
            loadingPayments ? (
              <InlineSkeleton className="h-6 w-24 mt-1" />
            ) : (
              <MoneyDisplay amount={totalRevenue} />
            )
          }
          icon={TrendingUp}
          variant="success"
          subtitle="Total customer receipts"
        />
      </Can>

      <Can permission="expenses.read">
        <SummaryCard
          title="Total Expenses"
          value={
            loadingExpenses ? (
              <InlineSkeleton className="h-6 w-24 mt-1" />
            ) : (
              <MoneyDisplay amount={totalExpenses} />
            )
          }
          icon={TrendingDown}
          variant="danger"
          subtitle="Total recorded expenses"
        />
      </Can>

      <Can permission="orders.read">
        <SummaryCard
          title="Active Orders"
          value={
            loadingOrders ? (
              <InlineSkeleton className="h-6 w-12 mt-1" />
            ) : (
              activeOrdersCount
            )
          }
          icon={ShoppingCart}
          variant="brand"
          subtitle="In production & pending"
        />
      </Can>

      <Can permissions={["customerPayments.read", "expenses.read"]} mode="all">
        <SummaryCard
          title="Net Balance"
          value={
            loadingPayments || loadingExpenses ? (
              <InlineSkeleton className="h-6 w-24 mt-1" />
            ) : (
              <MoneyDisplay amount={totalRevenue - totalExpenses} />
            )
          }
          icon={Wallet}
          variant="accent"
          subtitle="Revenue minus expenses"
        />
      </Can>
    </div>
  );
};

import { useQuery } from "@tanstack/react-query";
import { usePermission } from "../../../hooks/usePermission";
import { getOrders } from "../../orders/api";
import { getCustomerPayments } from "../../customer-payments/api";
import { getExpenses } from "../../expenses/api";
import { unwrapListResponse } from "../../../utils/apiResponse";
import { DashboardHero } from "../components/DashboardHero";
import { DashboardStatsGrid } from "../components/DashboardStatsGrid";
import { DashboardQuickShortcuts } from "../components/DashboardQuickShortcuts";
import { DashboardRecentOrders } from "../components/DashboardRecentOrders";
import { DashboardRecentReceipts } from "../components/DashboardRecentReceipts";
export const Dashboard = () => {
  const { can } = usePermission();

  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ["orders", "dashboard"],
    queryFn: () => getOrders({ limit: 4, sort: "-createdAt" }),
    enabled: can("orders.read"),
  });

  const { data: paymentsData, isLoading: loadingPayments } = useQuery({
    queryKey: ["customer-payments", "dashboard"],
    queryFn: () => getCustomerPayments({ limit: 100, sort: "-paymentDate" }),
    enabled: can("customerPayments.read"),
  });

  const { data: expensesData, isLoading: loadingExpenses } = useQuery({
    queryKey: ["expenses", "dashboard"],
    queryFn: () => getExpenses({ limit: 100 }),
    enabled: can("expenses.read"),
  });

  const orders = unwrapListResponse(ordersData).items || [];
  const payments = unwrapListResponse(paymentsData).items || [];
  const expenses = unwrapListResponse(expensesData).items || [];

  const totalRevenue = payments
    .filter((p) => p.status !== "voided")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalExpenses = expenses
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const recentPayments = payments
    .filter((p) => p.status !== "voided")
    .slice(0, 4);

  const activeOrdersCount = orders.filter(
    (o) => o.status !== "completed" && o.status !== "cancelled"
  ).length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-[fadeSlideUp_0.3s_ease_both] pb-8">
      {/* 1. Hero Greeting */}
      <DashboardHero />

      {/* 2. Top KPI Stats Grid */}
      <DashboardStatsGrid
        totalRevenue={totalRevenue}
        loadingPayments={loadingPayments}
        totalExpenses={totalExpenses}
        loadingExpenses={loadingExpenses}
        activeOrdersCount={activeOrdersCount}
        loadingOrders={loadingOrders}
      />

      {/* 3. Responsive Content Grid (Linear on Mobile, 2/3 + 1/3 Split on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Quick Shortcuts: 1st below Stats on mobile (order-1), Top-Right on desktop (lg:order-2) */}
        <div className="order-1 lg:order-2 lg:col-span-1">
          <DashboardQuickShortcuts />
        </div>

        {/* Recent Orders: 2nd on mobile (order-2), Left 2/3 column on desktop (lg:order-1) */}
        <div className="order-2 lg:order-1 lg:col-span-2 lg:row-span-2">
          <DashboardRecentOrders
            orders={orders}
            loadingOrders={loadingOrders}
          />
        </div>

        {/* Recent Receipts: 3rd on mobile (order-3), Bottom-Right on desktop (lg:order-3) */}
        <div className="order-3 lg:order-3 lg:col-span-1">
          <DashboardRecentReceipts
            recentPayments={recentPayments}
            loadingPayments={loadingPayments}
          />
        </div>
      </div>
    </div>
  );
};

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePermission } from "../../../hooks/usePermission";
import { getOrders } from "../../orders/api";
import { getCustomerPayments } from "../../customer-payments/api";
import { getDashboardStats, getAnalyticsReports } from "../api";
import { unwrapListResponse } from "../../../utils/apiResponse";

import { DashboardHeader } from "../components/DashboardHeader";
import { DashboardMetrics } from "../components/DashboardMetrics";
import { DashboardRecentOrders } from "../components/DashboardRecentOrders";
import { DashboardRecentPayments } from "../components/DashboardRecentPayments";
import { DashboardQuickActions } from "../components/DashboardQuickActions";

const getDateRange = (rangeKey) => {
  const now = new Date();
  const formatYMD = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  if (rangeKey === "this_month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { startDate: formatYMD(start), endDate: formatYMD(end), label: "this month" };
  }

  if (rangeKey === "this_year") {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31);
    return { startDate: formatYMD(start), endDate: formatYMD(end), label: "this year" };
  }

  // all_time
  return { startDate: undefined, endDate: undefined, label: "all time" };
};

export const Dashboard = () => {
  const { can } = usePermission();
  const [timeRange, setTimeRange] = useState("this_month");

  const { startDate, endDate, label: periodLabel } = useMemo(() => {
    return getDateRange(timeRange);
  }, [timeRange]);

  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: getDashboardStats,
    enabled: can("dashboard.read"),
  });

  const { data: reportsData, isLoading: loadingReports } = useQuery({
    queryKey: ["dashboard", "reports", timeRange, startDate, endDate],
    queryFn: () => getAnalyticsReports(startDate, endDate),
    enabled: can("analytics.read"),
  });

  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ["orders", "dashboard", "recent"],
    queryFn: () => getOrders({ limit: 5, sort: "-createdAt" }),
    enabled: can("orders.read"),
  });

  const { data: paymentsData, isLoading: loadingPayments } = useQuery({
    queryKey: ["customer-payments", "dashboard", "recent"],
    queryFn: () => getCustomerPayments({ limit: 4, sort: "-paymentDate" }),
    enabled: can("customerPayments.read"),
  });

  const orders = unwrapListResponse(ordersData).items || [];
  const recentPayments = unwrapListResponse(paymentsData).items || [];

  return (
    <div className="space-y-6 sm:space-y-8 animate-[fadeSlideUp_0.3s_ease_both] pb-8">
      {/* 1. Header with Time Selector */}
      <DashboardHeader
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />

      {/* 2. Metrics (Total Revenue, Expenses, Net Balance, Active Orders) */}
      <DashboardMetrics
        stats={statsData}
        loadingStats={loadingStats}
        reports={reportsData}
        loadingReports={loadingReports}
        periodLabel={periodLabel}
      />

      {/* 3. Main Content: Recent Orders (Left) + Quick Actions & Recent Receipts (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <DashboardRecentOrders
            orders={orders}
            loadingOrders={loadingOrders}
          />
        </div>

        <div className="space-y-6">
          <DashboardQuickActions />
          <DashboardRecentPayments
            payments={recentPayments}
            loadingPayments={loadingPayments}
          />
        </div>
      </div>
    </div>
  );
};

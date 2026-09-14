import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePermission } from "../../../hooks/usePermission";
import { PageHeader } from "../../../components/ui/PageHeader";
import { TimeRangeTabs } from "../../../components/ui/TimeRangeTabs";
import { Can } from "../../../components/Can";

import { 
  getAnalyticsReports,
  getCashFlowTrend,
  getOrdersTrend,
  getExpensesByCategory,
  getPurchasesByCategory,
  getEmployeePaymentsByType,
  getContractorCostTrend,
  getEmployeeCostTrend
} from "../api";

import { CostBreakdownDonut } from "../components/analytics/CostBreakdownDonut";
import { OrdersByStatusChart } from "../components/analytics/OrdersByStatusChart";
import { ExpensesByCategoryChart } from "../components/analytics/ExpensesByCategoryChart";
import { CashFlowTrendChart } from "../components/analytics/CashFlowTrendChart";
import { OrdersTrendChart } from "../components/analytics/OrdersTrendChart";
import { EmployeeCostTrendChart } from "../components/analytics/EmployeeCostTrendChart";
import { ContractorCostTrendChart } from "../components/analytics/ContractorCostTrendChart";
import { PurchasesByCategoryChart } from "../components/analytics/PurchasesByCategoryChart";
import { EmployeePaymentTypeDonut } from "../components/analytics/EmployeePaymentTypeDonut";
import { DashboardMetrics } from "../components/DashboardMetrics";

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

  return { startDate: undefined, endDate: undefined, label: "all time" };
};

export const Analytics = () => {
  const { can } = usePermission();
  const [timeRange, setTimeRange] = useState("this_year");

  const { startDate, endDate, label: periodLabel } = useMemo(() => {
    return getDateRange(timeRange);
  }, [timeRange]);

  const { data: reportsData, isLoading: loadingReports } = useQuery({
    queryKey: ["analytics", "reports", timeRange, startDate, endDate],
    queryFn: () => getAnalyticsReports(startDate, endDate),
    enabled: can("analytics.read"),
  });

  const { data: cashFlowTrend, isLoading: loadingCashFlowTrend } = useQuery({
    queryKey: ["analytics", "cashFlowTrend", timeRange, startDate, endDate],
    queryFn: () => getCashFlowTrend(startDate, endDate),
    enabled: can("analytics.read"),
  });

  const { data: ordersTrend, isLoading: loadingOrdersTrend } = useQuery({
    queryKey: ["analytics", "ordersTrend", timeRange, startDate, endDate],
    queryFn: () => getOrdersTrend(startDate, endDate),
    enabled: can("analytics.read"),
  });

  const { data: expensesByCategory, isLoading: loadingExpensesByCategory } = useQuery({
    queryKey: ["analytics", "expensesByCategory", timeRange, startDate, endDate],
    queryFn: () => getExpensesByCategory(startDate, endDate),
    enabled: can("analytics.read"),
  });

  const { data: purchasesByCategory, isLoading: loadingPurchasesByCategory } = useQuery({
    queryKey: ["analytics", "purchasesByCategory", timeRange, startDate, endDate],
    queryFn: () => getPurchasesByCategory(startDate, endDate),
    enabled: can("analytics.read"),
  });

  const { data: employeePaymentsByType, isLoading: loadingEmployeePaymentsByType } = useQuery({
    queryKey: ["analytics", "employeePaymentsByType", timeRange, startDate, endDate],
    queryFn: () => getEmployeePaymentsByType(startDate, endDate),
    enabled: can("analytics.read"),
  });

  const { data: employeeCostTrend, isLoading: loadingEmployeeCostTrend } = useQuery({
    queryKey: ["analytics", "employeeCostTrend", timeRange, startDate, endDate],
    queryFn: () => getEmployeeCostTrend(startDate, endDate),
    enabled: can("analytics.read"),
  });

  const { data: contractorCostTrend, isLoading: loadingContractorCostTrend } = useQuery({
    queryKey: ["analytics", "contractorCostTrend", timeRange, startDate, endDate],
    queryFn: () => getContractorCostTrend(startDate, endDate),
    enabled: can("analytics.read"),
  });

  return (
    <div className="space-y-8 animate-[fadeSlideUp_0.3s_ease_both] pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
            Analytics
          </h1>
          <p className="text-sm text-secondary mt-0.5">
            View detailed analytics and reports.
          </p>
        </div>
        <div className="self-start sm:self-auto w-full sm:w-auto">
          <TimeRangeTabs timeRange={timeRange} onTimeRangeChange={setTimeRange} />
        </div>
      </div>

      <Can permission="analytics.read">
        <div className="space-y-6">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <CashFlowTrendChart data={cashFlowTrend} isLoading={loadingCashFlowTrend} />
            <CostBreakdownDonut data={reportsData?.costBreakdown} isLoading={loadingReports} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <OrdersTrendChart data={ordersTrend} isLoading={loadingOrdersTrend} />
            <PurchasesByCategoryChart data={purchasesByCategory} isLoading={loadingPurchasesByCategory} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <EmployeeCostTrendChart data={employeeCostTrend} isLoading={loadingEmployeeCostTrend} />
            <EmployeePaymentTypeDonut data={employeePaymentsByType} isLoading={loadingEmployeePaymentsByType} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ContractorCostTrendChart data={contractorCostTrend} isLoading={loadingContractorCostTrend} />
            <div className="hidden lg:block"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ExpensesByCategoryChart data={expensesByCategory} isLoading={loadingExpensesByCategory} className="lg:col-span-2" />
            <OrdersByStatusChart data={reportsData?.ordersByStatus} isLoading={loadingReports} />
          </div>
        </div>
      </Can>
    </div>
  );
};

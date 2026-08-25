import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getEmployeeById, getEmployeeStats } from "../api";
import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { SummaryCard } from "../../../components/ui/SummaryCard";
import { DetailSection } from "../../../components/ui/DetailSection";
import { SystemInfoSection } from "../../../components/ui/SystemInfoSection";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { getApiErrorMessage, unwrapEntityResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";
import { usePermission } from "../../../hooks/usePermission";
import { User, Briefcase, Calendar, ArrowLeft, TrendingUp, TrendingDown, Wallet } from "lucide-react";

export const EmployeeDetail = () => {
  const { id } = useParams();
  const { can } = usePermission();
  
  const employeeQuery = useQuery({
    queryKey: ["employees", id],
    queryFn: () => getEmployeeById(id),
    enabled: !!id,
  });

  const statsQuery = useQuery({
    queryKey: ["employees", id, "stats"],
    queryFn: () => getEmployeeStats(id),
    enabled: !!id && can("employees.read"),
  });

  const employee = unwrapEntityResponse(employeeQuery.data);
  const stats = statsQuery.data?.data ?? null;

  if (employeeQuery.isLoading) return <DetailSkeleton />;
  
  if (employeeQuery.isError || !employee) {
    return <ErrorState description={getApiErrorMessage(employeeQuery.error, "Failed to load employee details.")} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/employees"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-surface text-secondary hover:text-primary hover:bg-main transition-colors shrink-0"
            title="Back to employees"
            aria-label="Back to employees"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-primary font-display tracking-tight">{employee.name}</h1>
              <StatusBadge status={employee.status} />
            </div>
            <p className="text-sm text-secondary">{employee.phone || "No phone provided"}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard 
          title="Phone" 
          value={employee.phone || "Not specified"} 
          icon={User}
        />
        <SummaryCard 
          title="Employment Start" 
          value={formatDate(employee.employmentStartDate)} 
          icon={Calendar}
        />
        <SummaryCard 
          title="Employment End" 
          value={employee.employmentEndDate ? formatDate(employee.employmentEndDate) : "Ongoing"} 
          icon={Briefcase}
        />
      </div>

      {/* Financial Ledger */}
      <DetailSection title="Financial Ledger">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="bg-main/50 rounded-lg p-4 border border-border/50 space-y-1">
            <div className="flex items-center gap-2 text-secondary text-xs font-medium uppercase tracking-wider mb-2">
              <TrendingUp className="w-3.5 h-3.5" />
              Lifetime Earned
            </div>
            {statsQuery.isLoading ? (
              <div className="h-7 w-32 bg-main animate-pulse rounded" />
            ) : (
              <MoneyDisplay amount={stats?.totalEarned ?? 0} className="text-xl font-bold text-primary" />
            )}
            <p className="text-xs text-secondary">From all closed payrolls</p>
          </div>
          <div className="bg-main/50 rounded-lg p-4 border border-border/50 space-y-1">
            <div className="flex items-center gap-2 text-secondary text-xs font-medium uppercase tracking-wider mb-2">
              <TrendingDown className="w-3.5 h-3.5" />
              Total Paid
            </div>
            {statsQuery.isLoading ? (
              <div className="h-7 w-32 bg-main animate-pulse rounded" />
            ) : (
              <MoneyDisplay amount={stats?.totalPaid ?? 0} className="text-xl font-bold text-primary" />
            )}
            <p className="text-xs text-secondary">Cash disbursed to employee</p>
          </div>
          <div className={`rounded-lg p-4 border space-y-1 ${
            !stats ? "bg-main/50 border-border/50" :
            stats.currentBalance >= 0 ? "bg-success/10 border-success/30" : "bg-danger/10 border-danger/30"
          }`}>
            <div className="flex items-center gap-2 text-secondary text-xs font-medium uppercase tracking-wider mb-2">
              <Wallet className="w-3.5 h-3.5" />
              Current Balance
            </div>
            {statsQuery.isLoading ? (
              <div className="h-7 w-32 bg-main animate-pulse rounded" />
            ) : (
              <MoneyDisplay
                amount={Math.abs(stats?.currentBalance ?? 0)}
                className={`text-xl font-bold ${
                  !stats || stats.currentBalance >= 0 ? "text-success" : "text-danger"
                }`}
                prefix={stats?.currentBalance < 0 ? "-" : ""}
              />
            )}
            <p className="text-xs text-secondary">
              {!stats || stats.currentBalance >= 0 ? "Owed to employee" : "Employee advance balance"}
            </p>
          </div>
        </div>
      </DetailSection>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <DetailSection title="Employment Status">
            <p className="text-primary bg-main/50 p-4 rounded-lg">
              Staff member is currently marked as <strong className="capitalize">{employee.status}</strong>.
            </p>
          </DetailSection>
        </div>

        <div className="space-y-6">
          <SystemInfoSection
            id={employee._id}
            idLabel="Employee ID"
            createdAt={employee.createdAt}
            updatedAt={employee.updatedAt}
          />
        </div>
      </div>
    </div>
  );
};

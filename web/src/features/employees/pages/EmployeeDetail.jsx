import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getEmployeeById, getEmployeeStats } from "../api";
import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { SummaryCard } from "../../../components/ui/SummaryCard";
import { DetailSection, DetailItem } from "../../../components/ui/DetailSection";
import { SystemInfoSection } from "../../../components/ui/SystemInfoSection";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { Button } from "../../../components/ui/Button";
import { getApiErrorMessage, unwrapEntityResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";
import { usePermission } from "../../../hooks/usePermission";
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, Phone, Calendar, Clock, Banknote } from "lucide-react";

export const EmployeeDetail = () => {
  const { id } = useParams();
  const { can } = usePermission();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'financials'
  
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

  const getInitials = (name) => {
    if (!name) return "?";
    return name.trim().charAt(0).toUpperCase();
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-[fadeSlideUp_0.3s_ease_both]">
      {/* ── Profile Header ── */}
      <div className="relative rounded-2xl border border-border/60 bg-surface shadow-sm p-5 sm:p-6 mt-4">
        {/* Back Button */}
        <div className="mb-4">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-xl border-border/60 shadow-sm bg-surface/50 hover:bg-main"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Profile Info */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
            {/* Avatar */}
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-accent to-accent/70 text-white font-black text-3xl shadow-lg ring-4 ring-surface">
              {getInitials(employee.name)}
            </div>
            
            <div className="space-y-1.5 mb-1">
              <h1 className="text-2xl sm:text-3xl font-black text-primary font-display tracking-tight leading-none">{employee.name}</h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm font-medium text-secondary">
                <span className="flex items-center gap-1.5 bg-main/50 px-2 py-1 rounded-md border border-border/50">
                  <Phone className="h-3.5 w-3.5" />
                  {employee.phone || "No phone"}
                </span>
                <span className="flex items-center gap-1.5 bg-main/50 px-2 py-1 rounded-md border border-border/50">
                   <Clock className="h-3.5 w-3.5" />
                   Started {formatDate(employee.employmentStartDate)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center sm:justify-end shrink-0">
            <StatusBadge status={employee.status} className="text-sm px-4 py-1.5 shadow-sm" showDot />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-main/50 p-1 rounded-xl border border-border/50 mt-6 max-w-sm mx-auto sm:mx-0">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
              activeTab === "overview" ? "bg-surface text-primary shadow-sm border border-border/50" : "text-secondary hover:text-primary"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("financials")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
              activeTab === "financials" ? "bg-surface text-primary shadow-sm border border-border/50" : "text-secondary hover:text-primary"
            }`}
          >
            Financials
          </button>
        </div>
      </div>

      {/* ── Tab Content: Overview ── */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <DetailSection title="Employment Details">
              <DetailItem label="Full Name" value={employee.name} />
              <DetailItem label="Phone Number" value={employee.phone || "Not specified"} />
              <DetailItem label="Start Date" value={formatDate(employee.employmentStartDate)} />
              <DetailItem label="End Date" value={employee.employmentEndDate ? formatDate(employee.employmentEndDate) : "Ongoing (Active)"} />
              <DetailItem label="Current Status" value={<StatusBadge status={employee.status} />} />
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
      )}

      {/* ── Tab Content: Financials ── */}
      {activeTab === "financials" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard 
              title="Lifetime Earned" 
              value={statsQuery.isLoading ? "-" : <MoneyDisplay amount={stats?.totalEarned ?? 0} />} 
              subtitle="From all closed payrolls"
              icon={TrendingUp}
              iconVariant="success"
              variant="success"
            />
            <SummaryCard 
              title="Total Paid" 
              value={statsQuery.isLoading ? "-" : <MoneyDisplay amount={stats?.totalPaid ?? 0} />} 
              subtitle="Cash disbursed to employee"
              icon={TrendingDown}
              iconVariant="brand"
              variant="brand"
            />
            <SummaryCard 
              title="Current Balance" 
              value={statsQuery.isLoading ? "-" : <MoneyDisplay amount={Math.abs(stats?.currentBalance ?? 0)} prefix={stats?.currentBalance < 0 ? "-" : ""} />} 
              subtitle={!stats || stats.currentBalance >= 0 ? "Owed to employee" : "Employee advance balance"}
              icon={Wallet}
              iconVariant={!stats || stats.currentBalance >= 0 ? "accent" : "danger"}
              variant={!stats || stats.currentBalance >= 0 ? "accent" : "danger"}
              valueClassName={!stats || stats.currentBalance >= 0 ? "text-accent" : "text-danger"}
            />
          </div>
          
          <div className="p-8 text-center rounded-xl border border-dashed border-border/80 bg-surface/50">
            <Banknote className="h-8 w-8 mx-auto text-muted mb-2" />
            <h3 className="text-lg font-bold text-primary tracking-tight">Payment History</h3>
            <p className="text-sm font-medium text-secondary max-w-md mx-auto mt-1">
              Detailed breakdown of payments and payroll slips will be integrated here in future phases.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEmployeeById, getEmployeeStats } from "../api";
import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { SummaryCard } from "../../../components/ui/SummaryCard";
import { DetailSection, DetailItem } from "../../../components/ui/DetailSection";
import { SystemInfoSection } from "../../../components/ui/SystemInfoSection";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { Button } from "../../../components/ui/Button";
import { getApiErrorMessage, unwrapEntityResponse, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate, formatDateTime } from "../../../utils/formatters";
import { usePermission } from "../../../hooks/usePermission";
import { ListGroup, ListItem } from "../../../components/ui/ListGroup";
import { getWeeklyPayrolls } from "../../weekly-payrolls/api";
import { getEmployeePayments } from "../../employee-payments/api";
import { TrendingUp, TrendingDown, Wallet, Phone, Calendar, Clock, Banknote, FileText } from "lucide-react";
import { BackButton } from "../../../components/ui/BackButton";
import { Tabs } from "../../../components/ui/Tabs";
import { EmployeePaymentModal } from "../../employee-payments/components/EmployeePaymentModal";
import { createEmployeePayment } from "../../employee-payments/api";
import { Can } from "../../../components/Can";
import toast from "react-hot-toast";

export const EmployeeDetail = () => {
  const { id } = useParams();
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'financials'
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  
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

  const { data: payrollsData, isLoading: isPayrollsLoading } = useQuery({
    queryKey: ["weekly-payrolls", "list", { employee: id }],
    queryFn: () => getWeeklyPayrolls({ employee: id, limit: 50 }),
    enabled: !!id && can("weeklyPayrolls.read"),
  });

  const { data: paymentsData, isLoading: isPaymentsLoading } = useQuery({
    queryKey: ["employee-payments", "list", { employee: id }],
    queryFn: () => getEmployeePayments({ employee: id, limit: 50 }),
    enabled: !!id && can("employeePayments.read"),
  });

  const paymentMutation = useMutation({
    mutationFn: createEmployeePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-payments"] });
      queryClient.invalidateQueries({ queryKey: ["employees", id] });
      queryClient.invalidateQueries({ queryKey: ["employees", id, "stats"] });
      toast.success("Payment recorded successfully");
      setIsPaymentOpen(false);
    },
  });

  const employee = unwrapEntityResponse(employeeQuery.data);
  const stats = statsQuery.data?.data ?? null;
  const payrolls = unwrapListResponse(payrollsData).items || [];
  const payments = unwrapListResponse(paymentsData).items || [];

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
          <BackButton />
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

          <div className="flex justify-center sm:justify-end shrink-0 gap-3">
            <Can permission="employeePayments.create">
              <Button variant="secondary" onClick={() => setIsPaymentOpen(true)}>Record Payment</Button>
            </Can>
            <StatusBadge status={employee.status} className="text-sm px-4 py-1.5 shadow-sm" showDot />
          </div>
        </div>

        {/* Tabs */}
        <Tabs 
          tabs={[
            { id: "overview", label: "Overview", icon: FileText },
            { id: "financials", label: "Financials", icon: Wallet }
          ]} 
          activeTab={activeTab} 
          onChange={setActiveTab} 
          className="mt-6"
        />
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
          
          <div className="grid gap-6 lg:grid-cols-2 mt-6">
            <DetailSection title="Recent Payrolls">
              {isPayrollsLoading ? (
                <DetailSkeleton />
              ) : payrolls?.length > 0 ? (
                <ListGroup>
                  {payrolls.map(row => (
                    <ListItem
                      key={row._id}
                      to={`/weekly-payrolls/${row._id}`}
                      title={`${formatDate(row.startDate)} - ${formatDate(row.endDate)}`}
                      right={
                        <span className="text-sm font-bold text-finance-in">
                          <MoneyDisplay amount={row.totalEarnings || 0} />
                        </span>
                      }
                    />
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center py-6 text-sm text-secondary flex flex-col items-center border border-dashed border-border/50 rounded-lg">
                  <Banknote className="h-8 w-8 text-muted mb-2" />
                  No payrolls generated for this employee.
                </div>
              )}
            </DetailSection>

            <DetailSection title="Payment History">
              {isPaymentsLoading ? (
                <DetailSkeleton />
              ) : payments?.length > 0 ? (
                <ListGroup>
                  {payments.map(row => (
                    <ListItem
                      key={row._id}
                      title={<span className="font-mono text-[10px] font-bold text-primary tracking-widest">{row.paymentReference}</span>}
                      subtitle={formatDateTime(row.paymentDate)}
                      right={
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs sm:text-sm font-bold tracking-tight shrink-0 ${row.status === 'voided' ? 'line-through opacity-50 text-secondary' : 'text-primary'}`}>
                            <MoneyDisplay amount={row.amount} />
                          </span>
                          <StatusBadge status={row.status} className="shrink-0" />
                        </div>
                      }
                    />
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center py-6 text-sm text-secondary flex flex-col items-center border border-dashed border-border/50 rounded-lg">
                  <FileText className="h-8 w-8 text-muted mb-2" />
                  No payments have been recorded for this employee.
                </div>
              )}
            </DetailSection>
          </div>
        </div>
      )}

      <EmployeePaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSubmit={paymentMutation.mutateAsync}
        preSelectedEmployee={employee}
      />
    </div>
  );
};

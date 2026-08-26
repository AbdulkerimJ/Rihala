import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getWeeklyPayrollById } from "../api";
import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { SummaryCard } from "../../../components/ui/SummaryCard";
import { DetailSection } from "../../../components/ui/DetailSection";
import { SystemInfoSection } from "../../../components/ui/SystemInfoSection";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { getApiErrorMessage, unwrapEntityResponse } from "../../../utils/apiResponse";
import { formatDate, formatCurrency } from "../../../utils/formatters";
import { Calendar, Wallet, Clock, User, ArrowLeft, DollarSign } from "lucide-react";

export const WeeklyPayrollDetail = () => {
  const { id } = useParams();
  
  const payrollQuery = useQuery({
    queryKey: ["weekly-payrolls", id],
    queryFn: () => getWeeklyPayrollById(id),
    enabled: !!id,
  });

  const payroll = unwrapEntityResponse(payrollQuery.data);

  if (payrollQuery.isLoading) return <DetailSkeleton />;
  
  if (payrollQuery.isError || !payroll) {
    return <ErrorState description={getApiErrorMessage(payrollQuery.error, "Failed to load payroll details.")} />;
  }

  const daysWorked = payroll.dailyBreakdown?.reduce((acc, curr) => acc + (curr.portion || 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/weekly-payrolls"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-surface text-secondary hover:text-primary hover:bg-main transition-colors shrink-0"
            title="Back to payrolls"
            aria-label="Back to payrolls"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-primary font-display tracking-tight">Payroll Record</h1>
              <StatusBadge status={payroll.status || "CLOSED"} />
            </div>
            <p className="text-sm text-secondary">
              Period: {formatDate(payroll.startDate)} - {formatDate(payroll.endDate)} &bull; Processed: {payroll.dailyBreakdown?.length === 1 ? "1 Day" : `${payroll.dailyBreakdown?.length || 0} Days`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
          title="Employee" 
          value={payroll.employee?.name || "Unknown"} 
          icon={User}
        />
        <SummaryCard 
          title="Total Earnings" 
          value={<MoneyDisplay amount={payroll.totalEarnings} variant="accent" />} 
          icon={Wallet}
        />
        <SummaryCard 
          title="Normal Earnings" 
          value={<MoneyDisplay amount={payroll.normalEarnings} />} 
          icon={DollarSign}
        />
        <SummaryCard 
          title="Overtime Earnings" 
          value={<MoneyDisplay amount={payroll.overtimeEarnings} />} 
          icon={Clock}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <DetailSection title="Calculation Breakdown" className="p-0 overflow-hidden">
            <div className="bg-surface divide-y divide-border/50">
              <div className="p-4 flex justify-between items-center">
                <span className="text-secondary font-medium">Normal Earnings ({daysWorked === 1 ? "1 day" : `${daysWorked} days`} equivalent)</span>
                <span className="text-primary"><MoneyDisplay amount={payroll.normalEarnings} /></span>
              </div>
              <div className="p-4 flex justify-between items-center">
                <span className="text-secondary font-medium">Overtime Earnings</span>
                <span className="text-primary"><MoneyDisplay amount={payroll.overtimeEarnings} /></span>
              </div>
              <div className="p-4 flex justify-between items-center bg-accent/5 border-t-2 border-accent/20">
                <span className="text-primary font-bold text-lg">Total Payable</span>
                <MoneyDisplay amount={payroll.totalEarnings} variant="accent" className="text-xl" />
              </div>
            </div>
          </DetailSection>
          
          <DetailSection title={`Daily Rate & Attendance Snapshot (${payroll.dailyBreakdown?.length === 1 ? "1 Day" : `${payroll.dailyBreakdown?.length || 0} Days`})`} className="p-0 bg-transparent border-0 shadow-none">
            {payroll.dailyBreakdown?.length > 0 ? (
              <div className="flex flex-col gap-3 mt-4">
                {payroll.dailyBreakdown.map((item, index) => (
                  <div key={item._id || index} className="p-4 rounded-xl border border-border/80 bg-surface shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3 pb-3 border-b border-border/50">
                      <div className="flex flex-col">
                        <span className="font-bold text-primary">{formatDate(item.workDate)}</span>
                        <span className="text-xs text-secondary mt-0.5">
                          {item.portion === 1 ? "Full Day" : item.portion === 0.5 ? "Half Day" : "Absent"} • Rate: {formatCurrency(item.dailyRate)}
                        </span>
                      </div>
                      <span className="text-base font-black text-primary tracking-tight">
                        <MoneyDisplay amount={item.earnings} />
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={item.morningStatus} className="text-[10px] px-2 py-0.5" />
                      <StatusBadge status={item.afternoonStatus} className="text-[10px] px-2 py-0.5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 mt-4 text-center rounded-xl border border-dashed border-border/80 bg-surface/50">
                <Calendar className="h-8 w-8 mx-auto text-muted mb-2" />
                <p className="text-sm font-medium text-secondary">No daily snapshot records available.</p>
              </div>
            )}
          </DetailSection>

          <DetailSection title={`Overtime Snapshot (${payroll.overtimeBreakdown?.length === 1 ? "1 Day" : `${payroll.overtimeBreakdown?.length || 0} Days`})`} className="p-0 bg-transparent border-0 shadow-none mt-6">
            {payroll.overtimeBreakdown?.length > 0 ? (
              <div className="flex flex-col gap-3 mt-4">
                {payroll.overtimeBreakdown.map((item, index) => (
                  <div key={item._id || index} className="p-4 rounded-xl border border-border/80 bg-surface shadow-sm">
                    <div className="flex justify-between items-start mb-3 pb-3 border-b border-border/50">
                      <div className="flex flex-col">
                        <span className="font-bold text-primary">{formatDate(item.workDate)}</span>
                        <span className="text-xs text-secondary mt-0.5">
                          {item.duration === 'FULL_DAY' ? "Full Day Overtime" : "Half Day Overtime"} • Rate: {formatCurrency(item.dailyRate)}
                        </span>
                      </div>
                      <span className="text-base font-black text-primary tracking-tight">
                        <MoneyDisplay amount={item.earnings} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 mt-4 text-center rounded-xl border border-dashed border-border/80 bg-surface/50">
                <Clock className="h-8 w-8 mx-auto text-muted mb-2" />
                <p className="text-sm font-medium text-secondary">No overtime recorded for this period.</p>
              </div>
            )}
          </DetailSection>
        </div>

        <div className="space-y-6">
          <SystemInfoSection
            id={payroll._id}
            idLabel="Payroll ID"
            createdAt={payroll.createdAt}
            extraItems={[
              { label: "Status", value: payroll.status || "CLOSED" },
              { label: "Closed At", value: payroll.closedAt ? formatDate(payroll.closedAt) : "N/A" },
            ]}
          />
        </div>
      </div>
    </div>
  );
};


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
          
          <DetailSection title={`Daily Rate & Attendance Snapshot (${payroll.dailyBreakdown?.length === 1 ? "1 Day" : `${payroll.dailyBreakdown?.length || 0} Days`})`} className="p-0">
             <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-main/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-secondary">Date</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-secondary">Morning</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-secondary">Afternoon</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-secondary">Portion</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-secondary">Applied Rate</th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-secondary">Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {payroll.dailyBreakdown?.length > 0 ? payroll.dailyBreakdown.map((item, index) => (
                    <tr key={item._id || index}>
                      <td className="px-4 py-3 text-sm text-primary font-medium">{formatDate(item.workDate)}</td>
                      <td className="px-4 py-3 text-sm">
                        <StatusBadge status={item.morningStatus} />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <StatusBadge status={item.afternoonStatus} />
                      </td>
                      <td className="px-4 py-3 text-sm text-secondary">
                        {item.portion === 1 ? "1.0 (Full)" : item.portion === 0.5 ? "0.5 (Half)" : "0.0 (Absent)"}
                      </td>
                      <td className="px-4 py-3 text-sm text-primary">
                        <MoneyDisplay amount={item.dailyRate} />
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <MoneyDisplay amount={item.earnings} />
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-sm text-secondary text-center">No daily snapshot records available for this payroll.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </DetailSection>

          <DetailSection title={`Overtime Snapshot (${payroll.overtimeBreakdown?.length === 1 ? "1 Day" : `${payroll.overtimeBreakdown?.length || 0} Days`})`} className="p-0">
             <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-main/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-secondary">Date</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-secondary">Duration</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-secondary">Applied Rate</th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-secondary">Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {payroll.overtimeBreakdown?.length > 0 ? payroll.overtimeBreakdown.map((item, index) => (
                    <tr key={item._id || index}>
                      <td className="px-4 py-3 text-sm text-primary font-medium">{formatDate(item.workDate)}</td>
                      <td className="px-4 py-3 text-sm text-secondary">
                        {item.duration === 'FULL_DAY' ? "Full Day" : "Half Day"}
                      </td>
                      <td className="px-4 py-3 text-sm text-primary">
                        <MoneyDisplay amount={item.dailyRate} />
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <MoneyDisplay amount={item.earnings} />
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-sm text-secondary text-center">No overtime recorded for this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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


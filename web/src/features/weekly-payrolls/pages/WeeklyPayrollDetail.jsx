import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getWeeklyPayrollById } from "../api";
import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { SummaryCard } from "../../../components/ui/SummaryCard";
import { DetailSection, DetailItem } from "../../../components/ui/DetailSection";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { getApiErrorMessage, unwrapEntityResponse } from "../../../utils/apiResponse";
import { formatDateTime, formatDate } from "../../../utils/formatters";
import { Calendar, Wallet, Clock, User } from "lucide-react";

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-primary font-display tracking-tight">Payroll Record</h1>
          </div>
          <p className="text-sm text-secondary">Period: {formatDate(payroll.periodStart)} - {formatDate(payroll.periodEnd)}</p>
        </div>
        <Link
          to="/weekly-payrolls"
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-primary hover:bg-main transition-colors"
        >
          Back to payrolls
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
          title="Employee" 
          value={payroll.employee?.name || "Unknown"} 
          icon={User}
        />
        <SummaryCard 
          title="Net Pay" 
          value={<MoneyDisplay amount={payroll.netPay} variant="accent" />} 
          icon={Wallet}
        />
        <SummaryCard 
          title="Days Present" 
          value={payroll.totalDaysPresent} 
          icon={Calendar}
        />
        <SummaryCard 
          title="Overtime Hours" 
          value={payroll.totalOvertimeHours} 
          icon={Clock}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <DetailSection title="Calculation Breakdown" className="p-0 overflow-hidden">
            <div className="bg-surface divide-y divide-border/50">
              <div className="p-4 flex justify-between items-center">
                <span className="text-secondary font-medium">Base Pay ({payroll.totalDaysPresent} days × {payroll.dailyRate} ETB/day)</span>
                <span className="text-primary"><MoneyDisplay amount={payroll.totalBasePay} /></span>
              </div>
              <div className="p-4 flex justify-between items-center">
                <span className="text-secondary font-medium">Overtime Pay ({payroll.totalOvertimeHours} hours)</span>
                <span className="text-primary"><MoneyDisplay amount={payroll.totalOvertimePay} /></span>
              </div>
              <div className="p-4 flex justify-between items-center bg-danger/5">
                <span className="text-danger font-medium">Advances / Deductions</span>
                <span className="text-danger">- <MoneyDisplay amount={payroll.advancesDeducted} /></span>
              </div>
              <div className="p-4 flex justify-between items-center bg-brand/5 border-t-2 border-brand/20">
                <span className="text-primary font-bold text-lg">Net Payable</span>
                <span className="text-brand font-bold text-xl"><MoneyDisplay amount={payroll.netPay} /></span>
              </div>
            </div>
          </DetailSection>
          
          <DetailSection title="Included Attendance Records" className="p-0">
             <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-main/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-secondary">Date</th>
                    <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-secondary">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {payroll.attendanceRecords?.length > 0 ? payroll.attendanceRecords.map((att, index) => (
                    <tr key={att._id || index}>
                      <td className="px-6 py-4 text-sm text-primary">{formatDate(att.date)}</td>
                      <td className="px-6 py-4 text-sm capitalize">{att.status?.replace('_', ' ')}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={2} className="px-6 py-4 text-sm text-secondary text-center">No attendance records included.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </DetailSection>
        </div>

        <div className="space-y-6">
          <DetailSection title="System Information">
            <div className="space-y-1">
              <DetailItem label="Payroll ID" value={<span className="font-mono text-xs">{payroll._id}</span>} />
              <DetailItem label="Generated By" value={payroll.generatedBy?.name || "Unknown"} />
              <DetailItem label="Generated On" value={formatDateTime(payroll.createdAt)} />
            </div>
          </DetailSection>
        </div>
      </div>
    </div>
  );
};

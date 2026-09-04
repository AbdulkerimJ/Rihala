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
import { Calendar, Wallet, Clock, User, DollarSign, CalendarDays } from "lucide-react";
import { BackButton } from "../../../components/ui/BackButton";
import { ListGroup, ListItem } from "../../../components/ui/ListGroup";
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
          <BackButton />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-primary font-display tracking-tight">Payroll Record</h1>
              <StatusBadge status="CLOSED" />
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
                <span className="text-primary font-bold text-lg">Total Earnings</span>
                <MoneyDisplay amount={payroll.totalEarnings} variant="accent" className="text-xl" />
              </div>
            </div>
          </DetailSection>
          
          <DetailSection title={`Daily Rate & Attendance Snapshot (${payroll.dailyBreakdown?.length === 1 ? "1 Day" : `${payroll.dailyBreakdown?.length || 0} Days`})`} className="p-0 bg-transparent border-0 shadow-none">
            {payroll.dailyBreakdown?.length > 0 ? (
              <ListGroup variant="card" className="mt-4">
                {payroll.dailyBreakdown.map((item, index) => (
                  <ListItem
                    key={item._id || index}
                    icon={CalendarDays}
                    title={formatDate(item.workDate)}
                    subtitle={`${item.portion === 1 ? "Full Day" : item.portion === 0.5 ? "Half Day" : "Absent"} • Rate: ${formatCurrency(item.dailyRate)}`}
                    right={
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-bold text-primary tracking-tight">
                          <MoneyDisplay amount={item.earnings} />
                        </span>
                        <div className="flex items-center gap-1">
                          <StatusBadge status={item.morningStatus} className="text-[10px] px-1.5 py-0" />
                          <StatusBadge status={item.afternoonStatus} className="text-[10px] px-1.5 py-0" />
                        </div>
                      </div>
                    }
                  />
                ))}
              </ListGroup>
            ) : (
              <div className="p-8 mt-4 text-center rounded-xl border border-dashed border-border/80 bg-surface/50">
                <Calendar className="h-8 w-8 mx-auto text-muted mb-2" />
                <p className="text-sm font-medium text-secondary">No daily snapshot records available.</p>
              </div>
            )}
          </DetailSection>

          <DetailSection title={`Overtime Snapshot (${payroll.overtimeBreakdown?.length === 1 ? "1 Day" : `${payroll.overtimeBreakdown?.length || 0} Days`})`} className="p-0 bg-transparent border-0 shadow-none mt-6">
            {payroll.overtimeBreakdown?.length > 0 ? (
              <ListGroup variant="card" className="mt-4">
                {payroll.overtimeBreakdown.map((item, index) => (
                  <ListItem
                    key={item._id || index}
                    icon={Clock}
                    title={formatDate(item.workDate)}
                    subtitle={`${item.duration === 'FULL_DAY' ? "Full Day Overtime" : "Half Day Overtime"} • Rate: ${formatCurrency(item.dailyRate)}`}
                    right={
                      <span className="font-bold text-primary tracking-tight">
                        <MoneyDisplay amount={item.earnings} />
                      </span>
                    }
                  />
                ))}
              </ListGroup>
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
              { label: "Closed At", value: payroll.closedAt ? formatDate(payroll.closedAt) : "N/A" },
            ]}
          />
        </div>
      </div>
    </div>
  );
};


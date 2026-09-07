import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Calendar, Clock, ChevronRight, CheckCircle2 } from "lucide-react";
import { getWeeklyPayrollById } from "../api";
import { unwrapEntityResponse, getApiErrorMessage } from "../../../utils/apiResponse";
import { formatDate, formatCurrency } from "../../../utils/formatters";
import { Modal } from "../../../components/ui/Modal";
import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { ListGroup, ListItem } from "../../../components/ui/ListGroup";
import { Button } from "../../../components/ui/Button";

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length > 1) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.trim().substring(0, 2).toUpperCase();
};

const AttendanceCalendar = ({ breakdown = [] }) => {
  if (!breakdown.length) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
      {breakdown.map((day, index) => {
        const date = new Date(day.workDate);
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        const dateNum = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

        let bgColor = "bg-surface border-border/50";
        if (day.portion === 1) bgColor = "bg-success/5 border-success/20";
        else if (day.portion === 0.5) bgColor = "bg-warning/5 border-warning/20";
        else if (day.portion === 0) bgColor = "bg-danger/5 border-danger/20";

        return (
          <div
            key={index}
            className={`rounded-lg border p-2.5 flex flex-col items-center justify-center text-center ${bgColor}`}
          >
            <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
              {dayName}
            </span>
            <span className="text-xs font-semibold text-primary mb-1.5">{dateNum}</span>
            <div className="flex gap-1.5 mb-1.5">
              <div
                title={`Morning: ${day.morningStatus}`}
                className={`w-2.5 h-2.5 rounded-full ${
                  day.morningStatus === "PRESENT"
                    ? "bg-success"
                    : day.morningStatus === "PERMISSION"
                    ? "bg-warning"
                    : "bg-danger/40"
                }`}
              />
              <div
                title={`Afternoon: ${day.afternoonStatus}`}
                className={`w-2.5 h-2.5 rounded-full ${
                  day.afternoonStatus === "PRESENT"
                    ? "bg-success"
                    : day.afternoonStatus === "PERMISSION"
                    ? "bg-warning"
                    : "bg-danger/40"
                }`}
              />
            </div>
            <span className="text-[11px] font-semibold text-primary">
              {day.portion} Day{day.portion !== 1 ? "s" : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const WeeklyPayrollSummaryModal = ({ payrollId, isOpen, onClose }) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["weekly-payrolls", payrollId],
    queryFn: () => getWeeklyPayrollById(payrollId),
    enabled: !!payrollId && isOpen,
  });

  const payroll = unwrapEntityResponse(data);
  const employee = payroll?.employee || {};
  const daysWorked =
    payroll?.dailyBreakdown?.reduce((acc, curr) => acc + (curr.portion || 0), 0) ?? 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Payroll Period Summary"
      maxWidth="max-w-2xl"
    >
      {isLoading ? (
        <div className="py-6">
          <DetailSkeleton />
        </div>
      ) : isError || !payroll ? (
        <div className="py-4">
          <ErrorState
            description={getApiErrorMessage(error, "Failed to load payroll details.")}
          />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Employee & Period Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/70 bg-main/40">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-accent to-accent/70 text-white font-bold text-lg shadow-sm">
                {getInitials(employee.name)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="text-base font-bold text-primary truncate">
                    {employee.name}
                  </h4>
                  <StatusBadge status={payroll.status || "CLOSED"} />
                </div>
                <p className="text-xs text-secondary">
                  Week of {formatDate(payroll.startDate)} – {formatDate(payroll.endDate)}
                </p>
                {employee._id && (
                  <Link
                    to={`/employees/${employee._id}`}
                    onClick={onClose}
                    className="inline-flex items-center mt-1 text-[11px] font-medium text-accent hover:text-accent-hover transition-colors"
                  >
                    View Employee Profile <ChevronRight className="w-3 h-3 ml-0.5" />
                  </Link>
                )}
              </div>
            </div>

            {/* Total Earnings Callout */}
            <div className="flex flex-col sm:items-end p-3 rounded-lg bg-accent/10 border border-accent/20 shrink-0">
              <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
                Total Earnings
              </span>
              <span className="text-xl sm:text-2xl font-black text-accent tracking-tight">
                <MoneyDisplay amount={payroll.totalEarnings} />
              </span>
            </div>
          </div>

          {/* Earnings & Days Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl border border-border/60 bg-surface">
            <div className="p-2">
              <span className="text-[11px] text-secondary font-medium block mb-0.5">
                Normal Earnings
              </span>
              <span className="text-sm sm:text-base font-bold text-primary">
                <MoneyDisplay amount={payroll.normalEarnings} />
              </span>
            </div>
            <div className="p-2">
              <span className="text-[11px] text-secondary font-medium block mb-0.5">
                Overtime Earnings
              </span>
              <span className="text-sm sm:text-base font-bold text-primary">
                <MoneyDisplay amount={payroll.overtimeEarnings} />
              </span>
            </div>
            <div className="p-2">
              <span className="text-[11px] text-secondary font-medium block mb-0.5">
                Days Processed
              </span>
              <span className="text-sm sm:text-base font-bold text-primary">
                {payroll.dailyBreakdown?.length || 0}
              </span>
            </div>
            <div className="p-2">
              <span className="text-[11px] text-secondary font-medium block mb-0.5">
                Days Earned
              </span>
              <span className="text-sm sm:text-base font-bold text-primary">
                {daysWorked}
              </span>
            </div>
          </div>

          {/* Attendance Calendar Breakdown */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              <h5 className="text-xs font-bold text-secondary uppercase tracking-wider">
                Attendance Breakdown
              </h5>
            </div>
            {payroll.dailyBreakdown?.length > 0 ? (
              <AttendanceCalendar breakdown={payroll.dailyBreakdown} />
            ) : (
              <div className="p-6 text-center rounded-lg border border-dashed border-border/70 bg-surface/40">
                <p className="text-xs text-muted">No attendance breakdown available.</p>
              </div>
            )}
          </div>

          {/* Overtime Breakdown */}
          {payroll.overtimeBreakdown?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <h5 className="text-xs font-bold text-secondary uppercase tracking-wider">
                  Overtime Recorded
                </h5>
              </div>
              <ListGroup variant="card">
                {payroll.overtimeBreakdown.map((item, index) => (
                  <ListItem
                    key={item._id || index}
                    size="sm"
                    title={formatDate(item.workDate)}
                    subtitle={`${
                      item.duration === "FULL_DAY" ? "Full Day" : "Half Day"
                    } • Rate: ${formatCurrency(item.dailyRate)}`}
                    right={
                      <span className="text-xs font-bold text-primary">
                        <MoneyDisplay amount={item.earnings} />
                      </span>
                    }
                  />
                ))}
              </ListGroup>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end pt-3 border-t border-border/50">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

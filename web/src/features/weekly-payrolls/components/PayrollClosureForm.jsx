import React, { useState } from "react";
import { usePermission } from "../../../hooks/usePermission";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { closeWeeklyPayroll, getCurrentPayrollCalculation } from "../api";
import { getEmployees, getEmployeeStats } from "../../employees/api";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { Select } from "../../../components/ui/Select";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import toast from "react-hot-toast";
import { getApiErrorMessage, unwrapListResponse, unwrapEntityResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";
import { CheckCircle, ChevronDown, ChevronUp, Clock, CalendarDays, X } from "lucide-react";
import { Skeleton } from "../../../components/ui/skeletons";
import { StatusBadge } from "../../../components/ui/StatusBadge";

export const PayrollClosureForm = ({ onClose }) => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [showBreakdown, setShowBreakdown] = useState(false);

  const { data: employeesData } = useQuery({ 
    queryKey: ["employees", "list", "active"], 
    queryFn: () => getEmployees({ limit: 1000, status: "active" }),
    enabled: can("employees.read")
  });
  const employees = unwrapListResponse(employeesData).items || [];

  const { data: calculationData, isLoading: isCalculating, isError, error } = useQuery({
    queryKey: ["payroll-calculation", selectedEmployee],
    queryFn: () => getCurrentPayrollCalculation(selectedEmployee),
    enabled: !!selectedEmployee,
    retry: false
  });
  
  const calculation = unwrapEntityResponse(calculationData);
  const uniqueDaysProcessed = calculation ? new Set([
    ...(calculation.dailyBreakdown || []).map(d => d.workDate),
    ...(calculation.overtimeBreakdown || []).map(d => d.workDate)
  ]).size : 0;

  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ["employees", selectedEmployee, "stats"],
    queryFn: () => getEmployeeStats(selectedEmployee),
    enabled: !!selectedEmployee && can("employees.read"),
  });
  const employeeStats = statsData?.data ?? null;

  const closeMutation = useMutation({
    mutationFn: () => closeWeeklyPayroll(selectedEmployee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-payrolls"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] }); 
      toast.success("Payroll closed successfully");
      setSelectedEmployee("");
      onClose();
    },
  });

  return (
    <div className="space-y-4 p-6">
      <p className="text-sm text-secondary mb-4">
        Select a daily-wage employee to view their unclosed attendance and overtime, and close the payroll period.
      </p>

      <FormField label="Employee">
        <Select 
          value={selectedEmployee} 
          onChange={(e) => setSelectedEmployee(e.target.value)}
          placeholder="Select an employee"
          options={employees.map(e => ({ value: e._id, label: e.name }))}
        />
      </FormField>

      {selectedEmployee && isCalculating && (
        <div className="space-y-4 pt-4 border-t border-border/50">
           <Skeleton className="h-5 w-40" />
           <div className="bg-main/50 rounded-lg p-4 space-y-3 border border-border/50">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-4" />
           </div>
        </div>
      )}
      {selectedEmployee && isError && (
        <div className="p-4 bg-danger/10 text-danger rounded-md text-sm border border-danger/20">
          {getApiErrorMessage(error, "Failed to calculate payroll or no pending records.")}
        </div>
      )}

      {selectedEmployee && calculation && !isCalculating && !isError && (
        <div className="space-y-4 pt-4 border-t border-border/50">
          <h4 className="font-semibold text-primary">Calculation Preview</h4>

          {calculation.missingAttendanceDates?.length > 0 ? (
            <div className="p-3 bg-warning/10 text-warning rounded-lg text-sm border border-warning/20">
              <span className="font-medium">Missing Attendance:</span> Attendance must be recorded for all workdays before closing payroll.
              <ul className="list-disc list-inside mt-1">
                {calculation.missingAttendanceDates.map((d, i) => (
                  <li key={i}>{formatDate(d)}</li>
                ))}
              </ul>
            </div>
          ) : !calculation.hasProcessedDays ? (
            <div className="p-3 bg-primary/10 text-primary rounded-lg text-sm border border-primary/20">
              <span className="font-medium">No Pending Payroll:</span> The current open period (starting {formatDate(calculation.startDate)}) has no attendance or overtime recorded yet.
            </div>
          ) : null}

          <div className="bg-main/50 rounded-lg p-4 space-y-3 text-sm border border-border/50">
            <div className="flex justify-between">
              <span className="text-secondary">Period:</span>
              <span className="font-medium text-primary">{formatDate(calculation.startDate)} - {formatDate(calculation.endDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Days Processed:</span>
              <span className="font-medium text-primary">
                {uniqueDaysProcessed === 1 ? "1 Day" : `${uniqueDaysProcessed} Days`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Normal Earnings:</span>
              <span className="font-medium text-primary"><MoneyDisplay amount={calculation.normalEarnings} /></span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <span className="text-secondary">Overtime Earnings:</span>
              <span className="font-medium text-primary"><MoneyDisplay amount={calculation.overtimeEarnings} /></span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="font-bold text-primary">Total Payable:</span>
              <MoneyDisplay amount={calculation.totalEarnings} variant="accent" />
            </div>
            <div className="flex justify-between pt-3 border-t border-border/50 mt-1">
              <span className="text-secondary">Current Balance (Prior):</span>
              {isStatsLoading ? (
                <span className="h-4 w-20 bg-main animate-pulse rounded" />
              ) : (
                <span className={`font-semibold ${
                  !employeeStats || employeeStats.currentBalance >= 0 ? "text-success" : "text-danger"
                }`}>
                  {employeeStats?.currentBalance < 0 ? "-" : ""}
                  <MoneyDisplay amount={Math.abs(employeeStats?.currentBalance ?? 0)} />
                </span>
              )}
            </div>
          </div>

          {/* Breakdown Toggle */}
          <div className="pt-2">
            <button 
              type="button" 
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-primary transition-colors"
            >
              {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showBreakdown ? "Hide Detailed Breakdown" : "View Detailed Breakdown"}
            </button>
          </div>

          {/* Collapsible Breakdown Area */}
          {showBreakdown && (
            <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
              
              {/* Daily Attendance Breakdown */}
              <div className="border border-border/50 rounded-lg overflow-hidden bg-surface">
                <div className="bg-main/30 px-3 py-2 border-b border-border/50 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-secondary">
                    Attendance Snapshot ({calculation.dailyBreakdown?.length === 1 ? "1 Day" : `${calculation.dailyBreakdown?.length || 0} Days`})
                  </h5>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border text-left">
                    <thead className="bg-main/10 text-xs text-secondary">
                      <tr>
                        <th className="px-3 py-2 font-medium">Date</th>
                        <th className="px-3 py-2 font-medium">Morning</th>
                        <th className="px-3 py-2 font-medium">Afternoon</th>
                        <th className="px-3 py-2 font-medium text-right">Earnings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {calculation.dailyBreakdown?.length > 0 ? calculation.dailyBreakdown.map((item, index) => (
                        <tr key={index} className="hover:bg-main/5 transition-colors">
                          <td className="px-3 py-2 text-xs font-medium text-primary whitespace-nowrap">{formatDate(item.workDate)}</td>
                          <td className="px-3 py-2 text-xs">
                            <StatusBadge status={item.morningStatus} className="text-[10px] px-1.5 py-0.5" />
                          </td>
                          <td className="px-3 py-2 text-xs">
                            <StatusBadge status={item.afternoonStatus} className="text-[10px] px-1.5 py-0.5" />
                          </td>
                          <td className="px-3 py-2 text-xs text-right font-medium text-primary whitespace-nowrap">
                            <MoneyDisplay amount={item.earnings} />
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="px-3 py-4 text-xs text-secondary text-center">No attendance recorded for this period.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Overtime Breakdown */}
              <div className="border border-border/50 rounded-lg overflow-hidden bg-surface">
                <div className="bg-main/30 px-3 py-2 border-b border-border/50 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-secondary">
                    Overtime Snapshot ({calculation.overtimeBreakdown?.length === 1 ? "1 Day" : `${calculation.overtimeBreakdown?.length || 0} Days`})
                  </h5>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border text-left">
                    <thead className="bg-main/10 text-xs text-secondary">
                      <tr>
                        <th className="px-3 py-2 font-medium">Date</th>
                        <th className="px-3 py-2 font-medium">Duration</th>
                        <th className="px-3 py-2 font-medium text-right">Earnings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {calculation.overtimeBreakdown?.length > 0 ? calculation.overtimeBreakdown.map((item, index) => (
                        <tr key={index} className="hover:bg-main/5 transition-colors">
                          <td className="px-3 py-2 text-xs font-medium text-primary whitespace-nowrap">{formatDate(item.workDate)}</td>
                          <td className="px-3 py-2 text-xs text-secondary">{item.duration === 'FULL_DAY' ? 'Full Day' : 'Half Day'}</td>
                          <td className="px-3 py-2 text-xs text-right font-medium text-primary whitespace-nowrap">
                            <MoneyDisplay amount={item.earnings} />
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={3} className="px-3 py-4 text-xs text-secondary text-center">No overtime recorded for this period.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={onClose} disabled={closeMutation.isPending} leftIcon={X}>Cancel</Button>
            <Button 
              onClick={() => closeMutation.mutate()} 
              isLoading={closeMutation.isPending} 
              disabled={calculation.isComplete === false || closeMutation.isPending}
              leftIcon={CheckCircle}
            >
              Close & Generate Payroll
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

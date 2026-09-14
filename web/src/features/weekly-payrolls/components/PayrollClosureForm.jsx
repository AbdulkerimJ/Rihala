import React, { useState } from "react";
import { usePermission } from "../../../hooks/usePermission";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { closeWeeklyPayroll, getCurrentPayrollCalculation } from "../api";
import { getEmployees, getEmployeeStats } from "../../employees/api";
import toast from "react-hot-toast";
import { getApiErrorMessage, unwrapListResponse, unwrapEntityResponse } from "../../../utils/apiResponse";
import { formatDate, getLocalISODate } from "../../../utils/formatters";
import { CheckCircle, X, Receipt, ChevronUp, ChevronDown, CalendarDays, Clock } from "lucide-react";
import { FormField } from "../../../components/ui/FormField";
import { Select } from "../../../components/ui/Select";
import { PayrollCalculationSkeleton } from "./PayrollCalculationSkeleton";
import { InlineSkeleton } from "../../../components/ui/skeletons";
import { GoToLink } from "../../../components/ui/GoToLink";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { CurrencyInput } from "../../../components/ui/CurrencyInput";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";

export const PayrollClosureForm = ({ onClose }) => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [recordPayment, setRecordPayment] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(getLocalISODate());
  const [paymentNote, setPaymentNote] = useState("");

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

  const priorBalance = (employeeStats?.currentBalance || 0) - (calculation?.totalEarnings || 0);
  const newBalance = (employeeStats?.currentBalance || 0) - Number(paymentAmount || 0);

  const closeMutation = useMutation({
    mutationFn: () => {
      const payload = {};
      if (recordPayment && paymentAmount) {
        payload.initialPayment = {
          amount: Number(paymentAmount),
          paymentDate: new Date(paymentDate).toISOString(),
          note: paymentNote || undefined
        };
      }
      return closeWeeklyPayroll(selectedEmployee, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-payrolls"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] }); 
      queryClient.invalidateQueries({ queryKey: ["employee-payments"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-calculation"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Payroll closed successfully");
      setSelectedEmployee("");
      onClose();
    },
  });

  React.useEffect(() => {
    if (recordPayment && employeeStats) {
      const netPayable = Math.max(0, employeeStats.currentBalance || 0);
      setPaymentAmount(netPayable);
    }
  }, [recordPayment, employeeStats]);

  return (
    <div className="space-y-4 p-6">
      <p className="text-sm text-secondary mb-4">
        Select an employee to view their unclosed attendance and overtime, and close the payroll period.
      </p>

      <FormField label="Employee">
        <Select 
          value={selectedEmployee} 
          onChange={(e) => setSelectedEmployee(e.target.value)}
          placeholder="Select an employee"
          options={employees.map(e => ({ value: e._id, label: e.name }))}
        />
      </FormField>

      {!selectedEmployee && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-border/50 rounded-lg bg-main/5 mt-6">
           <Receipt className="w-12 h-12 mb-3 text-secondary/50" />
           <p className="text-secondary font-medium">No Employee Selected</p>
           <p className="text-sm text-secondary/70 mt-1 max-w-xs">Select an employee from the dropdown above to preview their unclosed payroll records.</p>
        </div>
      )}

      {selectedEmployee && isCalculating && (
        <PayrollCalculationSkeleton />
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
              <span className="font-medium">Missing Attendance ({calculation.missingAttendanceDates.length}):</span> Attendance must be recorded for all workdays before closing payroll.
              <ul className="list-disc list-inside mt-1 mb-3">
                {calculation.missingAttendanceDates.map((d, i) => (
                  <li key={i}>{formatDate(d)}</li>
                ))}
              </ul>
              <GoToLink to="/attendances">
                Go to Attendance
              </GoToLink>
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
              <span className="text-secondary">Earnings This Period:</span>
              <span className="font-medium text-primary">
                <MoneyDisplay amount={calculation.totalEarnings} />
              </span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-secondary">Prior Balance:</span>
              {isStatsLoading ? (
                <InlineSkeleton width="w-20" />
              ) : (
                <span className={`font-medium ${priorBalance >= 0 ? "text-success" : "text-danger"}`}>
                  <MoneyDisplay amount={priorBalance} />
                </span>
              )}
            </div>
            <div className="flex justify-between pt-3 border-t border-border/50 mt-1">
              <span className="font-bold text-primary">Net Balance:</span>
              {isStatsLoading ? (
                <InlineSkeleton width="w-20" />
              ) : (
                <span className={`font-bold text-lg ${
                  !employeeStats || employeeStats.currentBalance >= 0 ? "text-success" : "text-danger"
                }`}>
                  <MoneyDisplay amount={employeeStats?.currentBalance ?? 0} />
                </span>
              )}
            </div>
            
            {recordPayment && (
              <div className="flex justify-between pt-2">
                <span className="font-bold text-primary">Balance After Payment:</span>
                {isStatsLoading ? (
                  <InlineSkeleton width="w-20" />
                ) : (
                  <span className={`font-bold ${newBalance >= 0 ? "text-success" : "text-danger"}`}>
                    <MoneyDisplay amount={newBalance} />
                  </span>
                )}
              </div>
            )}
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

          {/* Record Payment Section */}
          <div className={`p-4 rounded-lg border transition-all duration-200 ${
            recordPayment 
              ? "bg-main/50 border-accent/40 shadow-xs" 
              : "bg-main/20 border-border/70"
          }`}>
            <label className="flex items-start sm:items-center gap-3 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={recordPayment}
                onChange={(e) => setRecordPayment(e.target.checked)}
                className="mt-0.5 sm:mt-0 h-4 w-4 rounded border-border text-accent focus:ring-accent accent-accent transition-shadow cursor-pointer"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-primary">Disburse Payment Now</span>
                  <Badge variant={recordPayment ? "success" : "outline"} className="text-[11px] py-0 font-medium">
                    {recordPayment ? "Payout Included" : "Close Without Payout"}
                  </Badge>
                </div>
                <p className="text-xs text-secondary mt-0.5">
                  {recordPayment 
                    ? "Records employee payment and settles their balance upon closing. Uncheck to close payroll without disbursing cash now."
                    : "Payroll will be closed and earnings recorded, but no payment will be issued. The balance remains payable later."}
                </p>
              </div>
            </label>

            {recordPayment && (
              <div className="mt-3 pt-3 border-t border-border/40 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Payment Amount (ETB)" required>
                    <CurrencyInput
                      value={paymentAmount}
                      onChange={setPaymentAmount}
                      placeholder="Amount"
                    />
                  </FormField>
                  <FormField label="Payment Date" required>
                    <Input 
                      type="date" 
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)} 
                    />
                  </FormField>
                </div>
                <FormField label="Payment Note">
                  <Input 
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)} 
                    placeholder="Optional payment note (e.g., Cash, Bank transfer reference)" 
                  />
                </FormField>
              </div>
            )}
          </div>

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

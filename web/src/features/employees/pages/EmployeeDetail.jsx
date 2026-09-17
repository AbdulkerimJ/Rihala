import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEmployeeById, getEmployeeStats } from "../api";
import { getApiErrorMessage, unwrapEntityResponse, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate, formatDateTime } from "../../../utils/formatters";
import { usePermission } from "../../../hooks/usePermission";
import { getWeeklyPayrolls } from "../../weekly-payrolls/api";
import { getEmployeePayments } from "../../employee-payments/api";
import { Wallet, FileText, Clock, Banknote, UserSquare2 } from "lucide-react";
import { createEmployeePayment } from "../../employee-payments/api";
import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Can } from "../../../components/Can";
import { Button } from "../../../components/ui/Button";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Tabs } from "../../../components/ui/Tabs";
import { SystemInfoSection } from "../../../components/ui/SystemInfoSection";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { ListGroup, ListItem } from "../../../components/ui/ListGroup";
import { EntityHeader } from "../../../components/ui/EntityHeader";
import { EmployeePaymentModal } from "../../employee-payments/components/EmployeePaymentModal";
import { WeeklyPayrollSummaryModal } from "../../weekly-payrolls/components/WeeklyPayrollSummaryModal";
import toast from "react-hot-toast";

export const EmployeeDetail = () => {
  const { id } = useParams();
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("payrolls"); 
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPayrollId, setSelectedPayrollId] = useState(null);
  
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

  return (
    <div className="space-y-4 animate-[fadeSlideUp_0.3s_ease_both]">
      {/* ── Executive Header ── */}
      <EntityHeader
        parentTo="/employees"
        parentLabel="Employees"
        title={employee.name}
        theme="blue"
        typeLabel="Employee"
        typeIcon={UserSquare2}
        status={employee.status}
        phone={employee.phone}
        metaItems={[
          {
            icon: Clock,
            label: `Started ${formatDate(employee.employmentStartDate)}`,
          },
          employee.dailyRate && {
            icon: Banknote,
            label: (
              <span>
                <MoneyDisplay amount={employee.dailyRate} />/day
              </span>
            ),
          },
          {
            icon: FileText,
            label: `${payrolls.length} ${payrolls.length === 1 ? "Payroll" : "Payrolls"}`,
            onClick: () => setActiveTab("payrolls"),
            title: "View payroll history",
          },
        ].filter(Boolean)}
        actions={
          <Can permission="employeePayments.create">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsPaymentOpen(true)}
              className="shadow-xs h-8 px-3 text-xs whitespace-nowrap"
            >
              Record Payment
            </Button>
          </Can>
        }
        metrics={[
          {
            label: "Lifetime Earned",
            value: <MoneyDisplay amount={stats?.totalEarned ?? 0} />,
            subtitle: "From closed payrolls",
            isLoading: statsQuery.isLoading,
          },
          {
            label: "Total Paid",
            value: <MoneyDisplay amount={stats?.totalPaid ?? 0} />,
            subtitle: "Cash disbursed to date",
            isLoading: statsQuery.isLoading,
          },
          {
            label: "Current Balance",
            value: (
              <MoneyDisplay
                amount={stats?.currentBalance ?? 0}
              />
            ),
            isLoading: statsQuery.isLoading,
            statusDot:
              !stats || stats.currentBalance === 0
                ? { color: "success", text: "Fully settled" }
                : stats.currentBalance > 0
                ? { color: "danger", text: "Unpaid balance", pulse: true }
                : { color: "warning", text: "Overpaid" },
          },
        ]}
      />

      {/* ── Tabs ── */}
      <Tabs 
        tabs={[
          { id: "payrolls", label: "Payroll History", icon: Banknote },
          { id: "payments", label: "Payment History", icon: Wallet }
        ]} 
        activeTab={activeTab} 
        onChange={setActiveTab} 
      />

      {/* ── Tab Content: Payrolls ── */}
      {activeTab === "payrolls" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-3">Recent Payrolls</h3>
            {isPayrollsLoading ? (
              <DetailSkeleton />
            ) : payrolls?.length > 0 ? (
              <ListGroup>
                {payrolls.map(row => (
                  <ListItem
                    key={row._id}
                    onClick={() => setSelectedPayrollId(row._id)}
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
              <div className="text-center py-6 text-sm text-secondary flex flex-col items-center border border-dashed border-border/50 rounded-lg bg-surface/30">
                <Banknote className="h-8 w-8 text-muted mb-2" />
                No payrolls generated for this employee.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab Content: Payments ── */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-3">Payment History</h3>
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
              <div className="text-center py-6 text-sm text-secondary flex flex-col items-center border border-dashed border-border/50 rounded-lg bg-surface/30">
                <Wallet className="h-8 w-8 text-muted mb-2" />
                No payments have been recorded for this employee.
              </div>
            )}
          </div>
        </div>
      )}

      <EmployeePaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSubmit={paymentMutation.mutateAsync}
        preSelectedEmployee={employee}
      />

      <WeeklyPayrollSummaryModal
        payrollId={selectedPayrollId}
        isOpen={!!selectedPayrollId}
        onClose={() => setSelectedPayrollId(null)}
      />

      {/* ── System Information at bottom ── */}
      <SystemInfoSection
        id={employee._id}
        idLabel="Employee ID"
        createdAt={employee.createdAt}
        updatedAt={employee.updatedAt}
      />
    </div>
  );
};

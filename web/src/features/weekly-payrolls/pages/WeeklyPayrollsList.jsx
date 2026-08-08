import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { closeWeeklyPayroll, getCurrentPayrollCalculation, getWeeklyPayrolls } from "../api";
import { getEmployees } from "../../employees/api";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Modal } from "../../../components/ui/Modal";
import { DataTable } from "../../../components/ui/DataTable";
import { FilterBar } from "../../../components/ui/FilterBar";
import { FormField } from "../../../components/ui/FormField";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import toast from "react-hot-toast";
import { getApiErrorMessage, unwrapListResponse, unwrapEntityResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";
import { Calendar, CheckCircle } from "lucide-react";

const PayrollClosureModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState("");

  const { data: employeesData } = useQuery({ 
    queryKey: ["employees-list", "daily"], 
    queryFn: () => getEmployees({ employmentType: "daily", limit: 1000 }) 
  });
  const employees = unwrapListResponse(employeesData).items || [];

  const { data: calculationData, isLoading: isCalculating, isError, error } = useQuery({
    queryKey: ["payroll-calculation", selectedEmployee],
    queryFn: () => getCurrentPayrollCalculation(selectedEmployee),
    enabled: !!selectedEmployee,
    retry: false
  });
  
  const calculation = unwrapEntityResponse(calculationData);

  const closeMutation = useMutation({
    mutationFn: () => closeWeeklyPayroll(selectedEmployee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-payrolls"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] }); 
      toast.success("Payroll closed successfully");
      setSelectedEmployee("");
      onClose();
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to close payroll")),
  });

  return (
    <Modal isOpen={isOpen} title="Close Weekly Payroll" onClose={onClose}>
      <div className="space-y-4 p-6">
        <p className="text-sm text-secondary mb-4">
          Select a daily-wage employee to view their unclosed attendance and overtime, and close the payroll period.
        </p>

        <FormField label="Employee">
          <select 
            value={selectedEmployee} 
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">Select an employee</option>
            {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
          </select>
        </FormField>

        {selectedEmployee && isCalculating && <LoadingSkeleton variant="default" rowCount={3} />}
        {selectedEmployee && isError && (
          <div className="p-4 bg-danger/10 text-danger rounded-md text-sm border border-danger/20">
            {getApiErrorMessage(error, "Failed to calculate payroll or no pending records.")}
          </div>
        )}

        {selectedEmployee && calculation && !isCalculating && !isError && (
          <div className="space-y-4 pt-4 border-t border-border/50">
            <h4 className="font-semibold text-primary">Calculation Preview</h4>
            <div className="bg-main/50 rounded-lg p-4 space-y-3 text-sm border border-border/50">
              <div className="flex justify-between">
                <span className="text-secondary">Days Present:</span>
                <span className="font-medium text-primary">{calculation.totalDaysPresent} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Base Pay ({calculation.totalDaysPresent} x {calculation.dailyRate} ETB):</span>
                <span className="font-medium text-primary"><MoneyDisplay amount={calculation.totalBasePay} /></span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-secondary">Overtime Pay ({calculation.totalOvertimeHours} hrs):</span>
                <span className="font-medium text-primary"><MoneyDisplay amount={calculation.totalOvertimePay} /></span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-secondary">Previous Advances:</span>
                <span className="font-medium text-danger">- <MoneyDisplay amount={calculation.previousAdvances} /></span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="font-bold text-primary">Net Pay:</span>
                <span className="font-bold text-accent"><MoneyDisplay amount={calculation.netPay} variant="accent" /></span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={onClose} disabled={closeMutation.isPending}>Cancel</Button>
              <Button onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending}>
                <CheckCircle className="w-4 h-4 mr-2" />
                {closeMutation.isPending ? "Closing..." : "Close & Generate Payroll"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export const WeeklyPayrollsList = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", employee: "", from: "", to: "" });
  const [isOpen, setIsOpen] = useState(false);

  const { data: employeesData } = useQuery({ queryKey: ["employees-list"], queryFn: () => getEmployees({ limit: 1000 }) });
  const employees = unwrapListResponse(employeesData).items || [];

  const params = useMemo(() => ({
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
    page,
    limit: 20
  }), [filters, page]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["weekly-payrolls", params],
    queryFn: () => getWeeklyPayrolls(params),
  });
  const { items: payrolls, pagination } = unwrapListResponse(data);

  const columns = [
    { header: "Period", accessor: (row) => `${formatDate(row.periodStart)} - ${formatDate(row.periodEnd)}`, className: "font-medium" },
    { header: "Employee", accessor: (row) => row.employee?.name || "Unknown", className: "font-medium" },
    { header: "Net Pay", accessor: (row) => <MoneyDisplay amount={row.netPay} variant="accent" /> },
    { header: "Days", accessor: "totalDaysPresent", className: "text-secondary hidden sm:table-cell" },
    { 
      header: "Actions", 
      isActions: true,
      accessor: (row) => (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/weekly-payrolls/${row._id}`); }}>
            View Details
          </Button>
        </div>
      ) 
    }
  ];

  if (isLoading) return <LoadingSkeleton variant="default" rowCount={6} showSearch />;
  if (isError) return <ErrorState description={getApiErrorMessage(error, "Failed to load payroll records.")} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weekly Payrolls"
        description="Manage and close weekly payroll periods for daily-wage employees."
        actions={
          <Can permission="weeklyPayrolls.close">
            <Button onClick={() => setIsOpen(true)}>Close Payroll</Button>
          </Can>
        }
      />

      <FilterBar 
        searchPlaceholder="Search..."
        searchValue={filters.search}
        onSearchChange={(val) => { setFilters(p => ({ ...p, search: val })); setPage(1); }}
        onClear={Object.values(filters).some(Boolean) ? () => { setFilters({ search: "", employee: "", from: "", to: "" }); setPage(1); } : undefined}
      >
        <select
          value={filters.employee}
          onChange={(e) => { setFilters(p => ({ ...p, employee: e.target.value })); setPage(1); }}
          className="w-full rounded-md border border-border bg-main px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">All Employees</option>
          {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
        </select>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => { setFilters(p => ({ ...p, from: e.target.value })); setPage(1); }}
          className="w-full rounded-md border border-border bg-main px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => { setFilters(p => ({ ...p, to: e.target.value })); setPage(1); }}
          className="w-full rounded-md border border-border bg-main px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </FilterBar>

      <DataTable 
        columns={columns}
        data={payrolls}
        keyExtractor={(row) => row._id}
        onRowClick={(row) => navigate(`/weekly-payrolls/${row._id}`)}
        pagination={{ ...pagination, page }}
        onPageChange={setPage}
        emptyState={
          <EmptyState
            title="No payroll records found"
            description="Close your first weekly payroll for an employee."
            actionLabel="Close Payroll"
            onAction={() => setIsOpen(true)}
          />
        }
      />

      <PayrollClosureModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
};

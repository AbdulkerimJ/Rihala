import React, { useMemo, useState, useEffect } from "react";
import { Calculator } from "lucide-react";
import { usePermission } from "../../../hooks/usePermission";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getWeeklyPayrolls } from "../api";
import { getEmployees } from "../../employees/api";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";

import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Modal } from "../../../components/ui/Modal";
import { DataTable } from "../../../components/ui/DataTable";
import { FilterBar } from "../../../components/ui/FilterBar";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import toast from "react-hot-toast";
import { getApiErrorMessage, unwrapListResponse, cleanFilterParams } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";
import { PayrollClosureForm } from "../components/PayrollClosureForm";

export const WeeklyPayrollsList = () => {
  const { can } = usePermission();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", employee: "", from: "", to: "" });
  const [isOpen, setIsOpen] = useState(false);

  const { data: employeesData } = useQuery({ 
    queryKey: ["employees", "list"], 
    queryFn: () => getEmployees({ limit: 1000 }),
    enabled: can("employees.read")
  });
  const employees = unwrapListResponse(employeesData).items || [];

  const params = useMemo(() => cleanFilterParams(filters, { page, limit: 20 }), [filters, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["weekly-payrolls", params],
    queryFn: () => getWeeklyPayrolls(params),
    placeholderData: keepPreviousData,
    enabled: can("weeklyPayrolls.read"),
  });
  const { items: payrolls, pagination } = unwrapListResponse(data);

  useEffect(() => {
    if (pagination && pagination.page < pagination.totalPages) {
      const nextParams = { ...params, page: page + 1 };
      queryClient.prefetchQuery({
        queryKey: ["weekly-payrolls", nextParams],
        queryFn: () => getWeeklyPayrolls(nextParams),
      });
    }
  }, [pagination, page, params, queryClient]);

  const columns = [
    { header: "Period", accessor: (row) => `${formatDate(row.startDate)} - ${formatDate(row.endDate)}`, className: "font-medium" },
    { header: "Employee", accessor: (row) => row.employee?.name || "Unknown", className: "font-medium" },
    { header: "Normal Earnings", accessor: (row) => <MoneyDisplay amount={row.normalEarnings} /> },
    { header: "Overtime Earnings", accessor: (row) => <MoneyDisplay amount={row.overtimeEarnings} /> },
    { header: "Total Earnings", accessor: (row) => <MoneyDisplay amount={row.totalEarnings} variant="accent" /> },
  ];

  if (isError) return <ErrorState description={getApiErrorMessage(error, "Failed to load payroll records.")} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weekly Payrolls"
        description="Manage and close weekly payroll periods for daily-wage employees."
        actions={
          <Can permission="weeklyPayrolls.close">
            <Button variant="primary" leftIcon={Plus} onClick={() => setIsOpen(true)}>Close Payroll</Button>
          </Can>
        }
      />

      <FilterBar 
        searchPlaceholder="Search..."
        searchValue={filters.search}
        onSearchChange={(val) => { setFilters(p => ({ ...p, search: val })); setPage(1); }}
        onClear={Object.values(filters).some(Boolean) ? () => { setFilters({ search: "", employee: "", from: "", to: "" }); setPage(1); } : undefined}
      >
        <Select
          value={filters.employee}
          onChange={(e) => { setFilters(p => ({ ...p, employee: e.target.value })); setPage(1); }}
          options={[
            { value: "", label: "All Employees" },
            ...employees.map(e => ({ value: e._id, label: e.name }))
          ]}
        />
        <Input
          type="date"
          value={filters.from}
          onChange={(e) => { setFilters(p => ({ ...p, from: e.target.value })); setPage(1); }}
        />
        <Input
          type="date"
          value={filters.to}
          onChange={(e) => { setFilters(p => ({ ...p, to: e.target.value })); setPage(1); }}
        />
      </FilterBar>

      <DataTable 
        columns={columns}
        data={payrolls}
        keyExtractor={(row) => row._id}
        onRowClick={(row) => navigate(`/weekly-payrolls/${row._id}`)}
        pagination={{ ...pagination, page }}
        onPageChange={setPage}
        isLoading={isLoading}
        isFetching={isFetching}
        emptyState={
          <EmptyState
            title="No payroll records found"
            description="Close your first weekly payroll for an employee."
            actionLabel={can("weeklyPayrolls.close") ? "Close Payroll" : null}
            onAction={can("weeklyPayrolls.close") ? () => setIsOpen(true) : undefined}
          />
        }
      />

      <Modal isOpen={isOpen} title="Close Weekly Payroll" onClose={() => setIsOpen(false)}>
        <PayrollClosureForm onClose={() => setIsOpen(false)} />
      </Modal>
    </div>
  );
};


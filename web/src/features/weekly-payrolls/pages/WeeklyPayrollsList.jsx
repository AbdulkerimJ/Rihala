import React, { useMemo, useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { usePermission } from "../../../hooks/usePermission";
import { useDebounce } from "../../../hooks/useDebounce";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getWeeklyPayrolls } from "../api";
import { getEmployees } from "../../employees/api";

import { getApiErrorMessage, unwrapListResponse, cleanFilterParams } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { ErrorState } from "../../../components/ui/ErrorState";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Can } from "../../../components/Can";
import { Button } from "../../../components/ui/Button";
import { FilterBar } from "../../../components/ui/FilterBar";
import { Select } from "../../../components/ui/Select";
import { Input } from "../../../components/ui/Input";
import { DataTable } from "../../../components/ui/DataTable";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Modal } from "../../../components/ui/Modal";
import { PayrollClosureForm } from "../components/PayrollClosureForm";

export const WeeklyPayrollsList = () => {
  const { can } = usePermission();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", employee: "", from: "", to: "" }); 
  const debouncedSearch = useDebounce(filters.search, 300);
  const [isOpen, setIsOpen] = useState(false);

  React.useEffect(() => {
    if (searchParams.get("action") === "new" && can("weeklyPayrolls.close")) {
      setIsOpen(true);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete("action");
        return next;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams, can]);

  const { data: employeesData } = useQuery({ 
    queryKey: ["employees", "list"], 
    queryFn: () => getEmployees({ limit: 1000 }),
    enabled: can("employees.read")
  });
  const employees = unwrapListResponse(employeesData).items || [];

  const params = useMemo(() => cleanFilterParams({ ...filters, search: debouncedSearch }, { page, limit: 20 }), [filters, debouncedSearch, page]);

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
        filters={filters}
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
        mobileRow={(row) => ({
          title: row.employee?.name || "Unknown",
          subtitle: `${formatDate(row.startDate)} - ${formatDate(row.endDate)}`,
          right: (
            <span className="text-xs font-bold text-accent tracking-tight shrink-0">
              <MoneyDisplay amount={row.totalEarnings} />
            </span>
          )
        })}
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


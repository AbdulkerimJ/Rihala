import React, { useMemo, useState } from "react";
import { usePermission } from "../../../hooks/usePermission";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { createEmployeePayment, getEmployeePayments, voidEmployeePayment } from "../api";
import { getEmployees } from "../../employees/api";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";
import { EmployeePaymentModal } from "../components/EmployeePaymentModal";

import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Modal } from "../../../components/ui/Modal";
import { DataTable } from "../../../components/ui/DataTable";
import { FilterBar } from "../../../components/ui/FilterBar";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { VoidReasonDialog } from "../../../components/ui/VoidReasonDialog";
import { FormRootError } from "../../../components/ui/FormRootError";
import { CurrencyInput } from "../../../components/ui/CurrencyInput";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { applyServerErrors, cleanFilterParams, getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";



export const EmployeePaymentsList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", employee: "", status: "", type: "" });
  const [isOpen, setIsOpen] = useState(false);
  const [voidingPayment, setVoidingPayment] = useState(null);

  const { data: employeesData } = useQuery({ 
    queryKey: ["employees", "list"], 
    queryFn: () => getEmployees({ limit: 1000 }),
    enabled: can("employees.read")
  });
  const employees = unwrapListResponse(employeesData).items || [];

  const params = useMemo(() => cleanFilterParams(filters, { page, limit: 20 }), [filters, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["employee-payments", params],
    queryFn: () => getEmployeePayments(params),
    placeholderData: keepPreviousData,
    enabled: can("employeePayments.read"),
  });
  const { items: payments, pagination } = unwrapListResponse(data);

  usePrefetchNextPage({
    queryKey: ["employee-payments"],
    queryFn: getEmployeePayments,
    pagination,
    params,
    page,
  });

  const createMutation = useMutation({
    mutationFn: createEmployeePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-payments"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] }); // Balance changed
      toast.success("Payment recorded successfully");
      setIsOpen(false);
    },
  });

  const voidMutation = useMutation({
    mutationFn: voidEmployeePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-payments"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] }); // Balance changed
      toast.success("Payment voided successfully");
      setVoidingPayment(null);
    },
  });

  const columns = [
    { header: "Reference", accessor: (row) => row.paymentReference || "-", className: "font-mono font-medium text-xs hidden sm:table-cell" },
    { header: "Employee", accessor: (row) => row.employee?.name || "Unknown", className: "font-medium" },
    { header: "Date", accessor: (row) => formatDate(row.paymentDate), className: "text-secondary" },
    { header: "Amount", accessor: (row) => <MoneyDisplay amount={row.amount} className={row.status === 'voided' ? 'line-through opacity-50' : ''} /> },
    { header: "Type", accessor: (row) => <span className="capitalize">{row.type?.replace('_', ' ') || "—"}</span>, className: "text-secondary hidden md:table-cell" },
    { 
      header: "Status", 
      accessor: (row) => <StatusBadge status={row.status} />
    },
    { 
      header: "Actions", 
      isActions: true,
      accessor: (row) => (
        <div className="flex justify-end gap-2">
          <Can permission="employeePayments.void">
            {row.status !== 'voided' && (
              <Button variant="danger-ghost" size="sm" onClick={(e) => { e.stopPropagation(); setVoidingPayment(row); }}>
                Void
              </Button>
            )}
          </Can>
        </div>
      ) 
    }
  ];

  if (isError) return <ErrorState description={getApiErrorMessage(error, "Failed to load payments.")} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Payments"
        description="Record and track payments made to staff (salaries, advances, bonuses)."
        actions={
          <Can permission="employeePayments.create">
            <Button onClick={() => setIsOpen(true)}>Record Payment</Button>
          </Can>
        }
      />

      <FilterBar 
        searchPlaceholder="Search by receipt or ref..."
        searchValue={filters.search}
        onSearchChange={(val) => { setFilters(p => ({ ...p, search: val })); setPage(1); }}
        onClear={Object.values(filters).some(Boolean) ? () => { setFilters({ search: "", employee: "", status: "", type: "" }); setPage(1); } : undefined}
      >
        <Select
          value={filters.employee}
          onChange={(e) => { setFilters(p => ({ ...p, employee: e.target.value })); setPage(1); }}
          options={[
            { value: "", label: "All Employees" },
            ...employees.map(e => ({ value: e._id, label: e.name }))
          ]}
        />
        <Select
          value={filters.type}
          onChange={(e) => { setFilters(p => ({ ...p, type: e.target.value })); setPage(1); }}
          options={[
            { value: "", label: "All Types" },
            { value: "salary", label: "Salary" },
            { value: "advance", label: "Advance" },
            { value: "bonus", label: "Bonus" },
            { value: "other", label: "Other" },
          ]}
        />
        <Select
          value={filters.status}
          onChange={(e) => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1); }}
          options={[
            { value: "", label: "Active Only (Default)" },
            { value: "voided", label: "Voided Only" },
            { value: "all", label: "All Payments" },
          ]}
        />
      </FilterBar>

      <DataTable 
        columns={columns}
        data={payments}
        keyExtractor={(row) => row._id}
        pagination={{ ...pagination, page }}
        onPageChange={setPage}
        isLoading={isLoading}
        isFetching={isFetching}
        emptyState={
          <EmptyState
            title="No payments found"
            description="Record a payment made to an employee."
            actionLabel={can("employeePayments.create") ? "Record Payment" : null}
            onAction={can("employeePayments.create") ? () => setIsOpen(true) : undefined}
          />
        }
      />

      <EmployeePaymentModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={createMutation.mutateAsync}
      />

      <VoidReasonDialog
        isOpen={!!voidingPayment}
        title="Void Payment"
        description={`Are you sure you want to void this payment of ${voidingPayment?.amount} ETB? This action cannot be undone and will reverse the employee's balance.`}
        confirmLabel="Void Payment"
        isSubmitting={voidMutation.isPending}
        onConfirm={(reason) => voidMutation.mutateAsync({ id: voidingPayment._id, voidReason: reason })}
        onCancel={() => setVoidingPayment(null)}
      />
    </div>
  );
};



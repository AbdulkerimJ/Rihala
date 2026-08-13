import React, { useMemo, useState, useEffect } from "react";
import { usePermission } from "../../../hooks/usePermission";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { createEmployeePayment, getEmployeePayments, voidEmployeePayment } from "../api";
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
import { Textarea } from "../../../components/ui/Textarea";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";

const paymentSchema = z.object({
  employee: z.string().min(1, "Employee is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  paymentType: z.enum(["salary", "advance", "bonus", "other"]).default("advance"),
  paymentMethod: z.enum(["cash", "bank_transfer", "check", "other"]).default("cash"),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  paymentDate: z.string().min(1, "Payment date is required"),
});

const PaymentForm = ({ onSubmit, onClose }) => {
  const { can } = usePermission();
  const { data: employeesData } = useQuery({ 
    queryKey: ["employees-list"], 
    queryFn: () => getEmployees({ limit: 1000 }),
    enabled: can("employees.read")
  });
  const employees = unwrapListResponse(employeesData).items || [];
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      employee: "",
      amount: "",
      paymentType: "advance",
      paymentMethod: "cash",
      referenceNumber: "",
      notes: "",
      paymentDate: new Date().toISOString().split("T")[0],
    },
  });

  return (
    <form className="space-y-4 p-6" onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Employee" required error={errors.employee?.message}>
        <Select
          {...register("employee")}
          placeholder="Select an employee"
          options={employees.map(e => ({ value: e._id, label: e.name }))}
          error={errors.employee?.message}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Payment Type" error={errors.paymentType?.message}>
          <Select
            {...register("paymentType")}
            options={[
              { value: "advance", label: "Salary Advance" },
              { value: "salary", label: "Regular Salary" },
              { value: "bonus", label: "Bonus" },
              { value: "other", label: "Other" },
            ]}
            error={errors.paymentType?.message}
          />
        </FormField>

        <FormField label="Amount (ETB)" required error={errors.amount?.message}>
          <Input type="number" step="0.01" {...register("amount")} error={errors.amount?.message} />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Payment Date" required error={errors.paymentDate?.message}>
          <Input type="date" {...register("paymentDate")} error={errors.paymentDate?.message} />
        </FormField>
        
        <FormField label="Payment Method" error={errors.paymentMethod?.message}>
          <Select
            {...register("paymentMethod")}
            options={[
              { value: "cash", label: "Cash" },
              { value: "bank_transfer", label: "Bank Transfer" },
              { value: "check", label: "Check" },
              { value: "other", label: "Other" },
            ]}
            error={errors.paymentMethod?.message}
          />
        </FormField>
      </div>

      <FormField label="Reference Number" error={errors.referenceNumber?.message}>
        <Input {...register("referenceNumber")} placeholder="e.g. TXN ID" error={errors.referenceNumber?.message} />
      </FormField>

      <FormField label="Notes" error={errors.notes?.message}>
        <Textarea {...register("notes")} rows={2} error={errors.notes?.message} />
      </FormField>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" isLoading={isSubmitting}>Record Payment</Button>
      </div>
    </form>
  );
};

export const EmployeePaymentsList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", employee: "", status: "", paymentType: "" });
  const [isOpen, setIsOpen] = useState(false);
  const [voidingPayment, setVoidingPayment] = useState(null);
  const [voidReason, setVoidReason] = useState("");

  const { data: employeesData } = useQuery({ 
    queryKey: ["employees-list"], 
    queryFn: () => getEmployees({ limit: 1000 }),
    enabled: can("employees.read")
  });
  const employees = unwrapListResponse(employeesData).items || [];

  const params = useMemo(() => ({
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
    page,
    limit: 20
  }), [filters, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["employee-payments", params],
    queryFn: () => getEmployeePayments(params),
    placeholderData: keepPreviousData,
    enabled: can("employeePayments.read"),
  });
  const { items: payments, pagination } = unwrapListResponse(data);

  useEffect(() => {
    if (pagination && pagination.page < pagination.totalPages) {
      const nextParams = { ...params, page: page + 1 };
      queryClient.prefetchQuery({
        queryKey: ["employee-payments", nextParams],
        queryFn: () => getEmployeePayments(nextParams),
      });
    }
  }, [pagination, page, params, queryClient]);

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
      setVoidReason("");
    },
  });

  const columns = [
    { header: "Receipt No", accessor: (row) => row.receiptNumber || "-", className: "font-mono font-medium text-xs hidden sm:table-cell" },
    { header: "Employee", accessor: (row) => row.employee?.name || "Unknown", className: "font-medium" },
    { header: "Date", accessor: (row) => formatDate(row.paymentDate), className: "text-secondary" },
    { header: "Amount", accessor: (row) => <MoneyDisplay amount={row.amount} className={row.status === 'voided' ? 'line-through opacity-50' : ''} /> },
    { header: "Type", accessor: (row) => <span className="capitalize">{row.paymentType?.replace('_', ' ') || "—"}</span>, className: "text-secondary hidden md:table-cell" },
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
              <Button variant="ghostDanger" size="sm" onClick={(e) => { e.stopPropagation(); setVoidingPayment(row); }}>
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
        onClear={Object.values(filters).some(Boolean) ? () => { setFilters({ search: "", employee: "", status: "", paymentType: "" }); setPage(1); } : undefined}
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
          value={filters.paymentType}
          onChange={(e) => { setFilters(p => ({ ...p, paymentType: e.target.value })); setPage(1); }}
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
            { value: "", label: "All Statuses" },
            { value: "valid", label: "Valid" },
            { value: "voided", label: "Voided" },
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

      <Modal isOpen={isOpen} title="Record Payment to Employee" onClose={() => setIsOpen(false)}>
        <PaymentForm
          onClose={() => setIsOpen(false)}
          onSubmit={(data) => createMutation.mutateAsync(data)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!voidingPayment}
        title="Void Payment"
        message={`Are you sure you want to void this payment of ${voidingPayment?.amount} ETB? This action cannot be undone and will reverse the employee's balance.`}
        confirmLabel="Void Payment"
        cancelLabel="Cancel"
        onConfirm={() => voidMutation.mutateAsync({ id: voidingPayment._id, voidReason })}
        onCancel={() => { setVoidingPayment(null); setVoidReason(""); }}
        isDestructive
        isLoading={voidMutation.isPending}
      >
        <div className="mt-4">
          <FormField label="Reason for voiding (required)">
            <Input
              type="text"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Entered by mistake, wrong amount, etc."
              required
            />
          </FormField>
        </div>
      </ConfirmDialog>
    </div>
  );
};


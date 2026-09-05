import { useMemo, useState } from "react";
import { Banknote } from "lucide-react";
import { usePermission } from "../../../hooks/usePermission";
import { useDebounce } from "../../../hooks/useDebounce";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { createEmployeePayment, getEmployeePayments, voidEmployeePayment } from "../api";
import { getEmployees } from "../../employees/api";

import toast from "react-hot-toast";
import { cleanFilterParams, getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Can } from "../../../components/Can";
import { Button } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/ui/ErrorState";
import { PageHeader } from "../../../components/ui/PageHeader";
import { FilterBar } from "../../../components/ui/FilterBar";
import { Select } from "../../../components/ui/Select";
import { DataTable } from "../../../components/ui/DataTable";
import { EmptyState } from "../../../components/ui/EmptyState";
import { EmployeePaymentModal } from "../components/EmployeePaymentModal";
import { VoidReasonDialog } from "../../../components/ui/VoidReasonDialog";
import { PaymentDetailsModal } from "../../../components/ui/PaymentDetailsModal";

export const EmployeePaymentsList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", employee: "", status: "", type: "" }); 
  const debouncedSearch = useDebounce(filters.search, 300);
  const [isOpen, setIsOpen] = useState(false);
  const [voidingPayment, setVoidingPayment] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const { data: employeesData } = useQuery({ 
    queryKey: ["employees", "list"], 
    queryFn: () => getEmployees({ limit: 1000 }),
    enabled: can("employees.read")
  });
  const employees = unwrapListResponse(employeesData).items || [];

  const params = useMemo(() => cleanFilterParams({ ...filters, search: debouncedSearch }, { page, limit: 20 }), [filters, debouncedSearch, page]);

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
        description="Record and track payments made to staff."
        actions={
          <Can permission="employeePayments.create">
            <Button leftIcon={Banknote} onClick={() => setIsOpen(true)}>
              Record Payment
            </Button>
          </Can>
        }
      />

      <FilterBar 
        filters={filters}
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
            { value: "regular", label: "Regular" },
            { value: "advance", label: "Advance" },
          ]}
        />
        <Select
          value={filters.status}
          onChange={(e) => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1); }}
          options={[
            { value: "", label: "Active" },
            { value: "voided", label: "Voided" },
            { value: "all", label: "All Payments" },
          ]}
        />
      </FilterBar>

      <DataTable 
        columns={columns}
        data={payments}
        keyExtractor={(row) => row._id}
        onRowClick={(row) => setSelectedPayment(row)}
        mobileRow={(row) => ({
          title: row.employee?.name || "Unknown",
          subtitle: (
            <span>
              {formatDate(row.paymentDate)} • <span className="capitalize">{row.type?.replace('_', ' ') || "—"}</span>
            </span>
          ),
          right: (
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-bold text-primary ${row.status === 'voided' ? 'line-through opacity-50 text-secondary' : ''}`}>
                <MoneyDisplay amount={row.amount} className="text-inherit font-bold" />
              </span>
              <StatusBadge status={row.status} />
            </div>
          ),
          actions: row.status !== 'voided' ? (
            <Can permission="employeePayments.void">
              <Button variant="danger-ghost" size="sm" onClick={(e) => { e.stopPropagation(); setVoidingPayment(row); }}>
                Void
              </Button>
            </Can>
          ) : null
        })}
        pagination={{ ...pagination, page }}
        onPageChange={setPage}
        isLoading={isLoading}
        isFetching={isFetching}
        emptyState={
          <EmptyState
            title="No payments found"
            description="Record a payment made to an employee."
            actionLabel={can("employeePayments.create") ? "Record Payment" : null}
            actionIcon={Banknote}
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

      <PaymentDetailsModal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        payment={selectedPayment}
        type="employee"
      />
    </div>
  );
};



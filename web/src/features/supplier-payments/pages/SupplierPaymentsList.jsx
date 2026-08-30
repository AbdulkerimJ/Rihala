import React, { useMemo, useState } from "react";
import { usePermission } from "../../../hooks/usePermission";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { createSupplierPayment, getSupplierPayments, voidSupplierPayment } from "../api";
import { getSuppliers } from "../../suppliers/api";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";

import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { DataTable } from "../../../components/ui/DataTable";
import { FilterBar } from "../../../components/ui/FilterBar";
import { Select } from "../../../components/ui/Select";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { SupplierPaymentModal } from "../components/SupplierPaymentModal";
import { VoidReasonDialog } from "../../../components/ui/VoidReasonDialog";
import toast from "react-hot-toast";
import { cleanFilterParams, getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";



export const SupplierPaymentsList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", supplier: "", status: "", from: "", to: "" });
  const [isOpen, setIsOpen] = useState(false);
  const [voidingPayment, setVoidingPayment] = useState(null);

  const { data: suppliersData } = useQuery({ 
    queryKey: ["suppliers", "list"], 
    queryFn: () => getSuppliers({ limit: 1000 }),
    enabled: can("suppliers.read")
  });
  const suppliers = unwrapListResponse(suppliersData).items || [];

  const params = useMemo(() => cleanFilterParams(filters, { page, limit: 20 }), [filters, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["supplier-payments", params],
    queryFn: () => getSupplierPayments(params),
    placeholderData: keepPreviousData,
    enabled: can("supplierPayments.read"),
  });
  const { items: payments, pagination } = unwrapListResponse(data);

  usePrefetchNextPage({
    queryKey: ["supplier-payments"],
    queryFn: getSupplierPayments,
    pagination,
    params,
    page,
  });

  const createMutation = useMutation({
    mutationFn: createSupplierPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-payments"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] }); // Balance changed
      queryClient.invalidateQueries({ queryKey: ["purchases"] }); // Purchase payment status changed
      toast.success("Payment recorded successfully");
      setIsOpen(false);
    },
  });

  const voidMutation = useMutation({
    mutationFn: voidSupplierPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-payments"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] }); // Balance changed
      queryClient.invalidateQueries({ queryKey: ["purchases"] }); // Purchase payment status changed
      toast.success("Payment voided successfully");
      setVoidingPayment(null);
    },
  });

  const columns = [
    { header: "Receipt No", accessor: (row) => row.paymentReference || "-", className: "font-mono font-medium text-xs hidden sm:table-cell" },
    { header: "Supplier", accessor: (row) => row.supplier?.name || "Unknown", className: "font-medium" },
    { header: "Date", accessor: (row) => formatDate(row.date), className: "text-secondary" },
    { header: "Amount", accessor: (row) => <MoneyDisplay amount={row.amount} className={row.status === 'voided' ? 'line-through opacity-50' : ''} /> },
    { 
      header: "Status", 
      accessor: (row) => <StatusBadge status={row.status} />
    },
    { 
      header: "Actions", 
      isActions: true,
      accessor: (row) => (
        <div className="flex justify-end gap-2">
          <Can permission="supplierPayments.void">
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
        title="Supplier Payments"
        description="Record and track payments made to suppliers."
        actions={
          <Can permission="supplierPayments.create">
            <Button onClick={() => setIsOpen(true)}>Record Payment</Button>
          </Can>
        }
      />

      <FilterBar 
        searchPlaceholder="Search by receipt or ref..."
        searchValue={filters.search}
        onSearchChange={(val) => { setFilters(p => ({ ...p, search: val })); setPage(1); }}
        onClear={Object.values(filters).some(Boolean) ? () => { setFilters({ search: "", supplier: "", status: "", from: "", to: "" }); setPage(1); } : undefined}
      >
        <Select
          value={filters.supplier}
          onChange={(e) => { setFilters(p => ({ ...p, supplier: e.target.value })); setPage(1); }}
          options={[
            { value: "", label: "All Suppliers" },
            ...suppliers.map(s => ({ value: s._id, label: s.name }))
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
            description="Record a payment made to a supplier."
            actionLabel={can("supplierPayments.create") ? "Record Payment" : null}
            onAction={can("supplierPayments.create") ? () => setIsOpen(true) : undefined}
          />
        }
      />

      <SupplierPaymentModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={(data) => createMutation.mutateAsync(data)}
      />

      <VoidReasonDialog
        isOpen={!!voidingPayment}
        title="Void Payment"
        description={`Are you sure you want to void this payment of ${voidingPayment?.amount} ETB? This action cannot be undone and will reverse the supplier's balance.`}
        confirmLabel="Void Payment"
        isSubmitting={voidMutation.isPending}
        onConfirm={(reason) => voidMutation.mutateAsync({ id: voidingPayment._id, voidReason: reason })}
        onCancel={() => setVoidingPayment(null)}
      />
    </div>
  );
};



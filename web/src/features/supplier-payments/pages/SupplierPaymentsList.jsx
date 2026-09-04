import React, { useMemo, useState } from "react";
import { Plus, HandCoins } from "lucide-react";
import { usePermission } from "../../../hooks/usePermission";
import { useDebounce } from "../../../hooks/useDebounce";
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
import { Input } from "../../../components/ui/Input";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { SupplierPaymentModal } from "../components/SupplierPaymentModal";
import { VoidReasonDialog } from "../../../components/ui/VoidReasonDialog";
import toast from "react-hot-toast";
import { cleanFilterParams, getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";
import { PaymentDetailsModal } from "../../../components/ui/PaymentDetailsModal";



export const SupplierPaymentsList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", supplier: "", status: "", from: "", to: "" }); 
  const debouncedSearch = useDebounce(filters.search, 300);
  const [isOpen, setIsOpen] = useState(false);
  const [voidingPayment, setVoidingPayment] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const { data: suppliersData } = useQuery({ 
    queryKey: ["suppliers", "list"], 
    queryFn: () => getSuppliers({ limit: 1000 }),
    enabled: can("suppliers.read")
  });
  const suppliers = unwrapListResponse(suppliersData).items || [];

  const params = useMemo(() => cleanFilterParams({ ...filters, search: debouncedSearch }, { page, limit: 20 }), [filters, debouncedSearch, page]);

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
            <Button leftIcon={HandCoins} onClick={() => setIsOpen(true)}>
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
            { value: "", label: "Active" },
            { value: "voided", label: "Voided" },
            { value: "all", label: "All Statuses" },
          ]}
        />
        <Input
          type="date"
          value={filters.from}
          onChange={(e) => { setFilters(p => ({ ...p, from: e.target.value })); setPage(1); }}
          placeholder="From Date"
        />
        <Input
          type="date"
          value={filters.to}
          onChange={(e) => { setFilters(p => ({ ...p, to: e.target.value })); setPage(1); }}
          placeholder="To Date"
        />
      </FilterBar>

      <DataTable 
        columns={columns}
        data={payments}
        keyExtractor={(row) => row._id}
        onRowClick={(row) => setSelectedPayment(row)}
        mobileRow={(row) => ({
          title: row.supplier?.name || "Unknown",
          subtitle: `${row.paymentReference || "-"} • ${formatDate(row.date)}`,
          right: (
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-bold text-primary ${row.status === 'voided' ? 'line-through opacity-50 text-secondary' : ''}`}>
                <MoneyDisplay amount={row.amount} className="text-inherit font-bold" />
              </span>
              <StatusBadge status={row.status} />
            </div>
          ),
          actions: row.status !== 'voided' ? (
            <Can permission="supplierPayments.void">
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
            description="Record a payment made to a supplier."
            actionLabel={can("supplierPayments.create") ? "Record Payment" : null}
            actionIcon={HandCoins}
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

      <PaymentDetailsModal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        payment={selectedPayment}
        type="supplier"
      />
    </div>
  );
};



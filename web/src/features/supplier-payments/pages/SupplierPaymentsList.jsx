import React, { useMemo, useState } from "react";
import { usePermission } from "../../../hooks/usePermission";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { createSupplierPayment, getSupplierPayments, voidSupplierPayment } from "../api";
import { getSuppliers } from "../../suppliers/api";
import { getPurchases } from "../../purchases/api";
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
import { VoidReasonDialog } from "../../../components/ui/VoidReasonDialog";
import { FormRootError } from "../../../components/ui/FormRootError";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { applyServerErrors, cleanFilterParams, getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";

const paymentSchema = z.object({
  supplier: z.string().min(1, "Supplier is required"),
  purchase: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  paymentDate: z.string().min(1, "Payment date is required"),
});

const PaymentForm = ({ onSubmit, onClose }) => {
  const { can } = usePermission();
  const { data: suppliersData } = useQuery({ 
    queryKey: ["suppliers", "list"], 
    queryFn: () => getSuppliers({ limit: 1000 }),
    enabled: can("suppliers.read")
  });
  const suppliers = unwrapListResponse(suppliersData).items || [];
  
  const { register, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      supplier: "",
      purchase: "",
      amount: "",
      referenceNumber: "",
      notes: "",
      paymentDate: new Date().toISOString().split("T")[0],
    },
  });

  const selectedSupplier = watch("supplier");

  const { data: purchasesData } = useQuery({ 
    queryKey: ["purchases-by-supplier", selectedSupplier], 
    queryFn: () => getPurchases({ supplier: selectedSupplier, limit: 100 }),
    enabled: !!selectedSupplier && can("purchases.read")
  });
  const purchases = unwrapListResponse(purchasesData).items || [];

  const handleFormSubmit = async (data) => {
    try {
      const payload = {
        type: data.purchase ? "SPECIFIC" : "GENERAL",
        supplier: data.supplier,
        amount: data.amount,
        date: new Date(data.paymentDate).toISOString(),
        paymentReference: data.referenceNumber,
        note: data.notes,
      };
      if (data.purchase) {
        payload.purchaseId = data.purchase;
      }

      await onSubmit(payload);
    } catch (error) {
      applyServerErrors(setError, error);
    }
  };

  return (
    <form className="space-y-4 p-6" onSubmit={handleSubmit(handleFormSubmit)}>
      <FormRootError error={errors.root} />
      <FormField label="Supplier" required error={errors.supplier?.message}>
        <Select
          {...register("supplier")}
          placeholder="Select a supplier"
          options={suppliers.map(s => ({ value: s._id, label: s.name }))}
          error={errors.supplier?.message}
        />
      </FormField>

      <FormField label="Purchase (Optional)" error={errors.purchase?.message}>
        <Select
          {...register("purchase")}
          disabled={!selectedSupplier}
          placeholder="Apply to general balance"
          options={purchases.map(p => ({ value: p._id, label: `${p.purchaseNumber} - ${p.totalAmount} ETB` }))}
          error={errors.purchase?.message}
        />
        {!selectedSupplier && <p className="text-xs text-secondary mt-1">Select a supplier first</p>}
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Amount (ETB)" required error={errors.amount?.message}>
          <Input type="number" placeholder="0" {...register("amount")} error={errors.amount?.message} />
        </FormField>
        
        <FormField label="Payment Date" required error={errors.paymentDate?.message}>
          <Input type="date" {...register("paymentDate")} error={errors.paymentDate?.message} />
        </FormField>
      </div>

      <FormField label="Reference Number" error={errors.referenceNumber?.message}>
        <Input {...register("referenceNumber")} placeholder="e.g. Check # or TXN ID" error={errors.referenceNumber?.message} />
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
      toast.success("Payment recorded successfully");
      setIsOpen(false);
    },
  });

  const voidMutation = useMutation({
    mutationFn: voidSupplierPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-payments"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] }); // Balance changed
      toast.success("Payment voided successfully");
      setVoidingPayment(null);
    },
  });

  const columns = [
    { header: "Receipt No", accessor: (row) => row.receiptNumber || "-", className: "font-mono font-medium text-xs hidden sm:table-cell" },
    { header: "Supplier", accessor: (row) => row.supplier?.name || "Unknown", className: "font-medium" },
    { header: "Date", accessor: (row) => formatDate(row.paymentDate), className: "text-secondary" },
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

      <Modal isOpen={isOpen} title="Record Payment to Supplier" onClose={() => setIsOpen(false)}>
        <PaymentForm
          onClose={() => setIsOpen(false)}
          onSubmit={(data) => createMutation.mutateAsync(data)}
        />
      </Modal>

      <VoidReasonDialog
        isOpen={!!voidingPayment}
        title="Void Payment"
        message={`Are you sure you want to void this payment of ${voidingPayment?.amount} ETB? This action cannot be undone and will reverse the supplier's balance.`}
        confirmLabel="Void Payment"
        isLoading={voidMutation.isPending}
        onConfirm={(reason) => voidMutation.mutateAsync({ id: voidingPayment._id, voidReason: reason })}
        onCancel={() => setVoidingPayment(null)}
      />
    </div>
  );
};



import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSupplierPayment, getSupplierPayments, voidSupplierPayment } from "../api";
import { getSuppliers } from "../../suppliers/api";
import { getPurchases } from "../../purchases/api";
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
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";

const paymentSchema = z.object({
  supplier: z.string().min(1, "Supplier is required"),
  purchase: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  paymentMethod: z.enum(["cash", "bank_transfer", "check", "other"]).default("cash"),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  paymentDate: z.string().min(1, "Payment date is required"),
});

const PaymentForm = ({ onSubmit, onClose }) => {
  const { data: suppliersData } = useQuery({ queryKey: ["suppliers-list"], queryFn: () => getSuppliers({ limit: 1000 }) });
  const suppliers = unwrapListResponse(suppliersData).items || [];
  
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      supplier: "",
      purchase: "",
      amount: "",
      paymentMethod: "bank_transfer",
      referenceNumber: "",
      notes: "",
      paymentDate: new Date().toISOString().split("T")[0],
    },
  });

  const selectedSupplier = watch("supplier");

  const { data: purchasesData } = useQuery({ 
    queryKey: ["purchases-by-supplier", selectedSupplier], 
    queryFn: () => getPurchases({ supplier: selectedSupplier, limit: 100 }),
    enabled: !!selectedSupplier
  });
  const purchases = unwrapListResponse(purchasesData).items || [];

  return (
    <form className="space-y-4 p-6" onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Supplier" required error={errors.supplier?.message}>
        <select {...register("supplier")} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent">
          <option value="">Select a supplier</option>
          {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </FormField>

      <FormField label="Purchase (Optional)" error={errors.purchase?.message}>
        <select {...register("purchase")} disabled={!selectedSupplier} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50">
          <option value="">Apply to general balance</option>
          {purchases.map(p => <option key={p._id} value={p._id}>{p.purchaseNumber} - {p.totalAmount} ETB</option>)}
        </select>
        {!selectedSupplier && <p className="text-xs text-secondary mt-1">Select a supplier first</p>}
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Amount (ETB)" required error={errors.amount?.message}>
          <input type="number" step="0.01" {...register("amount")} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
        </FormField>
        
        <FormField label="Payment Date" required error={errors.paymentDate?.message}>
          <input type="date" {...register("paymentDate")} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Payment Method" error={errors.paymentMethod?.message}>
          <select {...register("paymentMethod")} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent">
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="check">Check</option>
            <option value="other">Other</option>
          </select>
        </FormField>

        <FormField label="Reference Number" error={errors.referenceNumber?.message}>
          <input {...register("referenceNumber")} placeholder="e.g. Check # or TXN ID" className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
        </FormField>
      </div>

      <FormField label="Notes" error={errors.notes?.message}>
        <textarea {...register("notes")} rows={2} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
      </FormField>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Processing..." : "Record Payment"}</Button>
      </div>
    </form>
  );
};

export const SupplierPaymentsList = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", supplier: "", status: "", from: "", to: "" });
  const [isOpen, setIsOpen] = useState(false);
  const [voidingPayment, setVoidingPayment] = useState(null);
  const [voidReason, setVoidReason] = useState("");

  const { data: suppliersData } = useQuery({ queryKey: ["suppliers-list"], queryFn: () => getSuppliers({ limit: 1000 }) });
  const suppliers = unwrapListResponse(suppliersData).items || [];

  const params = useMemo(() => ({
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
    page,
    limit: 20
  }), [filters, page]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["supplier-payments", params],
    queryFn: () => getSupplierPayments(params),
  });
  const { items: payments, pagination } = unwrapListResponse(data);

  const createMutation = useMutation({
    mutationFn: createSupplierPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-payments"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] }); // Balance changed
      toast.success("Payment recorded successfully");
      setIsOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to record payment")),
  });

  const voidMutation = useMutation({
    mutationFn: voidSupplierPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-payments"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] }); // Balance changed
      toast.success("Payment voided successfully");
      setVoidingPayment(null);
      setVoidReason("");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to void payment")),
  });

  const columns = [
    { header: "Receipt No", accessor: (row) => row.receiptNumber || "-", className: "font-mono font-medium text-xs hidden sm:table-cell" },
    { header: "Supplier", accessor: (row) => row.supplier?.name || "Unknown", className: "font-medium" },
    { header: "Date", accessor: (row) => formatDate(row.paymentDate), className: "text-secondary" },
    { header: "Amount", accessor: (row) => <MoneyDisplay amount={row.amount} className={row.status === 'voided' ? 'line-through opacity-50' : ''} /> },
    { header: "Method", accessor: (row) => <span className="capitalize">{row.paymentMethod.replace('_', ' ')}</span>, className: "text-secondary hidden md:table-cell" },
    { 
      header: "Status", 
      accessor: (row) => (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${row.status === 'voided' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
          {row.status === 'voided' ? 'Voided' : 'Valid'}
        </span>
      )
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

  if (isLoading) return <LoadingSkeleton variant="default" rowCount={6} showSearch />;
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
        <select
          value={filters.supplier}
          onChange={(e) => { setFilters(p => ({ ...p, supplier: e.target.value })); setPage(1); }}
          className="w-full rounded-md border border-border bg-main px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">All Suppliers</option>
          {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <select
          value={filters.status}
          onChange={(e) => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1); }}
          className="w-full rounded-md border border-border bg-main px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">All Statuses</option>
          <option value="valid">Valid</option>
          <option value="voided">Voided</option>
        </select>
      </FilterBar>

      <DataTable 
        columns={columns}
        data={payments}
        keyExtractor={(row) => row._id}
        pagination={{ ...pagination, page }}
        onPageChange={setPage}
        emptyState={
          <EmptyState
            title="No payments found"
            description="Record a payment made to a supplier."
            actionLabel="Record Payment"
            onAction={() => setIsOpen(true)}
          />
        }
      />

      <Modal isOpen={isOpen} title="Record Payment to Supplier" onClose={() => setIsOpen(false)}>
        <PaymentForm
          onClose={() => setIsOpen(false)}
          onSubmit={(data) => createMutation.mutateAsync(data)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!voidingPayment}
        title="Void Payment"
        message={`Are you sure you want to void this payment of ${voidingPayment?.amount} ETB? This action cannot be undone and will reverse the supplier's balance.`}
        confirmLabel="Void Payment"
        cancelLabel="Cancel"
        onConfirm={() => voidMutation.mutateAsync({ id: voidingPayment._id, voidReason })}
        onCancel={() => { setVoidingPayment(null); setVoidReason(""); }}
        isDestructive
        isLoading={voidMutation.isPending}
      >
        <div className="mt-4">
          <label className="block text-sm font-medium text-secondary mb-1">Reason for voiding (required)</label>
          <input
            type="text"
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
            className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-danger focus:outline-none focus:ring-1 focus:ring-danger"
            placeholder="Entered by mistake, bounced check, etc."
            required
          />
        </div>
      </ConfirmDialog>
    </div>
  );
};

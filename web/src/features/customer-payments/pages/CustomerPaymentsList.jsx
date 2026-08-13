import React, { useMemo, useState, useEffect } from "react";
import { usePermission } from "../../../hooks/usePermission";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createCustomerPayment, getCustomerPayments, voidCustomerPayment } from "../api";
import { getCustomers } from "../../customers/api";
import { getOrders } from "../../orders/api";
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
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";

const paymentSchema = z.object({
  customer: z.string().min(1, "Customer is required"),
  order: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  paymentMethod: z.enum(["cash", "bank_transfer", "check", "other"]).default("cash"),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  paymentDate: z.string().min(1, "Payment date is required"),
});

const PaymentForm = ({ onSubmit, onClose }) => {
  const { can } = usePermission();
  const { data: customersData } = useQuery({ 
    queryKey: ["customers-list"], 
    queryFn: () => getCustomers({ limit: 1000 }),
    enabled: can("customers.read")
  });
  const customers = unwrapListResponse(customersData).items || [];
  
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      customer: "",
      order: "",
      amount: "",
      paymentMethod: "cash",
      referenceNumber: "",
      notes: "",
      paymentDate: new Date().toISOString().split("T")[0],
    },
  });

  const selectedCustomer = watch("customer");

  const { data: ordersData } = useQuery({ 
    queryKey: ["orders-by-customer", selectedCustomer], 
    queryFn: () => getOrders({ customer: selectedCustomer, limit: 100 }),
    enabled: !!selectedCustomer && can("orders.read")
  });
  const orders = unwrapListResponse(ordersData).items || [];

  return (
    <form className="space-y-4 p-6" onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Customer" required error={errors.customer?.message}>
        <Select
          {...register("customer")}
          placeholder="Select a customer"
          options={customers.map(c => ({ value: c._id, label: c.name }))}
          error={errors.customer?.message}
        />
      </FormField>

      <FormField label="Order (Optional)" error={errors.order?.message}>
        <Select
          {...register("order")}
          disabled={!selectedCustomer}
          placeholder="Apply to general balance"
          options={orders.map(o => ({ value: o._id, label: `${o.description} - ${o.agreedAmount} ETB` }))}
          error={errors.order?.message}
        />
        {!selectedCustomer && <p className="text-xs text-secondary mt-1">Select a customer first</p>}
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Amount (ETB)" required error={errors.amount?.message}>
          <Input type="number" step="0.01" {...register("amount")} error={errors.amount?.message} />
        </FormField>
        
        <FormField label="Payment Date" required error={errors.paymentDate?.message}>
          <Input type="date" {...register("paymentDate")} error={errors.paymentDate?.message} />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <FormField label="Reference Number" error={errors.referenceNumber?.message}>
          <Input {...register("referenceNumber")} placeholder="e.g. Check # or TXN ID" error={errors.referenceNumber?.message} />
        </FormField>
      </div>

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

export const CustomerPaymentsList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", customer: "", status: "", from: "", to: "" });
  const [isOpen, setIsOpen] = useState(false);
  const [voidingPayment, setVoidingPayment] = useState(null);
  const [voidReason, setVoidReason] = useState("");

  const { data: customersData } = useQuery({ 
    queryKey: ["customers-list"], 
    queryFn: () => getCustomers({ limit: 1000 }),
    enabled: can("customers.read")
  });
  const customers = unwrapListResponse(customersData).items || [];

  const params = useMemo(() => ({
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
    page,
    limit: 20
  }), [filters, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["customer-payments", params],
    queryFn: () => getCustomerPayments(params),
    placeholderData: keepPreviousData,
    enabled: can("customerPayments.read"),
  });
  const { items: payments, pagination } = unwrapListResponse(data);

  useEffect(() => {
    if (pagination && pagination.page < pagination.totalPages) {
      const nextParams = { ...params, page: page + 1 };
      queryClient.prefetchQuery({
        queryKey: ["customer-payments", nextParams],
        queryFn: () => getCustomerPayments(nextParams),
      });
    }
  }, [pagination, page, params, queryClient]);

  const createMutation = useMutation({
    mutationFn: createCustomerPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-payments"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] }); // Balance changed
      toast.success("Payment recorded successfully");
      setIsOpen(false);
    },
  });

  const voidMutation = useMutation({
    mutationFn: voidCustomerPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-payments"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] }); // Balance changed
      toast.success("Payment voided successfully");
      setVoidingPayment(null);
      setVoidReason("");
    },
  });

  const columns = [
    { header: "Receipt No", accessor: (row) => row.receiptNumber || "-", className: "font-mono font-medium text-xs hidden sm:table-cell" },
    { header: "Customer", accessor: (row) => row.customer?.name || "Unknown", className: "font-medium" },
    { header: "Date", accessor: (row) => formatDate(row.paymentDate), className: "text-secondary" },
    { header: "Amount", accessor: (row) => <MoneyDisplay amount={row.amount} className={row.status === 'voided' ? 'line-through opacity-50' : ''} /> },
    { header: "Method", accessor: (row) => <span className="capitalize">{row.paymentMethod?.replace('_', ' ') || "—"}</span>, className: "text-secondary hidden md:table-cell" },
    { 
      header: "Status", 
      accessor: (row) => <StatusBadge status={row.status} />
    },
    { 
      header: "Actions", 
      isActions: true,
      accessor: (row) => (
        <div className="flex justify-end gap-2">
          <Can permission="customerPayments.void">
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
        title="Customer Payments"
        description="Record and track payments received from customers."
        actions={
          <Can permission="customerPayments.create">
            <Button onClick={() => setIsOpen(true)}>Receive Payment</Button>
          </Can>
        }
      />

      <FilterBar 
        searchPlaceholder="Search by receipt or ref..."
        searchValue={filters.search}
        onSearchChange={(val) => { setFilters(p => ({ ...p, search: val })); setPage(1); }}
        onClear={Object.values(filters).some(Boolean) ? () => { setFilters({ search: "", customer: "", status: "", from: "", to: "" }); setPage(1); } : undefined}
      >
        <Select
          value={filters.customer}
          onChange={(e) => { setFilters(p => ({ ...p, customer: e.target.value })); setPage(1); }}
          options={[
            { value: "", label: "All Customers" },
            ...customers.map(c => ({ value: c._id, label: c.name }))
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
            description="Record a payment received from a customer."
            actionLabel={can("customerPayments.create") ? "Receive Payment" : null}
            onAction={can("customerPayments.create") ? () => setIsOpen(true) : undefined}
          />
        }
      />

      <Modal isOpen={isOpen} title="Receive Payment" onClose={() => setIsOpen(false)}>
        <PaymentForm
          onClose={() => setIsOpen(false)}
          onSubmit={(data) => createMutation.mutateAsync(data)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!voidingPayment}
        title="Void Payment"
        message={`Are you sure you want to void this payment of ${voidingPayment?.amount} ETB? This action cannot be undone and will reverse the customer's balance.`}
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
              placeholder="Entered by mistake, bounced check, etc."
              required
            />
          </FormField>
        </div>
      </ConfirmDialog>
    </div>
  );
};


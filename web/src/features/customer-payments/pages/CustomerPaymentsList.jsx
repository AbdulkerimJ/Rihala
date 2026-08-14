import React, { useMemo, useState } from "react";
import { usePermission } from "../../../hooks/usePermission";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
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
import { VoidReasonDialog } from "../../../components/ui/VoidReasonDialog";
import { FormRootError } from "../../../components/ui/FormRootError";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { applyServerErrors, cleanFilterParams, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";

const paymentSchema = z.object({
  customer: z.string().min(1, "Customer is required"),
  order: z.string().min(1, "Order is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
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
  
  const { register, handleSubmit, watch, setValue, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      customer: "",
      order: "",
      amount: "",
      notes: "",
      paymentDate: new Date().toISOString().split("T")[0],
    },
  });

  const selectedCustomer = watch("customer");
  const selectedOrderId = watch("order");

  // Automatically reset the order selection when the customer changes
  React.useEffect(() => {
    setValue("order", "");
  }, [selectedCustomer, setValue]);

  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({ 
    queryKey: ["orders-by-customer", selectedCustomer], 
    queryFn: () => getOrders({ customer: selectedCustomer, limit: 100 }),
    enabled: !!selectedCustomer && can("orders.read"),
  });
  
  const orders = useMemo(() => {
    const list = unwrapListResponse(ordersData).items || [];
    return list.filter((o) => o.status !== "cancelled");
  }, [ordersData]);

  const selectedOrder = useMemo(() => {
    return orders.find((o) => o._id === selectedOrderId);
  }, [orders, selectedOrderId]);

  const handleFormSubmit = async (data) => {
    try {
      const payload = {
        order: data.order,
        amount: data.amount,
        paymentDate: new Date(data.paymentDate).toISOString(),
        note: data.notes,
      };

      await onSubmit(payload);
    } catch (error) {
      applyServerErrors(setError, error);
    }
  };

  return (
    <form className="space-y-4 p-6" onSubmit={handleSubmit(handleFormSubmit)}>
      <FormRootError error={errors.root} />
      <FormField label="Customer" required error={errors.customer?.message}>
        <Select
          {...register("customer")}
          placeholder="Select a customer"
          options={customers.map(c => ({ value: c._id, label: c.name }))}
          error={errors.customer?.message}
        />
      </FormField>

      <FormField label="Order" required error={errors.order?.message}>
        <Select
          {...register("order")}
          disabled={!selectedCustomer || isLoadingOrders}
          placeholder={
            !selectedCustomer
              ? "Select a customer first"
              : isLoadingOrders
              ? "Loading customer orders..."
              : orders.length === 0
              ? "No active orders found for this customer"
              : "Select an order"
          }
          options={orders.map(o => ({
            value: o._id,
            label: `${o.orderNumber ? `[${o.orderNumber}] ` : ''}${o.description || (o.items?.[0]?.description) || 'Order'} - ${o.agreedAmount} ETB`,
          }))}
          error={errors.order?.message}
        />
        {!selectedCustomer ? (
          <p className="text-xs text-secondary mt-1">Select a customer first to see their orders.</p>
        ) : isLoadingOrders ? (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Loading customer orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">This customer has no active orders.</p>
        ) : null}
      </FormField>

      {selectedOrder && (
        <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-3.5 text-xs space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-secondary">Selected Order:</span>
            <span className="font-semibold text-primary">
              {selectedOrder.orderNumber ? `#${selectedOrder.orderNumber}` : "Order Details"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-secondary">Agreed Total:</span>
            <span className="font-bold text-teal-600 dark:text-teal-400">
              <MoneyDisplay amount={selectedOrder.agreedAmount} />
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-secondary">Order Stage:</span>
            <StatusBadge status={selectedOrder.status} showDot className="text-[10px] py-0 px-2" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Amount (ETB)" required error={errors.amount?.message}>
          <Input type="number" step="0.01" {...register("amount")} error={errors.amount?.message} />
        </FormField>
        
        <FormField label="Payment Date" required error={errors.paymentDate?.message}>
          <Input type="date" {...register("paymentDate")} error={errors.paymentDate?.message} />
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
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", customer: "", status: "", from: "", to: "" });
  const [isOpen, setIsOpen] = useState(false);
  const [voidingPayment, setVoidingPayment] = useState(null);

  const { data: customersData } = useQuery({ 
    queryKey: ["customers-list"], 
    queryFn: () => getCustomers({ limit: 1000 }),
    enabled: can("customers.read")
  });
  const customers = unwrapListResponse(customersData).items || [];

  const params = useMemo(() => cleanFilterParams(filters, { page, limit: 20 }), [filters, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["customer-payments", params],
    queryFn: () => getCustomerPayments(params),
    placeholderData: keepPreviousData,
    enabled: can("customerPayments.read"),
  });
  const { items: payments, pagination } = unwrapListResponse(data);

  usePrefetchNextPage({
    queryKey: ["customer-payments"],
    queryFn: getCustomerPayments,
    pagination,
    params,
    page,
  });

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
    },
  });

  const columns = [
    { header: "Order #", accessor: (row) => <span className="font-mono text-xs font-semibold text-primary">{row.orderNumber || (row.order?.orderNumber) || "-"}</span> },
    { header: "Customer", accessor: (row) => row.customerName || row.order?.customerName || row.order?.customer?.name || row.customer?.name || "Unknown", className: "font-medium" },
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

      <VoidReasonDialog
        isOpen={!!voidingPayment}
        title="Void Payment"
        message={`Are you sure you want to void this payment of ${voidingPayment?.amount} ETB? This action cannot be undone and will reverse the customer's balance.`}
        confirmLabel="Void Payment"
        isLoading={voidMutation.isPending}
        onConfirm={(reason) => voidMutation.mutateAsync({ id: voidingPayment._id, voidReason: reason })}
        onCancel={() => setVoidingPayment(null)}
      />
    </div>
  );
};


import { usePermission } from "../../../hooks/usePermission";
import React, { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Can } from "../../../components/Can";
import { createOrder, getOrders, updateOrder } from "../api";
import { getCustomers } from "../../customers/api";
import { getAllowedOrderTransitions, ORDER_STATUS_LABELS } from "../constants";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";

import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Modal } from "../../../components/ui/Modal";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { DataTable } from "../../../components/ui/DataTable";
import { FilterBar } from "../../../components/ui/FilterBar";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { Select } from "../../../components/ui/Select";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { formatDate } from "../../../utils/formatters";
import {
  getApiErrorMessage,
  unwrapListResponse,
} from "../../../utils/apiResponse";

const orderSchema = z.object({
  customer: z.string().min(1, "Customer is required"),
  description: z.string().min(1, "Description is required"),
  agreedAmount: z.coerce.number().nonnegative("Amount cannot be negative"),
  expectedCompletionDate: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
  status: z
    .enum(["pending", "in_progress", "ready", "completed", "cancelled"])
    .optional(),
});

const OrderForm = ({ initialData, customers, onSubmit, onClose }) => {
  const isEditing = !!initialData;
  const allowedStatuses = isEditing
    ? getAllowedOrderTransitions(initialData.status)
    : [];
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: initialData
      ? {
          customer: initialData.customer?._id || initialData.customer,
          description: initialData.description || "",
          agreedAmount: initialData.agreedAmount || "",
          expectedCompletionDate: initialData.expectedCompletionDate
            ? String(initialData.expectedCompletionDate).slice(0, 10)
            : "",
          notes: initialData.notes || "",
          status: initialData.status || "pending",
        }
      : {
          customer: "",
          description: "",
          agreedAmount: "",
          expectedCompletionDate: "",
          notes: "",
        },
  });

  return (
    <form className="space-y-4 p-6" onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Customer" required error={errors.customer?.message}>
        <Select
          {...register("customer")}
          placeholder="Select customer"
          error={errors.customer?.message}
          options={customers.map((c) => ({ value: c._id, label: c.name }))}
        />
      </FormField>

      <FormField label="Description" required error={errors.description?.message}>
        <Textarea
          placeholder="Describe the agreed furniture/design"
          {...register("description")}
          rows={3}
          error={errors.description?.message}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Agreed Amount (ETB)" required error={errors.agreedAmount?.message}>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("agreedAmount")}
            error={errors.agreedAmount?.message}
          />
        </FormField>

        <FormField label="Expected Completion Date" required error={errors.expectedCompletionDate?.message}>
          <Input
            type="date"
            {...register("expectedCompletionDate")}
            error={errors.expectedCompletionDate?.message}
          />
        </FormField>
      </div>

      <FormField label="Notes" error={errors.notes?.message}>
        <Textarea
          placeholder="Optional notes"
          {...register("notes")}
          rows={2}
          error={errors.notes?.message}
        />
      </FormField>

      {isEditing && (
        <FormField label="Status" error={errors.status?.message}>
          <Select
            {...register("status")}
            error={errors.status?.message}
            options={[
              { value: initialData.status, label: ORDER_STATUS_LABELS[initialData.status] },
              ...allowedStatuses.map((status) => ({
                value: status,
                label: ORDER_STATUS_LABELS[status],
              })),
            ]}
          />
        </FormField>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Save Order
        </Button>
      </div>
    </form>
  );
};

export const OrdersList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    customer: "",
    from: "",
    to: "",
    sort: "-expectedCompletionDate",
  });
  const [isOpen, setIsOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  const params = useMemo(() => ({
    ...Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value),
    ),
    page,
    limit: 20,
  }), [filters, page]);

  const ordersQuery = useQuery({
    queryKey: ["orders", params],
    queryFn: () => getOrders(params),
    placeholderData: keepPreviousData,
  });

  const customersQuery = useQuery({
    queryKey: ["customers-for-orders"],
    queryFn: () => getCustomers({ page: 1, limit: 200 }),
    enabled: can("customers.read")
  });

  const { items: orders, pagination } = unwrapListResponse(ordersQuery.data);
  const customers = unwrapListResponse(customersQuery.data).items || [];

  useEffect(() => {
    if (pagination && pagination.page < pagination.totalPages) {
      const nextParams = { ...params, page: page + 1 };
      queryClient.prefetchQuery({
        queryKey: ["orders", nextParams],
        queryFn: () => getOrders(nextParams),
      });
    }
  }, [pagination, page, params, queryClient]);

  const createMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order created successfully");
      setIsOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order updated successfully");
      setIsOpen(false);
    },
  });

  const handleClearFilters = () => {
    setFilters({
      search: "",
      status: "",
      customer: "",
      from: "",
      to: "",
      sort: "-expectedCompletionDate",
    });
    setPage(1);
  };

  const columns = [
    { header: "Customer", accessor: (row) => row.customer?.name || "-", className: "font-medium" },
    { header: "Description", accessor: (row) => <div className="max-w-[200px] truncate">{row.description}</div>, className: "text-secondary hidden sm:table-cell" },
    { header: "Amount", accessor: (row) => <MoneyDisplay amount={row.agreedAmount} /> },
    { header: "Expected", accessor: (row) => formatDate(row.expectedCompletionDate), className: "text-secondary hidden md:table-cell" },
    { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> },
    { 
      header: "Actions", 
      isActions: true,
      accessor: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/orders/${row._id}`);
            }}
          >
            View
          </Button>
          <Can permission="orders.update">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setEditingOrder(row);
                setIsOpen(true);
              }}
            >
              Edit
            </Button>
          </Can>
        </div>
      ) 
    }
  ];

  if (ordersQuery.isError)
    return (
      <ErrorState
        description={getApiErrorMessage(
          ordersQuery.error,
          "Failed to load orders.",
        )}
      />
    );

  const hasActiveFilters = Object.values(filters).some(val => val !== "" && val !== "-expectedCompletionDate");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Track agreed furniture orders and progress through the workshop."
        actions={
          <Can permission="orders.create">
            <Button
              onClick={() => {
                setEditingOrder(null);
                setIsOpen(true);
              }}
            >
              New Order
            </Button>
          </Can>
        }
      />

      <FilterBar
        searchPlaceholder="Search description..."
        searchValue={filters.search}
        onSearchChange={(val) => { setFilters(p => ({ ...p, search: val })); setPage(1); }}
        onClear={hasActiveFilters ? handleClearFilters : undefined}
      >
        <Select
          value={filters.status}
          onChange={(e) => { setFilters((p) => ({ ...p, status: e.target.value })); setPage(1); }}
          placeholder="All statuses"
          options={Object.entries(ORDER_STATUS_LABELS).map(([val, label]) => ({ value: val, label }))}
        />

        <Select
          value={filters.customer}
          onChange={(e) => { setFilters((p) => ({ ...p, customer: e.target.value })); setPage(1); }}
          placeholder="All customers"
          options={customers.map((c) => ({ value: c._id, label: c.name }))}
        />

        <Select
          value={filters.sort}
          onChange={(e) => { setFilters((p) => ({ ...p, sort: e.target.value })); setPage(1); }}
          options={[
            { value: "-expectedCompletionDate", label: "Expected completion (Newest)" },
            { value: "expectedCompletionDate", label: "Expected completion (Oldest)" },
            { value: "-createdAt", label: "Created (Newest)" },
            { value: "createdAt", label: "Created (Oldest)" },
            { value: "-agreedAmount", label: "Amount (High to Low)" },
            { value: "agreedAmount", label: "Amount (Low to High)" },
          ]}
        />
      </FilterBar>

      <DataTable 
        columns={columns}
        data={orders}
        keyExtractor={(row) => row._id}
        onRowClick={(row) => navigate(`/orders/${row._id}`)}
        pagination={{ ...pagination, page }}
        onPageChange={setPage}
        isLoading={ordersQuery.isLoading}
        isFetching={ordersQuery.isFetching}
        emptyState={
          <EmptyState
            title="No orders found"
            description="Create the first order for a customer."
            actionLabel={can("orders.create") ? "New Order" : null}
            onAction={can("orders.create") ? () => {  setEditingOrder(null); setIsOpen(true); } : undefined}
          />
        }
      />

      <Modal
        isOpen={isOpen}
        title={editingOrder ? "Edit Order" : "New Order"}
        onClose={() => setIsOpen(false)}
      >
        <OrderForm
          initialData={editingOrder}
          customers={customers}
          onClose={() => setIsOpen(false)}
          onSubmit={(data) =>
            editingOrder
              ? updateMutation.mutateAsync({ id: editingOrder._id, data })
              : createMutation.mutateAsync(data)
          }
        />
      </Modal>
    </div>
  );
};

import React, { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
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
        <select
          {...register("customer")}
          className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">Select customer</option>
          {customers.map((customer) => (
            <option key={customer._id} value={customer._id}>
              {customer.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Description" required error={errors.description?.message}>
        <textarea
          placeholder="Describe the agreed furniture/design"
          {...register("description")}
          rows={3}
          className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Agreed Amount (ETB)" required error={errors.agreedAmount?.message}>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("agreedAmount")}
            className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </FormField>

        <FormField label="Expected Completion Date" required error={errors.expectedCompletionDate?.message}>
          <input
            type="date"
            {...register("expectedCompletionDate")}
            className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </FormField>
      </div>

      <FormField label="Notes" error={errors.notes?.message}>
        <textarea
          placeholder="Optional notes"
          {...register("notes")}
          rows={2}
          className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </FormField>

      {isEditing && (
        <FormField label="Status" error={errors.status?.message}>
          <select
            {...register("status")}
            className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value={initialData.status}>
              {ORDER_STATUS_LABELS[initialData.status]}
            </option>
            {allowedStatuses.map((status) => (
              <option key={status} value={status}>
                {ORDER_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </FormField>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Order"}
        </Button>
      </div>
    </form>
  );
};

export const OrdersList = () => {
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
  });

  const { items: orders, pagination } = unwrapListResponse(ordersQuery.data);
  const customers = unwrapListResponse(customersQuery.data).items;

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
        <select
          value={filters.status}
          onChange={(e) => { setFilters((p) => ({ ...p, status: e.target.value })); setPage(1); }}
          className="rounded-md border border-border bg-main px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">All statuses</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={filters.customer}
          onChange={(e) => { setFilters((p) => ({ ...p, customer: e.target.value })); setPage(1); }}
          className="rounded-md border border-border bg-main px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">All customers</option>
          {customers.map((customer) => (
            <option key={customer._id} value={customer._id}>
              {customer.name}
            </option>
          ))}
        </select>

        <select
          value={filters.sort}
          onChange={(e) => { setFilters((p) => ({ ...p, sort: e.target.value })); setPage(1); }}
          className="rounded-md border border-border bg-main px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="-expectedCompletionDate">Expected completion (Newest)</option>
          <option value="expectedCompletionDate">Expected completion (Oldest)</option>
          <option value="-createdAt">Created (Newest)</option>
          <option value="createdAt">Created (Oldest)</option>
          <option value="-agreedAmount">Amount (High to Low)</option>
          <option value="agreedAmount">Amount (Low to High)</option>
        </select>
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
            actionLabel="New Order"
            onAction={() => { setEditingOrder(null); setIsOpen(true); }}
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

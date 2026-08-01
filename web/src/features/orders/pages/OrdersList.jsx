import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Can } from "../../../components/Can";
import { createOrder, getOrders, updateOrder } from "../api";
import { getCustomers } from "../../customers/api";
import { getAllowedOrderTransitions, ORDER_STATUS_LABELS } from "../constants";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Modal } from "../../../components/ui/Modal";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import {
  getApiErrorMessage,
  unwrapListResponse,
} from "../../../utils/apiResponse";

const orderSchema = z.object({
  customer: z.string().min(1),
  description: z.string().min(1),
  agreedAmount: z.coerce.number().nonnegative(),
  expectedCompletionDate: z.string().min(1),
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
      <select
        {...register("customer")}
        className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary"
      >
        <option value="">Select customer</option>
        {customers.map((customer) => (
          <option key={customer._id} value={customer._id}>
            {customer.name}
          </option>
        ))}
      </select>
      <textarea
        placeholder="Describe the agreed furniture/design"
        {...register("description")}
        className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary"
      />
      <input
        type="number"
        step="0.01"
        placeholder="Agreed amount"
        {...register("agreedAmount")}
        className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary"
      />
      <input
        type="date"
        {...register("expectedCompletionDate")}
        className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary"
      />
      <textarea
        placeholder="Optional notes"
        {...register("notes")}
        className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary"
      />
      {isEditing && (
        <select
          {...register("status")}
          className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary"
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
      )}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
};

export const OrdersList = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    customer: "",
    createdBy: "",
    from: "",
    to: "",
    sort: "-expectedCompletionDate",
  });
  const [isOpen, setIsOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const ordersQuery = useQuery({
    queryKey: ["orders", filters, page],
    queryFn: () =>
      getOrders({
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value),
        ),
        page,
        limit: 20,
      }),
  });
  const customersQuery = useQuery({
    queryKey: ["customers-for-orders"],
    queryFn: () => getCustomers({ page: 1, limit: 200 }),
  });
  const { items: orders, pagination } = unwrapListResponse(ordersQuery.data);
  const customers = unwrapListResponse(customersQuery.data).items;

  const createMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order created successfully");
      setIsOpen(false);
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Failed to create order")),
  });
  const updateMutation = useMutation({
    mutationFn: updateOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order updated successfully");
      setIsOpen(false);
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Failed to update order")),
  });

  if (ordersQuery.isLoading || customersQuery.isLoading)
    return <LoadingSkeleton variant="default" rowCount={6} showSearch />;
  if (ordersQuery.isError)
    return (
      <ErrorState
        description={getApiErrorMessage(
          ordersQuery.error,
          "Failed to load orders.",
        )}
      />
    );

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
      <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 xl:grid-cols-6">
        <input
          placeholder="Search description"
          value={filters.search}
          onChange={(e) =>
            setFilters((p) => ({ ...p, search: e.target.value }))
          }
          className="rounded-md border border-border bg-main px-3 py-2 text-primary"
        />
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((p) => ({ ...p, status: e.target.value }))
          }
          className="rounded-md border border-border bg-main px-3 py-2 text-primary"
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
          onChange={(e) =>
            setFilters((p) => ({ ...p, customer: e.target.value }))
          }
          className="rounded-md border border-border bg-main px-3 py-2 text-primary"
        >
          <option value="">All customers</option>
          {customers.map((customer) => (
            <option key={customer._id} value={customer._id}>
              {customer.name}
            </option>
          ))}
        </select>
        <input
          placeholder="Created by user id"
          value={filters.createdBy}
          onChange={(e) =>
            setFilters((p) => ({ ...p, createdBy: e.target.value }))
          }
          className="rounded-md border border-border bg-main px-3 py-2 text-primary"
        />
        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
          className="rounded-md border border-border bg-main px-3 py-2 text-primary"
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
          className="rounded-md border border-border bg-main px-3 py-2 text-primary"
        />
        <select
          value={filters.sort}
          onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value }))}
          className="rounded-md border border-border bg-main px-3 py-2 text-primary"
        >
          <option value="-expectedCompletionDate">
            Expected completion newest
          </option>
          <option value="expectedCompletionDate">
            Expected completion oldest
          </option>
          <option value="createdAt">Created oldest</option>
          <option value="-createdAt">Created newest</option>
          <option value="agreedAmount">Amount ascending</option>
          <option value="-agreedAmount">Amount descending</option>
        </select>
      </div>
      {orders.length === 0 ? (
        <EmptyState
          title="No orders found"
          description="Create the first order for a customer."
          actionLabel="New Order"
          onAction={() => setIsOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-main">
              <tr>
                <th className="px-6 py-3 text-left text-xs uppercase text-secondary">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs uppercase text-secondary">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs uppercase text-secondary">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs uppercase text-secondary">
                  Expected completion
                </th>
                <th className="px-6 py-3 text-left text-xs uppercase text-secondary">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs uppercase text-secondary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => (
                <tr key={order._id}>
                  <td className="px-6 py-4 text-sm text-primary">
                    {order.customer?.name || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {order.description}
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {formatCurrency(order.agreedAmount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {formatDate(order.expectedCompletionDate)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/orders/${order._id}`}
                        className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-primary hover:bg-main"
                      >
                        View
                      </Link>
                      <Can permission="orders.update">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditingOrder(order);
                            setIsOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </Can>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
      {pagination && (
        <div className="flex items-center justify-between text-sm text-secondary">
          <div>
            Page {pagination.page} of {pagination.totalPages || 1}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setPage((value) =>
                  pagination.totalPages
                    ? Math.min(pagination.totalPages, value + 1)
                    : value + 1,
                )
              }
              disabled={
                pagination.totalPages ? page >= pagination.totalPages : false
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

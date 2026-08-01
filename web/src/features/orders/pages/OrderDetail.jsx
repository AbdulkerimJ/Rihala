import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getOrderById, updateOrder } from "../api";
import { getCustomers } from "../../customers/api";
import { getAllowedOrderTransitions, ORDER_STATUS_LABELS } from "../constants";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from "../../../utils/formatters";
import {
  getApiErrorMessage,
  unwrapEntityResponse,
} from "../../../utils/apiResponse";
import { Can } from "../../../components/Can";

export const OrderDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const orderQuery = useQuery({
    queryKey: ["orders", id],
    queryFn: () => getOrderById(id),
    enabled: !!id,
  });
  const customersQuery = useQuery({
    queryKey: ["customers-for-orders"],
    queryFn: () => getCustomers({ page: 1, limit: 200 }),
  });
  const order = unwrapEntityResponse(orderQuery.data);
  const customers = Array.isArray(customersQuery.data?.data)
    ? customersQuery.data.data
    : customersQuery.data?.data?.data || [];

  const updateMutation = useMutation({
    mutationFn: updateOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order updated successfully");
      setIsOpen(false);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Failed to update order")),
  });

  if (orderQuery.isLoading || customersQuery.isLoading)
    return <LoadingSkeleton variant="default" rowCount={4} />;
  if (orderQuery.isError || !order)
    return (
      <ErrorState
        description={getApiErrorMessage(
          orderQuery.error,
          "Failed to load order details.",
        )}
      />
    );

  const allowedTransitions = getAllowedOrderTransitions(order.status);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Order details</h1>
          <p className="mt-1 text-sm text-secondary">
            What is being made, for whom, and what stage it is in.
          </p>
        </div>
        <Link
          to="/orders"
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-primary hover:bg-main"
        >
          Back to orders
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="text-sm text-secondary">Customer</div>
          <div className="mt-2 text-lg text-primary">
            {order.customer?.name || "-"}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="text-sm text-secondary">Status</div>
          <div className="mt-2">
            <StatusBadge status={order.status} />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="text-sm text-secondary">Agreed amount</div>
          <div className="mt-2 text-lg text-primary">
            {formatCurrency(order.agreedAmount)}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="text-sm text-secondary">Expected completion</div>
          <div className="mt-2 text-lg text-primary">
            {formatDate(order.expectedCompletionDate)}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 lg:col-span-2">
          <div className="text-sm text-secondary">Description</div>
          <div className="mt-2 text-primary">{order.description}</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 lg:col-span-2">
          <div className="text-sm text-secondary">Notes</div>
          <div className="mt-2 text-primary">{order.notes || "-"}</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="text-sm text-secondary">Created by</div>
          <div className="mt-2 text-primary">
            {order.createdBy?.name || "-"}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="text-sm text-secondary">Created / Updated</div>
          <div className="mt-2 text-primary">
            {formatDateTime(order.createdAt)} /{" "}
            {formatDateTime(order.updatedAt)}
          </div>
        </div>
      </div>

      {allowedTransitions.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="text-sm font-medium text-primary">Change status</div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Can permission="orders.update">
              {allowedTransitions.map((status) => (
                <Button
                  key={status}
                  variant="secondary"
                  onClick={() =>
                    updateMutation.mutate({ id: order._id, data: { status } })
                  }
                >
                  {ORDER_STATUS_LABELS[status]}
                </Button>
              ))}
            </Can>
          </div>
        </div>
      )}

      <Modal
        isOpen={isOpen}
        title="Update order"
        onClose={() => setIsOpen(false)}
      >
        <div className="p-6 text-sm text-secondary">
          Use the order list edit action to update order fields.
        </div>
      </Modal>
    </div>
  );
};

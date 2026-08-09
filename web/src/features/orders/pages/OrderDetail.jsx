import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrderById, updateOrder } from "../api";
import { getAllowedOrderTransitions, ORDER_STATUS_LABELS } from "../constants";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Button } from "../../../components/ui/Button";
import { SummaryCard } from "../../../components/ui/SummaryCard";
import { DetailSection, DetailItem } from "../../../components/ui/DetailSection";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import toast from "react-hot-toast";
import { formatDate, formatDateTime } from "../../../utils/formatters";
import { getApiErrorMessage, unwrapEntityResponse } from "../../../utils/apiResponse";
import { Can } from "../../../components/Can";
import { User, ClipboardList, Wallet, Calendar, FileText } from "lucide-react";

export const OrderDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const orderQuery = useQuery({
    queryKey: ["orders", id],
    queryFn: () => getOrderById(id),
    enabled: !!id,
  });

  const order = unwrapEntityResponse(orderQuery.data);

  const updateMutation = useMutation({
    mutationFn: updateOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order updated successfully");
    },
  });

  if (orderQuery.isLoading)
    return <LoadingSkeleton variant="default" rowCount={4} />;
  if (orderQuery.isError || !order)
    return (
      <ErrorState
        description={getApiErrorMessage(
          orderQuery.error,
          "Failed to load order details."
        )}
      />
    );

  const allowedTransitions = getAllowedOrderTransitions(order.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-primary font-display tracking-tight">Order Details</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-sm text-secondary">
            Tracking order information and current stage.
          </p>
        </div>
        <Link
          to="/orders"
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-primary hover:bg-main transition-colors"
        >
          Back to orders
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
          title="Customer" 
          value={order.customer?.name || "Unknown"} 
          icon={User}
        />
        <SummaryCard 
          title="Agreed Amount" 
          value={<MoneyDisplay amount={order.agreedAmount} variant="accent" />} 
          icon={Wallet}
        />
        <SummaryCard 
          title="Expected Completion" 
          value={formatDate(order.expectedCompletionDate)} 
          icon={Calendar}
        />
        <SummaryCard 
          title="Status" 
          value={ORDER_STATUS_LABELS[order.status]} 
          icon={ClipboardList}
          valueClassName="text-primary capitalize"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <DetailSection title="Order Information">
            <div className="mb-6">
              <span className="text-sm font-medium text-secondary block mb-2">Description</span>
              <p className="text-primary bg-main/50 p-4 rounded-lg">{order.description}</p>
            </div>
            
            <div>
              <span className="text-sm font-medium text-secondary block mb-2">Notes</span>
              <p className="text-primary bg-main/50 p-4 rounded-lg">{order.notes || "No additional notes provided."}</p>
            </div>
          </DetailSection>
          
          {allowedTransitions.length > 0 && (
            <DetailSection title="Update Status">
              <p className="text-sm text-secondary mb-4">
                Move this order to the next stage of production.
              </p>
              <div className="flex flex-wrap gap-3">
                <Can permission="orders.update">
                  {allowedTransitions.map((status) => (
                    <Button
                      key={status}
                      variant="primary"
                      onClick={() =>
                        updateMutation.mutate({ id: order._id, data: { status } })
                      }
                      disabled={updateMutation.isPending}
                    >
                      Mark as {ORDER_STATUS_LABELS[status]}
                    </Button>
                  ))}
                </Can>
              </div>
            </DetailSection>
          )}
        </div>

        <div className="space-y-6">
          <DetailSection title="System Information">
            <div className="space-y-1">
              <DetailItem label="Order ID" value={<span className="font-mono text-xs">{order._id}</span>} />
              <DetailItem label="Created By" value={order.createdBy?.name || "Unknown User"} />
              <DetailItem label="Created On" value={formatDateTime(order.createdAt)} />
              <DetailItem label="Last Updated" value={formatDateTime(order.updatedAt)} />
            </div>
          </DetailSection>
        </div>
      </div>
    </div>
  );
};

import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { getOrderById, updateOrder } from "../api";
import {
  getCustomerPayments,
  createCustomerPayment,
  voidCustomerPayment,
} from "../../customer-payments/api";
import { getCustomers } from "../../customers/api";
import { usePermission } from "../../../hooks/usePermission";

import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { DetailSection } from "../../../components/ui/DetailSection";
import { SystemInfoSection } from "../../../components/ui/SystemInfoSection";
import { Modal } from "../../../components/ui/Modal";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { VoidReasonDialog } from "../../../components/ui/VoidReasonDialog";

import { OrderForm } from "../components/OrderForm";
import { OrderDetailHeader } from "../components/OrderDetailHeader";
import { OrderSummaryCards } from "../components/OrderSummaryCards";
import { OrderStatusPipeline } from "../components/OrderStatusPipeline";
import { OrderPaymentsSection } from "../components/OrderPaymentsSection";
import { OrderCustomerCard } from "../components/OrderCustomerCard";
import { OrderStatusTimeline } from "../components/OrderStatusTimeline";
import { CustomerPaymentModal } from "../../customer-payments/components/CustomerPaymentModal";

import {
  getApiErrorMessage,
  unwrapEntityResponse,
  unwrapListResponse,
} from "../../../utils/apiResponse";

export const OrderDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { can } = usePermission();

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);

  // 1. Fetch Order (Layer 4 permission compliance)
  const orderQuery = useQuery({
    queryKey: ["orders", id],
    queryFn: () => getOrderById(id),
    enabled: can("orders.read") && !!id,
  });

  const order = unwrapEntityResponse(orderQuery.data);

  // 2. Fetch Customer Payments for this order (Layer 4 permission compliance)
  const paymentsQuery = useQuery({
    queryKey: ["customer-payments", { order: id }],
    queryFn: () => getCustomerPayments({ order: id, limit: 100 }),
    enabled: can("customerPayments.read") && !!id,
  });

  const payments = unwrapListResponse(paymentsQuery.data).items || [];

  // 3. Fetch Customers list for the Edit Modal
  const customersQuery = useQuery({
    queryKey: ["customers", "for-order-edit"],
    queryFn: () => getCustomers({ limit: 1000 }),
    enabled: can("customers.read") && isEditModalOpen,
  });

  const customers = unwrapListResponse(customersQuery.data).items || [];

  // 4. Mutations
  const updateMutation = useMutation({
    mutationFn: updateOrder,
    meta: { suppressToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order updated successfully");
      setEditModalOpen(false);
      setCancellingOrder(false);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update order"));
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: createCustomerPayment,
    meta: { suppressToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customer-payments", { order: id }],
      });
      queryClient.invalidateQueries({ queryKey: ["customer-payments"] });
      queryClient.invalidateQueries({ queryKey: ["orders", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Payment recorded successfully");
      setPaymentModalOpen(false);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to record payment"));
    },
  });

  // 5. Financial Calculations
  const activePayments = useMemo(
    () => payments.filter((p) => p.status !== "voided"),
    [payments]
  );
  const totalPaid = useMemo(
    () => activePayments.reduce((sum, p) => sum + (p.amount || 0), 0),
    [activePayments]
  );
  const agreedAmount = order?.agreedAmount || 0;
  const remainingBalance = Math.max(0, agreedAmount - totalPaid);
  const paymentProgress =
    agreedAmount > 0
      ? Math.min(100, Math.round((totalPaid / agreedAmount) * 100))
      : 0;
  const isFullyPaid = totalPaid >= agreedAmount && agreedAmount > 0;

  // 6. Delivery Schedule
  const daysUntilDue = useMemo(() => {
    if (!order?.expectedCompletionDate) return null;
    const diff =
      new Date(order.expectedCompletionDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [order?.expectedCompletionDate]);

  if (orderQuery.isLoading) return <DetailSkeleton />;
  if (orderQuery.isError || !order) {
    return (
      <ErrorState
        description={getApiErrorMessage(
          orderQuery.error,
          "Failed to load order details."
        )}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <OrderDetailHeader
        order={order}
        isFullyPaid={isFullyPaid}
        remainingBalance={remainingBalance}
        onOpenEditModal={() => setEditModalOpen(true)}
        onOpenPaymentModal={() => setPaymentModalOpen(true)}
      />

      {/* 2. Enhanced Colored Summary Cards */}
      <OrderSummaryCards
        order={order}
        totalPaid={totalPaid}
        remainingBalance={remainingBalance}
        paymentProgress={paymentProgress}
        isFullyPaid={isFullyPaid}
        daysUntilDue={daysUntilDue}
        canReadCustomers={can("customers.read")}
      />

      {/* 3. Visual Workflow Pipeline / Stepper */}
      <OrderStatusPipeline
        status={order.status}
        onStatusChange={(newStatus) =>
          updateMutation.mutate({
            id: order._id,
            data: { status: newStatus },
          })
        }
        onCancelClick={() => setCancellingOrder(true)}
        isPending={updateMutation.isPending}
      />

      {/* 4. Main Body: Order Information & Financials */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2 Cols): Description & Payments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Description & Notes */}
          <DetailSection title="Description & Notes">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-secondary uppercase tracking-wider block mb-1">
                  Description
                </span>
                <p className="text-sm text-primary leading-relaxed whitespace-pre-wrap">
                  {order.description || "No description provided."}
                </p>
              </div>

              {order.notes && (
                <div className="pt-3 border-t border-border/50">
                  <span className="text-xs font-semibold text-secondary uppercase tracking-wider block mb-1">
                    Notes
                  </span>
                  <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">
                    {order.notes}
                  </p>
                </div>
              )}
            </div>
          </DetailSection>

          {/* Customer Payments Log */}
          {can("customerPayments.read") && (
            <OrderPaymentsSection
              order={order}
              payments={payments}
              totalPaid={totalPaid}
              remainingBalance={remainingBalance}
              isLoading={paymentsQuery.isLoading}
              onOpenPaymentModal={() => setPaymentModalOpen(true)}
            />
          )}
        </div>

        {/* Right Column (1 Col): Customer Card, Timeline & System Info */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pb-6 custom-scrollbar">
          {/* Customer & Agreement Card */}
          <OrderCustomerCard
            order={order}
            canReadCustomers={can("customers.read")}
          />

          {/* Status Timeline History */}
          <OrderStatusTimeline
            statusHistory={order.statusHistory}
            createdBy={order.createdBy}
          />

          {/* System Info Section */}
          <SystemInfoSection
            id={order._id}
            idLabel="Order ID"
            createdAt={order.createdAt}
            updatedAt={order.updatedAt}
            extraItems={[
              { label: "Order Number", value: order.orderNumber || "-" },
              {
                label: "Created By",
                value: order.createdBy?.name || "Unknown User",
              },
            ]}
          />
        </div>
      </div>

      {/* 5. Modals & Dialogs */}
      {/* Edit Order Modal */}
      <Modal
        isOpen={isEditModalOpen}
        title="Edit Order Details"
        onClose={() => setEditModalOpen(false)}
      >
        <OrderForm
          initialData={order}
          customers={customers}
          onClose={() => setEditModalOpen(false)}
          onSubmit={(data) =>
            updateMutation.mutateAsync({ id: order._id, data })
          }
        />
      </Modal>

      {/* Direct Payment Modal */}
      <CustomerPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        preSelectedOrder={order}
        preSelectedCustomer={order?.customer}
        onSubmit={(data) => createPaymentMutation.mutateAsync(data)}
      />

      {/* Cancel Order Confirm Dialog */}
      <ConfirmDialog
        isOpen={cancellingOrder}
        title="Cancel Order"
        description="Are you sure you want to cancel this order? Cancelled orders cannot be re-opened. Any customer payments must be voided beforehand."
        confirmLabel="Cancel Order"
        variant="danger"
        isSubmitting={updateMutation.isPending}
        onConfirm={() =>
          updateMutation.mutate({
            id: order._id,
            data: { status: "cancelled" },
          })
        }
        onCancel={() => setCancellingOrder(false)}
      />

    </div>
  );
};

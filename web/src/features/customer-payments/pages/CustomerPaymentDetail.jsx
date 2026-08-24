import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, User, FileText, Ban } from "lucide-react";
import toast from "react-hot-toast";

import { getCustomerPaymentById, voidCustomerPayment } from "../api";
import { usePermission } from "../../../hooks/usePermission";

import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { DetailSection } from "../../../components/ui/DetailSection";
import { SystemInfoSection } from "../../../components/ui/SystemInfoSection";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { VoidReasonDialog } from "../../../components/ui/VoidReasonDialog";
import { getApiErrorMessage, unwrapEntityResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";

export const CustomerPaymentDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { can } = usePermission();

  const [voidingPayment, setVoidingPayment] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["customer-payment", id],
    queryFn: () => getCustomerPaymentById(id),
    enabled: !!id && can("customerPayments.read"),
  });

  const payment = unwrapEntityResponse(data);

  const voidMutation = useMutation({
    mutationFn: voidCustomerPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-payment", id] });
      queryClient.invalidateQueries({ queryKey: ["customer-payments"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] }); // Balance changed
      toast.success("Payment voided successfully");
      setVoidingPayment(false);
    },
  });

  if (isLoading) return <DetailSkeleton />;
  if (isError) return <ErrorState description={getApiErrorMessage(error, "Failed to load payment details.")} />;
  if (!payment) return <ErrorState description="Payment not found." />;

  const isVoided = payment.status === "voided";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-surface p-5 shadow-sm sm:flex sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 relative z-10">
          <Link
            to="/customer-payments"
            className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-border/60 bg-surface/50 text-secondary hover:text-primary hover:bg-main hover:shadow-sm transition-all shrink-0 backdrop-blur-sm"
            title="Back to payments"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-primary font-display tracking-tight flex items-center gap-2">
                Payment Details
              </h1>
              <StatusBadge status={payment.status} showDot className="text-xs px-3 py-1 font-semibold" />
            </div>
            <p className="text-sm text-secondary">
              Recorded on {formatDate(payment.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-0 relative z-10">
          <Can permission="customerPayments.void">
            {!isVoided && (
              <Button
                variant="danger"
                size="sm"
                leftIcon={Ban}
                onClick={() => setVoidingPayment(true)}
              >
                Void Payment
              </Button>
            )}
          </Can>
        </div>
      </div>

      {isVoided && payment.voidReason && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 flex gap-3">
          <Ban className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-danger">Payment Voided</h3>
            <p className="text-sm text-danger/90">{payment.voidReason}</p>
            {payment.voidedBy && (
              <p className="text-xs text-danger/70 pt-1">
                Voided by {payment.voidedBy.name} on {formatDate(payment.voidedAt)}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <DetailSection title="Financial Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-secondary uppercase tracking-wider block">
                  Amount
                </span>
                <span className="text-2xl font-bold">
                  <MoneyDisplay amount={payment.amount} className={isVoided ? "line-through opacity-50" : ""} />
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-secondary uppercase tracking-wider block">
                  Payment Date
                </span>
                <span className="text-lg font-medium text-primary">
                  {formatDate(payment.paymentDate)}
                </span>
              </div>
            </div>

            {payment.note && (
              <div className="pt-6 mt-6 border-t border-border/50">
                <span className="text-xs font-semibold text-secondary uppercase tracking-wider block mb-2">
                  Notes
                </span>
                <p className="text-sm text-primary leading-relaxed whitespace-pre-wrap">
                  {payment.note}
                </p>
              </div>
            )}
          </DetailSection>

          <DetailSection title="Reference">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-secondary uppercase tracking-wider block">
                  Customer
                </span>
                <div className="flex items-center gap-2 text-primary font-medium">
                  <User className="w-4 h-4 text-secondary" />
                  {payment.customerName || payment.order?.customerName || "Unknown"}
                </div>
              </div>
              
              <div className="space-y-1">
                <span className="text-xs font-semibold text-secondary uppercase tracking-wider block">
                  Order
                </span>
                {payment.order ? (
                  <Link 
                    to={`/orders/${payment.order._id || payment.order}`}
                    className="flex items-center gap-2 text-accent hover:text-accent-hover font-medium transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    {payment.orderNumber ? `#${payment.orderNumber}` : "View Order"}
                  </Link>
                ) : (
                  <span className="text-secondary">-</span>
                )}
              </div>
            </div>
          </DetailSection>
        </div>

        <div className="space-y-6">
          <SystemInfoSection
            createdAt={payment.createdAt}
            updatedAt={payment.updatedAt}
            extraItems={
              payment.createdBy
                ? [{ label: "Recorded By", value: payment.createdBy.name || "Unknown" }]
                : []
            }
          />
        </div>
      </div>

      <VoidReasonDialog
        isOpen={voidingPayment}
        title="Void Customer Payment"
        description={`Are you sure you want to void this payment of ${payment.amount} ETB? This action cannot be undone and will reverse the paid amount on the order.`}
        confirmLabel="Void Payment"
        isSubmitting={voidMutation.isPending}
        onConfirm={(reason) => voidMutation.mutateAsync({ id: payment._id, voidReason: reason })}
        onCancel={() => setVoidingPayment(false)}
      />
    </div>
  );
};

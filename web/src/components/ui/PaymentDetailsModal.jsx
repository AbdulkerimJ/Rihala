import React from "react";
import { Modal } from "./Modal";
import { StatusBadge } from "./StatusBadge";
import { MoneyDisplay } from "./MoneyDisplay";
import { AlertCircle, Calendar, User, UserX, FileText, Activity } from "lucide-react";
import { formatDate } from "../../utils/formatters";

export const PaymentDetailsModal = ({ isOpen, onClose, payment, title = "Payment Details", type = "customer" }) => {
  if (!payment) return null;

  const isVoided = payment.status === "voided";

  // Dynamic field extraction based on payment type
  const getEntityDetails = () => {
    switch (type) {
      case "customer":
        return {
          label: "Order",
          value: payment.orderNumber || payment.order?.orderNumber || "Unknown",
          subValue: payment.customerName || payment.order?.customer?.name || payment.customer?.name || "Unknown",
        };
      case "supplier":
        return {
          label: "Supplier",
          value: payment.supplier?.name || "Unknown",
          subValue: payment.type === "SPECIFIC" ? "Specific Purchase" : "General Payment",
        };
      case "contractor":
        return {
          label: "Contract",
          value: payment.contractNumber || payment.contract?.contractNumber || "Unknown",
          subValue: payment.contractorName || payment.contract?.contractor?.name || "Unknown",
        };
      case "employee":
        return {
          label: "Employee",
          value: payment.employeeName || payment.employee?.name || "Unknown",
          subValue: payment.type ? payment.type.charAt(0).toUpperCase() + payment.type.slice(1) : "Unknown Type",
        };
      default:
        return null;
    }
  };

  const entity = getEntityDetails();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6 p-5 sm:p-6">
        
        {/* Header section with Amount and Status */}
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div>
            <p className="text-sm text-secondary font-medium mb-1">Amount Paid</p>
            <div className={`text-2xl font-bold font-display ${isVoided ? "text-secondary line-through opacity-70" : "text-primary"}`}>
              <MoneyDisplay amount={payment.amount} />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={payment.status} />
            <span className="text-xs text-secondary flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(payment.paymentDate || payment.date)}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-secondary font-medium">Reference Number</p>
            <p className="text-sm text-primary font-medium">{payment.paymentReference || payment._id?.slice(-8).toUpperCase()}</p>
          </div>
          
          {entity && (
            <div className="space-y-1">
              <p className="text-xs text-secondary font-medium">{entity.label}</p>
              <p className="text-sm text-primary font-medium">{entity.value}</p>
              <p className="text-xs text-secondary">{entity.subValue}</p>
            </div>
          )}

          <div className="space-y-1">
            <p className="text-xs text-secondary font-medium">{payment.createdBy ? "Recorded By" : "Recorded On"}</p>
            {payment.createdBy && (
              <div className="flex items-center gap-1.5 text-sm text-primary font-medium">
                <User className="w-3.5 h-3.5 text-secondary" />
                {payment.createdBy?.name}
              </div>
            )}
            <p className="text-xs text-secondary">{formatDate(payment.createdAt)}</p>
          </div>
        </div>

        {/* Notes */}
        {payment.note && (
          <div className="bg-surface p-4 rounded-lg border border-border">
            <div className="flex items-center gap-1.5 mb-2">
              <FileText className="w-4 h-4 text-secondary" />
              <h4 className="text-sm font-medium text-primary">Notes</h4>
            </div>
            <p className="text-sm text-secondary whitespace-pre-wrap">{payment.note}</p>
          </div>
        )}

        {/* Void Details */}
        {isVoided && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-red-600 font-medium text-sm">
              <AlertCircle className="w-4 h-4" />
              <h4>Void Information</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-red-500 font-medium">Voided By</p>
                <div className="flex items-center gap-1.5 text-sm text-red-700">
                  <UserX className="w-3.5 h-3.5" />
                  {payment.voidedBy?.name}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-red-500 font-medium">Voided Date</p>
                <div className="flex items-center gap-1.5 text-sm text-red-700">
                  <Calendar className="w-3.5 h-3.5" />
                  {payment.voidedAt ? formatDate(payment.voidedAt) : "Unknown Date"}
                </div>
              </div>
            </div>
            {payment.voidReason && (
              <div className="pt-2 border-t border-red-200">
                <p className="text-xs text-red-500 font-medium mb-1">Reason</p>
                <p className="text-sm text-red-700">{payment.voidReason}</p>
              </div>
            )}
          </div>
        )}

      </div>
    </Modal>
  );
};

import React, { useState } from "react";
import { Plus, Receipt, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DetailSection } from "../../../components/ui/DetailSection";
import { ListGroup, ListItem } from "../../../components/ui/ListGroup";
import { Button } from "../../../components/ui/Button";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { Can } from "../../../components/Can";
import { PaymentDetailsModal } from "../../../components/ui/PaymentDetailsModal";
import { formatDate } from "../../../utils/formatters";

export const OrderPaymentsSection = ({
  order,
  payments = [],
  totalPaid,
  remainingBalance,
  isLoading = false,
  onOpenPaymentModal,
}) => {
  const navigate = useNavigate();
  const [selectedPayment, setSelectedPayment] = useState(null);
  const isCancelled = order?.status === "cancelled";

  return (
    <DetailSection title="Customer Payments History" className="relative">
      <div className="space-y-4">
        {/* Financial overview mini banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-surface border border-border/60 shadow-sm transition-all duration-300 hover:shadow-md group relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-finance-in/5 blur-2xl rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div>
            <span className="text-xs text-secondary block">Agreed Total</span>
            <span className="text-sm sm:text-base font-bold text-primary tabular-nums">
              <MoneyDisplay amount={order?.agreedAmount} />
            </span>
          </div>
          <div className="relative z-10">
            <span className="text-xs text-finance-in block font-medium">
              Paid to Date
            </span>
            <span className="text-sm sm:text-base font-bold text-finance-in tabular-nums">
              <MoneyDisplay amount={totalPaid} />
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1 relative z-10">
            <span className="text-xs text-secondary block">Remaining Due</span>
            <span
              className={`text-sm sm:text-base font-bold tabular-nums ${
                remainingBalance > 0
                  ? "text-warning"
                  : "text-success"
              }`}
            >
              <MoneyDisplay amount={remainingBalance} />
            </span>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-surface border border-dashed border-border/60 rounded-xl">
            <Receipt className="w-8 h-8 mx-auto mb-2 text-muted opacity-50" />
            <p className="text-secondary text-sm">No customer payments recorded for this order yet.</p>
            <Can permission="customerPayments.create">
              {remainingBalance > 0 && !isCancelled && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  leftIcon={Plus}
                  onClick={onOpenPaymentModal}
                >
                  Record Initial Payment
                </Button>
              )}
            </Can>
          </div>
        ) : (
          <ListGroup>
            {payments.map(payment => (
              <ListItem
                key={payment._id}
                title={formatDate(payment.paymentDate)}
                subtitle={payment.note || "No notes"}
                right={
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs sm:text-sm font-bold tracking-tight ${payment.status === 'voided' ? 'line-through opacity-50 text-secondary' : 'text-finance-in'}`}>
                      <MoneyDisplay amount={payment.amount} className="text-inherit font-bold" />
                    </span>
                    <StatusBadge status={payment.status} className="shrink-0" />
                  </div>
                }
                onClick={() => setSelectedPayment(payment)}
                isClickable
              />
            ))}
          </ListGroup>
        )}
      </div>

      <PaymentDetailsModal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        payment={selectedPayment}
        type="customer"
      />
    </DetailSection>
  );
};


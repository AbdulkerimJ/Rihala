import { Link } from "react-router-dom";
import { ChevronRight, Receipt } from "lucide-react";
import { formatDate } from "../../../utils/formatters";
import { Can } from "../../../components/Can";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { ListGroupSkeleton } from "../../../components/ui/ListGroup";

export const DashboardRecentPayments = ({ payments, loadingPayments }) => {
  return (
    <Can permission="customerPayments.read">
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5 shadow-xs space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div>
            <h3 className="text-base font-bold tracking-tight text-primary">
              Recent Receipts
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              Latest customer payments received
            </p>
          </div>

          <Link
            to="/payments?tab=customers"
            className="text-xs font-semibold text-accent hover:text-accent-hover inline-flex items-center gap-0.5"
          >
            View All <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* List */}
        {loadingPayments ? (
          <ListGroupSkeleton count={4} />
        ) : payments && payments.length > 0 ? (
          <div className="divide-y divide-border/40">
            {payments.map((payment) => {
              const customerName =
                payment.customerName ||
                payment.order?.customerName ||
                payment.order?.customer?.name ||
                payment.customer?.name ||
                (payment.orderNumber ? `Order #${payment.orderNumber}` : "Customer Receipt");

              return (
                <Link
                  key={payment._id}
                  to="/payments?tab=customers"
                  className="group flex items-center justify-between py-1.5 px-1 hover:bg-main/40 rounded-lg transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-primary truncate group-hover:text-accent transition-colors">
                      {customerName}
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {formatDate(payment.paymentDate)}
                      {payment.orderNumber && ` • Order #${payment.orderNumber}`}
                    </div>
                  </div>

                  <span className="text-sm font-bold text-finance-in tabular-nums shrink-0 ml-3">
                    +<MoneyDisplay amount={payment.amount} />
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center rounded-lg border border-dashed border-border/70 bg-surface/50">
            <Receipt className="w-6 h-6 mx-auto text-muted mb-1.5" />
            <p className="text-xs text-secondary font-medium">
              No customer receipts recorded yet.
            </p>
          </div>
        )}
      </div>
    </Can>
  );
};

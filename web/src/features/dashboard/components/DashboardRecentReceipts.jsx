import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { formatDate } from "../../../utils/formatters";
import { Can } from "../../../components/Can";
import { ListGroup, ListItem, ListGroupSkeleton } from "../../../components/ui/ListGroup";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";

export const DashboardRecentReceipts = ({
  recentPayments,
  loadingPayments,
}) => {
  return (
    <Can permission="customerPayments.read">
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-base font-bold tracking-tight text-primary">
              Recent Receipts
            </h3>
            <p className="text-xs text-secondary font-medium">
              Latest incoming payments
            </p>
          </div>
          <Link
            to="/customer-payments"
            className="text-xs font-semibold text-accent hover:text-accent-hover flex items-center gap-0.5"
          >
            View All <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loadingPayments ? (
          <ListGroupSkeleton count={3} />
        ) : recentPayments.length > 0 ? (
          <ListGroup>
            {recentPayments.map((payment) => {
              const customerName =
                payment.customerName ||
                payment.order?.customerName ||
                payment.order?.customer?.name ||
                payment.customer?.name ||
                (payment.orderNumber ? `Order #${payment.orderNumber}` : null) ||
                (payment.paymentNumber ? `Receipt #${payment.paymentNumber}` : "Customer Receipt");

              return (
                <ListItem
                  key={payment._id}
                  to="/customer-payments"
                  size="sm"
                  showChevron={true}
                  title={customerName}
                  subtitle={formatDate(payment.paymentDate)}
                  right={
                    <span className="text-xs font-bold text-finance-in block">
                      +<MoneyDisplay amount={payment.amount} className="text-finance-in font-bold" />
                    </span>
                  }
                />
              );
            })}
          </ListGroup>
        ) : (
          <div className="p-6 text-center rounded-xl border border-dashed border-border/80 bg-surface/50">
            <p className="text-xs font-medium text-secondary">
              No customer payments recorded yet.
            </p>
          </div>
        )}
      </div>
    </Can>
  );
};

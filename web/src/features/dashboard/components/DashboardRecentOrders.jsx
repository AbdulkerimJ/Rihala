import { Link } from "react-router-dom";
import { ChevronRight, Package } from "lucide-react";
import { formatDate } from "../../../utils/formatters";
import { Can } from "../../../components/Can";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { ListGroupSkeleton } from "../../../components/ui/ListGroup";

export const DashboardRecentOrders = ({ orders, loadingOrders }) => {
  return (
    <Can permission="orders.read">
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5 shadow-xs space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div>
            <h3 className="text-base font-bold tracking-tight text-primary">
              Recent Orders
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              Latest client commissions and workshop jobs
            </p>
          </div>

          <Link
            to="/orders"
            className="text-xs font-semibold text-accent hover:text-accent-hover inline-flex items-center gap-0.5"
          >
            View All <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* List */}
        {loadingOrders ? (
          <ListGroupSkeleton count={5} />
        ) : orders && orders.length > 0 ? (
          <div className="divide-y divide-border/40">
            {orders.map((order) => {
              const customerName =
                order.customer?.name ||
                order.customerName ||
                "Customer";

              return (
                <Link
                  key={order._id}
                  to={`/orders/${order._id}`}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 py-1.5 px-1 hover:bg-main/40 rounded-lg transition-colors"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-main border border-border text-secondary shrink-0 uppercase mt-0.5">
                      {order.orderNumber}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-primary truncate group-hover:text-accent transition-colors">
                        {order.description}
                      </div>
                      <div className="text-xs text-muted truncate mt-0.5">
                        {customerName} • Due {formatDate(order.expectedCompletionDate)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 self-end sm:self-center">
                    <StatusBadge status={order.status} />
                    <span className="text-sm font-bold text-primary tabular-nums">
                      <MoneyDisplay amount={order.agreedAmount} />
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors hidden sm:block" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center rounded-lg border border-dashed border-border/80 bg-surface/50">
            <Package className="h-8 w-8 mx-auto text-muted mb-2" />
            <p className="text-sm font-medium text-secondary">
              No recent orders found.
            </p>
          </div>
        )}
      </div>
    </Can>
  );
};

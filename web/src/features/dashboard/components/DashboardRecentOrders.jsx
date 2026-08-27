import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Package } from "lucide-react";
import { Can } from "../../../components/Can";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { ListGroup, ListItem, ListGroupSkeleton } from "../../../components/ui/ListGroup";
import { formatDate } from "../../../utils/formatters";

export const DashboardRecentOrders = ({ orders, loadingOrders }) => {
  return (
    <Can permission="orders.read">
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-primary">
              Recent Orders
            </h3>
            <p className="text-xs text-secondary font-medium">
              Latest client commissions & workshop jobs
            </p>
          </div>
          <Link
            to="/orders"
            className="text-xs font-semibold text-accent hover:text-accent-hover flex items-center gap-1"
          >
            View All <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loadingOrders ? (
          <ListGroupSkeleton count={4} />
        ) : orders.length > 0 ? (
          <ListGroup>
            {orders.map((order) => {
              const customerName =
                order.customer?.name ||
                order.customerName ||
                "Customer";

              return (
                <ListItem
                  key={order._id}
                  to={`/orders/${order._id}`}
                  size="sm"
                  title={
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[10px] font-bold text-secondary uppercase tracking-widest shrink-0">
                        {order.orderNumber}
                      </span>
                      <span className="truncate">{order.description}</span>
                    </span>
                  }
                  subtitle={`${customerName} • Due ${formatDate(order.expectedCompletionDate)}`}
                  right={
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <StatusBadge status={order.status} className="shrink-0" />
                      <span className="text-xs sm:text-sm font-bold text-primary tracking-tight shrink-0">
                        <MoneyDisplay amount={order.agreedAmount} />
                      </span>
                    </div>
                  }
                />
              );
            })}
          </ListGroup>
        ) : (
          <div className="p-8 text-center rounded-xl border border-dashed border-border/80 bg-surface/50">
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

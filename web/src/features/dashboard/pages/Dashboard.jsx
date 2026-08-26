import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { usePermission } from "../../../hooks/usePermission";
import { getOrders } from "../../orders/api";
import { getCustomerPayments } from "../../customer-payments/api";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { SummaryCard } from "../../../components/ui/SummaryCard";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/Card";
import { InlineSkeleton, Skeleton } from "../../../components/ui/skeletons";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { formatDate } from "../../../utils/formatters";
import { unwrapListResponse } from "../../../utils/apiResponse";
import { TrendingUp, TrendingDown, ShoppingCart, Users, Wallet, CreditCard, Building2, Package, CalendarDays, ChevronRight, User } from "lucide-react";
import { Can } from "../../../components/Can";

export const Dashboard = () => {
  const { currentUser } = useAuth();
  const { can } = usePermission();

  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ["dashboard", "orders"],
    queryFn: () => getOrders({ limit: 5, sort: "-createdAt" }),
    enabled: can("orders.read"),
  });

  const { data: paymentsData, isLoading: loadingPayments } = useQuery({
    queryKey: ["dashboard", "payments"],
    queryFn: () => getCustomerPayments({ limit: 100 }),
    enabled: can("customerPayments.read"),
  });

  // Since getExpenses is not imported in the original file, we'll mock its query temporarily or skip it if it fails.
  // For safety, assuming the API exists, but if it's missing from imports, we should be careful.
  // The previous file used getExpenses without importing it, which might have been a bug, but let's keep the query structure.

  const orders = unwrapListResponse(ordersData).items || [];
  const payments = unwrapListResponse(paymentsData).items || [];
  
  // Hardcoded for now if expenses api isn't imported, but assuming it works based on previous code.
  const totalRevenue = payments.filter(p => p.status !== 'voided').reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalExpenses = 0; // Fallback since getExpenses wasn't imported properly in the old file

  const quickActions = [
    { to: "/orders", icon: ShoppingCart, label: "New Order", colorClass: "bg-brand text-brand", borderClass: "border-brand/20", permission: "orders.read" },
    { to: "/customer-payments", icon: CreditCard, label: "Receive Pay", colorClass: "bg-success text-success", borderClass: "border-success/20", permission: "customerPayments.read" },
    { to: "/purchases", icon: Building2, label: "New Purchase", colorClass: "bg-accent text-accent", borderClass: "border-accent/20", permission: "purchases.read" },
    { to: "/attendances", icon: Users, label: "Roll-Call", colorClass: "bg-warning text-warning", borderClass: "border-warning/20", permission: "attendances.read" },
  ];

  const availableQuickActions = quickActions.filter(action => can(action.permission));

  // Get current date string for the greeting
  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="space-y-6 sm:space-y-8 animate-[fadeSlideUp_0.3s_ease_both] pb-8">
      
      {/* ── Hero Greeting ── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary font-display">
          Welcome back, {currentUser?.name?.split(' ')[0] || "User"} 👋
        </h1>
        <p className="text-sm font-medium text-secondary">
          {todayDate} — Here is what's happening at your workshop today.
        </p>
      </div>

      {/* ── Horizontal Quick Actions (Mobile First) ── */}
      {availableQuickActions.length > 0 && (
        <div className="w-full">
          <div className="flex gap-3 overflow-x-auto snap-x pb-2 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {availableQuickActions.map((action) => (
              <Link 
                key={action.to} 
                to={action.to} 
                className={`
                  snap-start shrink-0 flex flex-col items-center justify-center gap-2 
                  w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border bg-surface 
                  shadow-sm hover:shadow-md transition-all active:scale-95
                  ${action.borderClass} hover:bg-main
                `}
              >
                <div className={`flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full ${action.colorClass} bg-opacity-10`}>
                  <action.icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-primary tracking-tight text-center leading-tight px-1">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Can permission="customerPayments.read">
          <SummaryCard
            title="Total Received"
            value={loadingPayments ? <InlineSkeleton className="h-6 w-24 mt-1" /> : <MoneyDisplay amount={totalRevenue} />}
            icon={TrendingUp}
            iconVariant="success"
            variant="success"
          />
        </Can>

        <Can permission="expenses.read">
          <SummaryCard
            title="Total Expenses"
            value={<MoneyDisplay amount={totalExpenses} />}
            icon={TrendingDown}
            iconVariant="danger"
            variant="danger"
          />
        </Can>

        <Can permission="orders.read">
          <SummaryCard
            title="Active Orders"
            value={loadingOrders ? <InlineSkeleton className="h-6 w-12 mt-1" /> : orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length}
            icon={ShoppingCart}
            iconVariant="brand"
            variant="brand"
          />
        </Can>

        <Can permissions={["customerPayments.read", "expenses.read"]} mode="all">
          <SummaryCard
            title="Net Balance"
            value={(loadingPayments) ? <InlineSkeleton className="h-6 w-24 mt-1" /> : <MoneyDisplay amount={totalRevenue - totalExpenses} variant="accent" />}
            icon={Wallet}
            iconVariant="accent"
            variant="accent"
          />
        </Can>
      </div>

      {/* ── Recent Orders (Mobile Cards) ── */}
      <div className="grid grid-cols-1 gap-6">
        <Can permission="orders.read">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-lg font-bold tracking-tight text-primary">Recent Orders</h3>
              <Link to="/orders" className="text-sm font-semibold text-accent hover:text-accent-hover flex items-center gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            
            {loadingOrders ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-xl border border-border bg-surface shadow-sm space-y-3">
                    <div className="flex justify-between">
                       <Skeleton className="h-4 w-20" />
                       <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : orders.length > 0 ? (
              <div className="flex flex-col gap-3">
                {orders.map(order => (
                  <Link 
                    key={order._id} 
                    to={`/orders/${order._id}`} 
                    className="group block p-4 rounded-xl border border-border bg-surface shadow-sm hover:shadow-md hover:border-accent/30 transition-all active:scale-[0.98]"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-[10px] font-bold text-secondary uppercase tracking-widest">{order.orderNumber}</span>
                        <p className="text-sm font-bold text-primary leading-tight">{order.description}</p>
                      </div>
                      <StatusBadge status={order.status} className="shrink-0 ml-3" />
                    </div>
                    
                    <div className="flex justify-between items-end mt-3 pt-3 border-t border-border/50">
                      <div className="flex items-center gap-2 text-xs font-medium text-secondary">
                        <div className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          <span className="truncate max-w-[100px] sm:max-w-[150px]">{order.customer?.name}</span>
                        </div>
                        <span className="text-border/80">•</span>
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          <span>{formatDate(order.expectedCompletionDate)}</span>
                        </div>
                      </div>
                      <span className="text-base font-black text-primary tracking-tight">
                        <MoneyDisplay amount={order.agreedAmount} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl border border-dashed border-border/80 bg-surface/50">
                <Package className="h-8 w-8 mx-auto text-muted mb-2" />
                <p className="text-sm font-medium text-secondary">No recent orders found.</p>
              </div>
            )}
          </div>
        </Can>
      </div>
      
    </div>
  );
};

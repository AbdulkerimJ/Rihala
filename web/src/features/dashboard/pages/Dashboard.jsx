import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { getOrders } from "../../orders/api";
import { getCustomerPayments } from "../../customer-payments/api";
import { getExpenses } from "../../expenses/api";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/Card";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { formatDate } from "../../../utils/formatters";
import { unwrapListResponse } from "../../../utils/apiResponse";
import { TrendingUp, TrendingDown, ShoppingCart, Users, Wallet, CreditCard, Building2, ArrowDownRight, ArrowUpRight, Package } from "lucide-react";

export const Dashboard = () => {
  const { currentUser } = useAuth();

  // We could fetch a lot here, but let's keep it to recent orders and high-level stats for now
  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ["dashboard-orders"],
    queryFn: () => getOrders({ limit: 5, sort: "-createdAt" }),
  });

  const { data: paymentsData, isLoading: loadingPayments } = useQuery({
    queryKey: ["dashboard-payments"],
    queryFn: () => getCustomerPayments({ limit: 100 }), // In a real app we'd filter by current month
  });

  const { data: expensesData, isLoading: loadingExpenses } = useQuery({
    queryKey: ["dashboard-expenses"],
    queryFn: () => getExpenses({ limit: 100 }), 
  });

  const orders = unwrapListResponse(ordersData).items || [];
  const payments = unwrapListResponse(paymentsData).items || [];
  const expenses = unwrapListResponse(expensesData).items || [];

  const totalRevenue = payments.filter(p => p.status !== 'voided').reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const QuickAction = ({ to, icon: Icon, label, colorClass }) => (
    <Link to={to} className="flex flex-col items-center justify-center p-4 rounded-lg border border-border bg-surface hover:bg-main hover:border-accent transition-all group">
      <div className={`p-3 rounded-full mb-3 ${colorClass} bg-opacity-10 group-hover:bg-opacity-20 transition-colors`}>
        <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
      <span className="text-sm font-medium text-primary text-center">{label}</span>
    </Link>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary font-display">Welcome back, {currentUser?.name?.split(' ')[0] || "User"}</h1>
          <p className="text-secondary text-sm mt-1">Here is what's happening at your workshop today.</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm font-medium text-secondary mb-1">Total Received</p>
            {loadingPayments ? <LoadingSkeleton variant="text" /> : <h3 className="text-2xl font-bold text-primary"><MoneyDisplay amount={totalRevenue} /></h3>}
          </div>
          <div className="p-3 bg-success/10 rounded-full">
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm font-medium text-secondary mb-1">Total Expenses</p>
            {loadingExpenses ? <LoadingSkeleton variant="text" /> : <h3 className="text-2xl font-bold text-primary"><MoneyDisplay amount={totalExpenses} /></h3>}
          </div>
          <div className="p-3 bg-danger/10 rounded-full">
            <TrendingDown className="w-5 h-5 text-danger" />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm font-medium text-secondary mb-1">Active Orders</p>
            {loadingOrders ? <LoadingSkeleton variant="text" /> : <h3 className="text-2xl font-bold text-primary">{orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length}</h3>}
          </div>
          <div className="p-3 bg-brand/10 rounded-full">
            <ShoppingCart className="w-5 h-5 text-brand" />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm font-medium text-secondary mb-1">Net Balance</p>
            {(loadingPayments || loadingExpenses) ? <LoadingSkeleton variant="text" /> : <h3 className="text-2xl font-bold text-accent"><MoneyDisplay amount={totalRevenue - totalExpenses} variant="accent" /></h3>}
          </div>
          <div className="p-3 bg-accent/10 rounded-full">
            <Wallet className="w-5 h-5 text-accent" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <Link to="/orders" className="text-sm text-accent hover:underline font-medium">View All</Link>
            </CardHeader>
            
            {loadingOrders ? (
              <CardContent><LoadingSkeleton variant="default" rowCount={4} /></CardContent>
            ) : orders.length > 0 ? (
              <CardContent className="p-0 divide-y divide-border/50">
                {orders.map(order => (
                  <Link key={order._id} to={`/orders/${order._id}`} className="block px-6 py-4 hover:bg-main transition-colors">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-xs font-semibold text-primary">{order.orderNumber}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <div>
                        <p className="text-sm font-medium text-primary">{order.description}</p>
                        <p className="text-xs text-secondary mt-1">{order.customer?.name} • Due: {formatDate(order.dueDate)}</p>
                      </div>
                      <span className="text-sm font-bold text-primary"><MoneyDisplay amount={order.agreedAmount} /></span>
                    </div>
                  </Link>
                ))}
              </CardContent>
            ) : (
              <CardContent className="p-8 text-center text-secondary">
                <p>No recent orders found.</p>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-primary mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <QuickAction to="/orders" icon={ShoppingCart} label="New Order" colorClass="bg-brand text-brand" />
                <QuickAction to="/customer-payments" icon={CreditCard} label="Receive Pay" colorClass="bg-success text-success" />
                <QuickAction to="/purchases" icon={Building2} label="New Purchase" colorClass="bg-accent text-accent" />
                <QuickAction to="/attendance" icon={Users} label="Log Attendance" colorClass="bg-warning text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

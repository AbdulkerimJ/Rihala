import React, { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCustomerById } from "../api";
import { getOrders } from "../../orders/api";
import { getCustomerPayments } from "../../customer-payments/api";
import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { DetailSection, DetailItem } from "../../../components/ui/DetailSection";
import { SystemInfoSection } from "../../../components/ui/SystemInfoSection";
import { Button } from "../../../components/ui/Button";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { DataTable } from "../../../components/ui/DataTable";
import { getApiErrorMessage, unwrapEntityResponse, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";
import { usePermission } from "../../../hooks/usePermission";
import { ArrowLeft, Phone, Mail, MapPin } from "lucide-react";

export const CustomerDetail = () => {
  const { id } = useParams();
  const { can } = usePermission();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'orders' | 'payments'
  
  const customerQuery = useQuery({
    queryKey: ["customers", id],
    queryFn: () => getCustomerById(id),
    enabled: !!id,
  });

  const customer = unwrapEntityResponse(customerQuery.data);

  // Orders Tab Data
  const ordersParams = useMemo(() => ({ customer: id, limit: 5, sort: "-createdAt" }), [id]);
  const ordersQuery = useQuery({
    queryKey: ["orders", ordersParams],
    queryFn: () => getOrders(ordersParams),
    enabled: !!id && activeTab === "orders" && can("orders.read"),
  });
  const { items: orders = [], pagination: ordersPagination } = unwrapListResponse(ordersQuery.data);

  // Payments Tab Data
  const paymentsParams = useMemo(() => ({ customer: id, limit: 10, sort: "-paymentDate" }), [id]);
  const paymentsQuery = useQuery({
    queryKey: ["customer-payments", paymentsParams],
    queryFn: () => getCustomerPayments(paymentsParams),
    enabled: !!id && activeTab === "payments" && can("customerPayments.read"),
  });
  const { items: payments = [] } = unwrapListResponse(paymentsQuery.data);

  if (customerQuery.isLoading) return <DetailSkeleton />;
  
  if (customerQuery.isError || !customer) {
    return <ErrorState description={getApiErrorMessage(customerQuery.error, "Failed to load customer details.")} />;
  }

  const getInitials = (name) => {
    if (!name) return "?";
    return name.trim().charAt(0).toUpperCase();
  };

  const orderColumns = [
    { header: "Order #", accessor: (row) => <span className="font-mono text-xs font-semibold text-primary">{row.orderNumber || "-"}</span> },
    { header: "Amount", accessor: (row) => <MoneyDisplay amount={row.agreedAmount} /> },
    { header: "Expected", accessor: (row) => formatDate(row.expectedCompletionDate), className: "text-secondary" },
    { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> }
  ];

  const paymentColumns = [
    { header: "Order #", accessor: (row) => <span className="font-mono text-xs font-semibold text-primary">{row.orderNumber || row.order?.orderNumber || "-"}</span> },
    { header: "Date", accessor: (row) => formatDate(row.paymentDate), className: "text-secondary" },
    { header: "Amount", accessor: (row) => <MoneyDisplay amount={row.amount} className={row.status === 'voided' ? 'line-through opacity-50' : ''} /> },
    { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> }
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-[fadeSlideUp_0.3s_ease_both]">
      {/* ── Profile Header ── */}
      <div className="relative rounded-2xl border border-border/60 bg-surface shadow-sm p-5 sm:p-6 mt-4">
        <div className="mb-4">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-xl border-border/60 shadow-sm bg-surface/50 hover:bg-main"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-brand to-brand/70 text-white font-black text-3xl shadow-lg ring-4 ring-surface">
              {getInitials(customer.name)}
            </div>
            
            <div className="space-y-1.5 mb-1">
              <h1 className="text-2xl sm:text-3xl font-black text-primary font-display tracking-tight leading-none">{customer.name}</h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm font-medium text-secondary">
                {customer.phone && (
                  <span className="flex items-center gap-1.5 bg-main/50 px-2 py-1 rounded-md border border-border/50">
                    <Phone className="h-3.5 w-3.5" />
                    {customer.phone}
                  </span>
                )}
                {customer.email && (
                  <span className="flex items-center gap-1.5 bg-main/50 px-2 py-1 rounded-md border border-border/50">
                    <Mail className="h-3.5 w-3.5" />
                    {customer.email}
                  </span>
                )}
                {customer.address && (
                  <span className="flex items-center gap-1.5 bg-main/50 px-2 py-1 rounded-md border border-border/50 max-w-[200px] truncate">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{customer.address}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-center sm:justify-end shrink-0">
            <StatusBadge status={customer.status} className="text-sm px-4 py-1.5 shadow-sm" showDot />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-main/50 p-1 rounded-xl border border-border/50 mt-6 max-w-lg mx-auto sm:mx-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
              activeTab === "overview" ? "bg-surface text-primary shadow-sm border border-border/50" : "text-secondary hover:text-primary"
            }`}
          >
            Overview
          </button>
          {can("orders.read") && (
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
                activeTab === "orders" ? "bg-surface text-primary shadow-sm border border-border/50" : "text-secondary hover:text-primary"
              }`}
            >
              Orders
            </button>
          )}
          {can("customerPayments.read") && (
            <button
              onClick={() => setActiveTab("payments")}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
                activeTab === "payments" ? "bg-surface text-primary shadow-sm border border-border/50" : "text-secondary hover:text-primary"
              }`}
            >
              Payments
            </button>
          )}
        </div>
      </div>

      {/* ── Tab Content: Overview ── */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <DetailSection title="Contact Information">
              <DetailItem label="Full Name" value={customer.name} />
              <DetailItem label="Phone Number" value={customer.phone || "Not specified"} />
              <DetailItem label="Email" value={customer.email || "Not specified"} />
              <DetailItem label="Address" value={customer.address || "Not specified"} />
              <DetailItem label="Current Status" value={<StatusBadge status={customer.status} />} />
            </DetailSection>

            {customer.notes && (
              <DetailSection title="Notes">
                <p className="text-primary bg-main/50 p-4 rounded-lg whitespace-pre-wrap text-sm">
                  {customer.notes}
                </p>
              </DetailSection>
            )}
          </div>

          <div className="space-y-6">
            <SystemInfoSection
              id={customer._id}
              idLabel="Customer ID"
              createdAt={customer.createdAt}
              updatedAt={customer.updatedAt}
            />
          </div>
        </div>
      )}

      {/* ── Tab Content: Orders ── */}
      {activeTab === "orders" && can("orders.read") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-primary font-display">Recent Orders</h3>
            {ordersPagination?.total > 5 && (
              <Link to={`/orders?customer=${customer._id}`} className="text-sm font-medium text-brand hover:underline">
                View all {ordersPagination.total} orders
              </Link>
            )}
          </div>
          <DataTable 
            columns={orderColumns}
            data={orders}
            keyExtractor={(row) => row._id}
            onRowClick={(row) => navigate(`/orders/${row._id}`)}
            isLoading={ordersQuery.isLoading}
            mobileRenderer={(row) => (
              <div className="flex flex-col gap-2.5 p-4" onClick={() => navigate(`/orders/${row._id}`)}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs font-semibold text-primary/70">{row.orderNumber || "-"}</span>
                  <StatusBadge status={row.status} />
                </div>
                <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider mb-1">Amount</span>
                    <MoneyDisplay amount={row.agreedAmount} className="text-sm font-bold text-primary" />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider mb-1">Expected</span>
                    <span className="text-sm text-secondary font-medium">{formatDate(row.expectedCompletionDate)}</span>
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      )}

      {/* ── Tab Content: Payments ── */}
      {activeTab === "payments" && can("customerPayments.read") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-primary font-display">Recent Payments</h3>
            <Link to={`/customer-payments?customer=${customer._id}`} className="text-sm font-medium text-brand hover:underline">
              View all payments
            </Link>
          </div>
          <DataTable 
            columns={paymentColumns}
            data={payments}
            keyExtractor={(row) => row._id}
            onRowClick={(row) => navigate(`/customer-payments/${row._id}`)}
            isLoading={paymentsQuery.isLoading}
            mobileRenderer={(row) => (
              <div className="flex flex-col gap-2.5 p-4" onClick={() => navigate(`/customer-payments/${row._id}`)}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs font-semibold text-primary/70">Order: {row.orderNumber || row.order?.orderNumber || "-"}</span>
                  <StatusBadge status={row.status} />
                </div>
                <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider mb-1">Amount</span>
                    <MoneyDisplay amount={row.amount} className={`text-sm font-bold ${row.status === 'voided' ? 'line-through opacity-50' : ''}`} />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider mb-1">Date</span>
                    <span className="text-sm text-secondary font-medium">{formatDate(row.paymentDate)}</span>
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
};

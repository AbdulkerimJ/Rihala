import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCustomerById, updateCustomer } from "../api";
import { getOrders } from "../../orders/api";
import { getCustomerPayments } from "../../customer-payments/api";
import { getApiErrorMessage, unwrapEntityResponse, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate, formatDateTime } from "../../../utils/formatters";
import { MapPin, Edit, FileText, ShoppingCart, CreditCard, Eye, Store, Calendar } from "lucide-react";
import { usePermission } from "../../../hooks/usePermission";
import toast from "react-hot-toast";

import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Can } from "../../../components/Can";
import { Button } from "../../../components/ui/Button";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { SystemInfoSection } from "../../../components/ui/SystemInfoSection";
import { ListGroup, ListItem } from "../../../components/ui/ListGroup";
import { Modal } from "../../../components/ui/Modal";
import { EntityHeader } from "../../../components/ui/EntityHeader";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { CustomerForm } from "../components/CustomerForm";

export const CustomerDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { can } = usePermission();
  const [isOpen, setIsOpen] = useState(false);

  const customerQuery = useQuery({ 
    queryKey: ["customers", id], 
    queryFn: () => getCustomerById(id), 
    enabled: !!id && can("customers.read") 
  });
  
  const { data: ordersData, isLoading: isOrdersLoading } = useQuery({ 
    queryKey: ["orders", "list", { customer: id }], 
    queryFn: () => getOrders({ customer: id, limit: 50 }), 
    enabled: !!id && can("orders.read") 
  });
  
  const { data: paymentsData, isLoading: isPaymentsLoading } = useQuery({ 
    queryKey: ["customer-payments", "list", { customer: id }], 
    queryFn: () => getCustomerPayments({ customer: id, limit: 50 }), 
    enabled: !!id && can("customerPayments.read") 
  });

  const updateMutation = useMutation({ 
    mutationFn: updateCustomer, 
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["customers"] }); 
      toast.success("Customer updated successfully"); 
      setIsOpen(false); 
    } 
  });

  const customer = unwrapEntityResponse(customerQuery.data);
  const orders = unwrapListResponse(ordersData).items || [];
  const payments = unwrapListResponse(paymentsData).items || [];

  if (customerQuery.isLoading) return <DetailSkeleton />;
  if (customerQuery.isError || !customer) return <ErrorState description={getApiErrorMessage(customerQuery.error, "Failed to load customer details.")} />;

  // Calculate financial and fulfillment stats
  const totalOrderValue = orders.reduce((sum, o) => sum + (o.agreedAmount || 0), 0);
  const totalPaid = payments
    .filter((p) => p.status !== "voided")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const outstandingBalance = Math.max(0, totalOrderValue - totalPaid);
  const activeOrdersCount = orders.filter(
    (o) => o.status !== "completed" && o.status !== "cancelled"
  ).length;
  const completedOrdersCount = orders.filter(
    (o) => o.status === "completed"
  ).length;

  return (
    <div className="space-y-4 animate-[fadeSlideUp_0.3s_ease_both]">
      {/* ── Executive Header ── */}
      <EntityHeader
        parentTo="/customers"
        parentLabel="Customers"
        title={customer.name}
        theme="emerald"
        typeLabel="Customer"
        typeIcon={Store}
        status={customer.status}
        phone={customer.phone}
        email={customer.email}
        metaItems={[
          {
            icon: ShoppingCart,
            label: (
              <span>
                {orders.length} {orders.length === 1 ? "Order" : "Orders"}
                {activeOrdersCount > 0 && (
                  <span className="ml-1 text-[11px] font-semibold text-accent">
                    ({activeOrdersCount} active)
                  </span>
                )}
              </span>
            ),
          },
          {
            icon: Calendar,
            label: `Joined ${formatDate(customer.createdAt)}`,
            className: "hidden sm:inline-flex text-muted",
          },
        ]}
        actions={
          <Can permission="customers.update">
            <Button
              variant="outline"
              size="sm"
              leftIcon={Edit}
              onClick={() => setIsOpen(true)}
              className="shadow-xs hover:border-accent/40 h-8 px-3 text-xs whitespace-nowrap"
            >
              Edit Customer
            </Button>
          </Can>
        }
        metrics={[
          {
            label: "Total Order Value",
            value: <MoneyDisplay amount={totalOrderValue} />,
            subtitle: `${orders.length} ${orders.length === 1 ? "order" : "orders"} placed`,
            isLoading: isOrdersLoading,
          },
          {
            label: "Total Paid",
            value: <MoneyDisplay amount={totalPaid} />,
            subtitle: "Collected to date",
            isLoading: isPaymentsLoading,
          },
          {
            label: "Outstanding Balance",
            value: (
              <MoneyDisplay
                amount={outstandingBalance}
                className={outstandingBalance > 0 ? "text-danger" : "text-success"}
              />
            ),
            isLoading: isOrdersLoading || isPaymentsLoading,
            statusDot:
              outstandingBalance > 0
                ? {
                    color: "danger",
                    text: "Remaining to collect",
                    pulse: true,
                  }
                : {
                    color: "success",
                    text: "Fully settled",
                  },
          },
          {
            label: "Active Orders",
            value: `${activeOrdersCount} Active`,
            subtitle: `${completedOrdersCount} completed`,
            isLoading: isOrdersLoading,
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Right Column (Orders & Payments) - first on mobile */}
        <div className="order-1 lg:order-2 lg:col-span-2 space-y-6">
          <Can permission="orders.read">
            <div>
              <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-3">Order History</h3>
              {isOrdersLoading ? <DetailSkeleton /> : orders?.length > 0 ? (
                <ListGroup>
                  {orders.map((row) => {
                    const totalPaid = row.totalPaid || 0;
                    const agreedAmount = row.agreedAmount || 0;
                    const paymentProgress =
                      agreedAmount > 0
                        ? Math.min(100, Math.round((totalPaid / agreedAmount) * 100))
                        : 0;
                    const isFullyPaid = totalPaid >= agreedAmount && agreedAmount > 0;
                    const isPartiallyPaid = totalPaid > 0 && !isFullyPaid;
                    const progressVariant = isFullyPaid
                      ? "success"
                      : isPartiallyPaid
                      ? "warning"
                      : "financeIn";

                    return (
                      <ListItem
                        key={row._id}
                        to={`/orders/${row._id}`}
                        title={
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-accent uppercase tracking-widest bg-accent/10 px-1.5 py-0.5 rounded">
                              #{row.orderNumber || "-"}
                            </span>
                            <span>
                              {row.description
                                ? row.description.length > 40
                                  ? row.description.substring(0, 40) + "..."
                                  : row.description
                                : "No description"}
                            </span>
                          </div>
                        }
                        subtitle={
                          <div className="flex gap-4 text-xs mt-1">
                            <span className="text-secondary">{formatDate(row.date)}</span>
                            {row.expectedCompletionDate && (
                              <span className="text-secondary">
                                Due: {formatDate(row.expectedCompletionDate)}
                              </span>
                            )}
                          </div>
                        }
                        right={
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <div className="flex items-center gap-1.5 sm:gap-2.5">
                              <span className="text-xs sm:text-sm font-bold text-primary tracking-tight shrink-0">
                                <MoneyDisplay amount={row.agreedAmount} />
                              </span>
                              <StatusBadge status={row.status} className="shrink-0 text-[10px] sm:text-xs py-0.5 px-1.5" />
                            </div>
                            {agreedAmount > 0 && (
                              <div
                                className="w-16 sm:w-28 mt-0.5"
                                title={`${paymentProgress}% paid (${
                                  isFullyPaid
                                    ? "Fully Paid"
                                    : isPartiallyPaid
                                    ? "Partially Paid"
                                    : "Unpaid"
                                })`}
                              >
                                <ProgressBar
                                  progress={paymentProgress}
                                  variant={progressVariant}
                                  size="sm"
                                  animated={isPartiallyPaid && row.status !== "cancelled"}
                                />
                              </div>
                            )}
                          </div>
                        }
                      />
                    );
                  })}
                </ListGroup>
              ) : (
                <div className="text-center py-8 text-sm text-secondary flex flex-col items-center border border-dashed border-border/50 rounded-xl bg-surface/30">
                  <ShoppingCart className="h-8 w-8 text-muted mb-3" />
                  No orders found for this customer.
                </div>
              )}
            </div>
          </Can>

          <Can permission="customerPayments.read">
            <div>
              <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-3">Payment History</h3>
              {isPaymentsLoading ? <DetailSkeleton /> : payments?.length > 0 ? (
                <ListGroup>
                  {payments.map(row => (
                    <ListItem 
                      key={row._id}
                      title={
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary tracking-tight">
                            <MoneyDisplay amount={row.amount} variant={row.status === 'voided' ? 'default' : 'financeIn'} />
                          </span>
                          {row.status === 'voided' && <StatusBadge status={row.status} />}
                        </div>
                      }
                      subtitle={`${formatDateTime(row.paymentDate)} • Applied to Order #${row.orderNumber || "-"}`}
                      right={
                        <div className="shrink-0">
                          <Link
                            to={`/orders/${row.order?._id || row.order}`}
                            className="p-1.5 text-secondary hover:text-accent hover:bg-accent/10 rounded-lg transition-colors inline-flex items-center justify-center"
                            title="View Order"
                            aria-label="View Order"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </div>
                      }
                      className={row.status === 'voided' ? 'opacity-70' : ''}
                    />
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center py-8 text-sm text-secondary flex flex-col items-center border border-dashed border-border/50 rounded-xl bg-surface/30">
                  <CreditCard className="h-8 w-8 text-muted mb-3" />
                  No payments have been recorded.
                </div>
              )}
            </div>
          </Can>
        </div>

        {/* Left Column (Address & Notes) - second on mobile */}
        <div className="order-2 lg:order-1 space-y-6">
          <div className="bg-surface rounded-xl border border-border/70 p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <h3 className="text-xs font-bold text-secondary uppercase tracking-wider">
                Address & Notes
              </h3>
              <Can permission="customers.update">
                <Button
                  variant="ghost"
                  size="xs"
                  leftIcon={Edit}
                  onClick={() => setIsOpen(true)}
                  className="h-7 px-2 text-xs text-accent hover:text-accent-hover"
                >
                  Edit
                </Button>
              </Can>
            </div>
            <div>
              <span className="flex items-center gap-2 text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                <MapPin className="w-4 h-4 text-emerald-500" /> Address
              </span>
              <p className="text-sm text-primary whitespace-pre-wrap leading-relaxed">
                {customer.address || "No address provided."}
              </p>
            </div>
            <div className="pt-3 border-t border-border/50">
              <span className="flex items-center gap-2 text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                <FileText className="w-4 h-4 text-emerald-500" /> Notes
              </span>
              <p className="text-sm text-primary whitespace-pre-wrap leading-relaxed">
                {customer.notes || "No additional notes."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── System Information at bottom ── */}
      <SystemInfoSection 
        id={customer._id} 
        idLabel="Customer ID" 
        createdAt={customer.createdAt} 
        updatedAt={customer.updatedAt} 
      />

      <Modal isOpen={isOpen} title="Edit Customer" onClose={() => setIsOpen(false)}>
        <CustomerForm 
          initialData={customer} 
          onClose={() => setIsOpen(false)} 
          onSubmit={(data) => updateMutation.mutateAsync({ id: customer._id, data })} 
        />
      </Modal>
    </div>
  );
};

import React, { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrderById, updateOrder } from "../api";
import { getAllowedOrderTransitions, ORDER_STATUS_LABELS } from "../constants";
import {
  getCustomerPayments,
  createCustomerPayment,
  voidCustomerPayment,
} from "../../customer-payments/api";
import { getCustomers } from "../../customers/api";
import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Button } from "../../../components/ui/Button";
import { SummaryCard } from "../../../components/ui/SummaryCard";
import { DetailSection, DetailItem } from "../../../components/ui/DetailSection";
import { SystemInfoSection } from "../../../components/ui/SystemInfoSection";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { DataTable } from "../../../components/ui/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { VoidReasonDialog } from "../../../components/ui/VoidReasonDialog";
import { OrderForm } from "../components/OrderForm";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { FormRootError } from "../../../components/ui/FormRootError";
import { usePermission } from "../../../hooks/usePermission";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  formatDate,
  formatDateTime,
  formatCurrency,
} from "../../../utils/formatters";
import {
  applyServerErrors,
  getApiErrorMessage,
  unwrapEntityResponse,
  unwrapListResponse,
} from "../../../utils/apiResponse";
import { Can } from "../../../components/Can";
import {
  User,
  Wallet,
  Calendar,
  Clock,
  ClipboardList,
  CheckCircle2,
  PackageCheck,
  Hammer,
  Wrench,
  AlertCircle,
  XCircle,
  CreditCard,
  Plus,
  Edit3,
  Phone,
  Receipt,
  CalendarClock,
  Layers,
  FileText,
  Sparkles,
  Check,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";

// Status configuration with distinct non-gray vibrant themes
const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    variant: "amber",
    iconVariant: "amber",
    textClass: "text-amber-600 dark:text-amber-400",
    bgLight: "bg-amber-500/10",
    borderClass: "border-amber-500/20",
    icon: Clock,
    subtitle: "Awaiting start of workshop production",
    stepIndex: 0,
  },
  in_progress: {
    label: "In Progress",
    variant: "blue",
    iconVariant: "blue",
    textClass: "text-blue-600 dark:text-blue-400",
    bgLight: "bg-blue-500/10",
    borderClass: "border-blue-500/20",
    icon: Hammer,
    subtitle: "Crafting and building in workshop",
    stepIndex: 1,
  },
  ready: {
    label: "Ready",
    variant: "purple",
    iconVariant: "purple",
    textClass: "text-purple-600 dark:text-purple-400",
    bgLight: "bg-purple-500/10",
    borderClass: "border-purple-500/20",
    icon: PackageCheck,
    subtitle: "Finished & ready for pickup/delivery",
    stepIndex: 2,
  },
  completed: {
    label: "Completed",
    variant: "emerald",
    iconVariant: "emerald",
    textClass: "text-emerald-600 dark:text-emerald-400",
    bgLight: "bg-emerald-500/10",
    borderClass: "border-emerald-500/20",
    icon: CheckCircle2,
    subtitle: "Delivered to customer & completed",
    stepIndex: 3,
  },
  cancelled: {
    label: "Cancelled",
    variant: "rose",
    iconVariant: "rose",
    textClass: "text-rose-600 dark:text-rose-400",
    bgLight: "bg-rose-500/10",
    borderClass: "border-rose-500/20",
    icon: XCircle,
    subtitle: "Order has been cancelled",
    stepIndex: -1,
  },
};

const ORDER_LIFECYCLE_STEPS = [
  { key: "pending", label: "Pending", icon: Clock, color: "amber" },
  { key: "in_progress", label: "In Progress", icon: Hammer, color: "blue" },
  { key: "ready", label: "Ready", icon: PackageCheck, color: "purple" },
  { key: "completed", label: "Completed", icon: CheckCircle2, color: "emerald" },
];

const directPaymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  paymentDate: z.string().min(1, "Payment date is required"),
  notes: z.string().optional(),
});

const OrderPaymentModal = ({
  isOpen,
  onClose,
  order,
  remainingBalance,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(directPaymentSchema),
    defaultValues: {
      amount: remainingBalance > 0 ? remainingBalance : "",
      paymentDate: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit({
        customer: order.customer?._id || order.customer,
        order: order._id,
        amount: data.amount,
        paymentDate: new Date(data.paymentDate).toISOString(),
        note: data.notes,
      });
    } catch (error) {
      applyServerErrors(setError, error);
    }
  };

  return (
    <Modal isOpen={isOpen} title="Receive Customer Payment" onClose={onClose}>
      <form
        className="space-y-4 p-6"
        onSubmit={handleSubmit(handleFormSubmit)}
      >
        <FormRootError error={errors.root} />

        <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-secondary">Customer:</span>
            <span className="font-semibold text-primary">
              {order.customer?.name || order.customerName}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-secondary">Order Total:</span>
            <span className="font-semibold text-primary">
              <MoneyDisplay amount={order.agreedAmount} />
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1 pt-1 border-t border-teal-500/10">
            <span className="text-teal-700 dark:text-teal-300 font-medium">
              Remaining Due:
            </span>
            <span className="font-bold text-teal-600 dark:text-teal-400">
              <MoneyDisplay amount={remainingBalance} />
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Payment Amount (ETB)"
            required
            error={errors.amount?.message}
          >
            <Input
              type="number"
              step="0.01"
              max={order.agreedAmount}
              placeholder="0.00"
              {...register("amount")}
              error={errors.amount?.message}
            />
          </FormField>

          <FormField
            label="Payment Date"
            required
            error={errors.paymentDate?.message}
          >
            <Input
              type="date"
              {...register("paymentDate")}
              error={errors.paymentDate?.message}
            />
          </FormField>
        </div>

        <FormField label="Notes / Reference" error={errors.notes?.message}>
          <Textarea
            placeholder="e.g., Cash deposit, Bank transfer ref..."
            {...register("notes")}
            rows={2}
            error={errors.notes?.message}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export const OrderDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { can } = usePermission();

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [voidingPayment, setVoidingPayment] = useState(null);

  // 1. Fetch Order
  const orderQuery = useQuery({
    queryKey: ["orders", id],
    queryFn: () => getOrderById(id),
    enabled: !!id,
  });

  const order = unwrapEntityResponse(orderQuery.data);

  // 2. Fetch Customer Payments for this order (Layer 4 permission compliance)
  const paymentsQuery = useQuery({
    queryKey: ["customer-payments", { order: id }],
    queryFn: () => getCustomerPayments({ order: id, limit: 100 }),
    enabled: can("customerPayments.read") && !!id,
  });

  const payments = unwrapListResponse(paymentsQuery.data).items || [];

  // 3. Fetch Customers list for the Edit Modal
  const customersQuery = useQuery({
    queryKey: ["customers-for-order-edit"],
    queryFn: () => getCustomers({ limit: 1000 }),
    enabled: can("customers.read") && isEditModalOpen,
  });

  const customers = unwrapListResponse(customersQuery.data).items || [];

  // 4. Mutations
  const updateMutation = useMutation({
    mutationFn: updateOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order updated successfully");
      setEditModalOpen(false);
      setCancellingOrder(false);
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: createCustomerPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customer-payments", { order: id }],
      });
      queryClient.invalidateQueries({ queryKey: ["customer-payments"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Payment recorded successfully");
      setPaymentModalOpen(false);
    },
  });

  const voidPaymentMutation = useMutation({
    mutationFn: voidCustomerPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customer-payments", { order: id }],
      });
      queryClient.invalidateQueries({ queryKey: ["customer-payments"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Payment voided successfully");
      setVoidingPayment(null);
    },
  });

  // Calculate Financials
  const activePayments = useMemo(
    () => payments.filter((p) => p.status !== "voided"),
    [payments]
  );
  const totalPaid = useMemo(
    () => activePayments.reduce((sum, p) => sum + (p.amount || 0), 0),
    [activePayments]
  );
  const agreedAmount = order?.agreedAmount || 0;
  const remainingBalance = Math.max(0, agreedAmount - totalPaid);
  const paymentProgress =
    agreedAmount > 0
      ? Math.min(100, Math.round((totalPaid / agreedAmount) * 100))
      : 0;
  const isFullyPaid = totalPaid >= agreedAmount && agreedAmount > 0;

  // Calculate Delivery Schedule
  const daysUntilDue = useMemo(() => {
    if (!order?.expectedCompletionDate) return null;
    const diff =
      new Date(order.expectedCompletionDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [order?.expectedCompletionDate]);

  if (orderQuery.isLoading) return <DetailSkeleton />;
  if (orderQuery.isError || !order)
    return (
      <ErrorState
        description={getApiErrorMessage(
          orderQuery.error,
          "Failed to load order details."
        )}
      />
    );

  const allowedTransitions = getAllowedOrderTransitions(order.status);
  const currentStatusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const isCancelled = order.status === "cancelled";
  const isCompleted = order.status === "completed";

  // Payments Table Columns
  const paymentColumns = [
    {
      header: "Payment Date",
      accessor: (row) => formatDate(row.paymentDate),
      className: "text-secondary",
    },
    {
      header: "Amount",
      accessor: (row) => (
        <MoneyDisplay
          amount={row.amount}
          className={row.status === "voided" ? "line-through opacity-50" : "font-bold"}
        />
      ),
    },
    {
      header: "Notes",
      accessor: (row) => (
        <span className="text-xs text-secondary truncate max-w-[200px] block">
          {row.note || "-"}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (row) => <StatusBadge status={row.status} showDot />,
    },
    {
      header: "Actions",
      isActions: true,
      accessor: (row) => (
        <div className="flex justify-end">
          <Can permission="customerPayments.void">
            {row.status !== "voided" && (
              <Button
                variant="ghostDanger"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setVoidingPayment(row);
                }}
              >
                Void
              </Button>
            )}
          </Can>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-surface text-secondary hover:text-primary hover:bg-main transition-colors shrink-0"
            title="Back to orders"
            aria-label="Back to orders"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-primary font-display tracking-tight flex items-center gap-2">
                Order{" "}
                {order.orderNumber ? (
                  <span className="font-mono px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xl border border-blue-500/20">
                    #{order.orderNumber}
                  </span>
                ) : (
                  "Details"
                )}
              </h1>
              <StatusBadge
                status={order.status}
                showDot
                className="text-xs px-3 py-1 font-semibold"
              />
              {isFullyPaid && (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Check className="w-3 h-3" /> Fully Paid
                </span>
              )}
            </div>
            <p className="text-sm text-secondary">
              Created on {formatDate(order.date || order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Can permission="orders.update">
            {!isCompleted && !isCancelled && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={Edit3}
                onClick={() => setEditModalOpen(true)}
              >
                Edit Order
              </Button>
            )}
          </Can>

          <Can permission="customerPayments.create">
            {remainingBalance > 0 && !isCancelled && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={Plus}
                onClick={() => setPaymentModalOpen(true)}
              >
                Receive Payment
              </Button>
            )}
          </Can>
        </div>
      </div>

      {/* 2. Enhanced Colored Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Customer (Blue Theme) */}
        <SummaryCard
          title="Customer"
          variant="blue"
          icon={User}
          value={
            <div className="flex items-center gap-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              <span className="truncate">
                {order.customer?.name || order.customerName || "Unknown"}
              </span>
              {order.customer?._id && can("customers.read") && (
                <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0" />
              )}
            </div>
          }
          subtitle={
            order.customerPhone || order.customer?.phone
              ? `📞 ${order.customerPhone || order.customer?.phone}`
              : "No phone recorded"
          }
          className={
            order.customer?._id && can("customers.read")
              ? "cursor-pointer"
              : ""
          }
        >
          {order.customer?._id && can("customers.read") && (
            <Link
              to={`/customers/${order.customer?._id || order.customer}`}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              View customer profile <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </SummaryCard>

        {/* Card 2: Agreed Amount (Emerald Theme) */}
        <SummaryCard
          title="Agreed Amount"
          variant="emerald"
          icon={Wallet}
          value={
            <MoneyDisplay
              amount={order.agreedAmount}
              className="text-emerald-600 dark:text-emerald-400 font-bold"
            />
          }
          subtitle="Agreed project total"
        >
          <div className="flex items-center justify-between text-xs text-secondary">
            <span>Payment status:</span>
            <span
              className={`font-semibold ${
                isFullyPaid
                  ? "text-emerald-600 dark:text-emerald-400"
                  : totalPaid > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {isFullyPaid
                ? "Settled in Full"
                : totalPaid > 0
                ? "Partially Paid"
                : "Unpaid"}
            </span>
          </div>
        </SummaryCard>

        {/* Card 3: Total Paid & Balance (Teal Theme) */}
        <SummaryCard
          title="Total Paid"
          variant="teal"
          icon={CreditCard}
          value={
            <MoneyDisplay
              amount={totalPaid}
              className="text-teal-600 dark:text-teal-400 font-bold"
            />
          }
          subtitle={
            isFullyPaid
              ? "Fully settled"
              : `Balance: ${formatCurrency(remainingBalance)}`
          }
        >
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-secondary font-medium">
              <span>{paymentProgress}% paid</span>
              <span>{formatCurrency(remainingBalance)} left</span>
            </div>
            <div className="w-full h-1.5 bg-border/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${paymentProgress}%` }}
              />
            </div>
          </div>
        </SummaryCard>

        {/* Card 4: Status / Completion (Dynamic Status Theme - NO GRAY) */}
        <SummaryCard
          title="Order Status"
          variant={currentStatusConfig.variant}
          icon={currentStatusConfig.icon}
          value={
            <span className={currentStatusConfig.textClass}>
              {ORDER_STATUS_LABELS[order.status] || order.status}
            </span>
          }
          subtitle={currentStatusConfig.subtitle}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-secondary">Due date:</span>
            <span
              className={`font-semibold ${
                isCompleted
                  ? "text-emerald-600 dark:text-emerald-400"
                  : daysUntilDue !== null && daysUntilDue < 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-primary"
              }`}
            >
              {formatDate(order.expectedCompletionDate)}
              {daysUntilDue !== null && !isCompleted && !isCancelled && (
                <span className="ml-1 text-[11px] font-normal text-secondary">
                  ({daysUntilDue > 0 ? `${daysUntilDue}d left` : daysUntilDue === 0 ? "Today" : `${Math.abs(daysUntilDue)}d overdue`})
                </span>
              )}
            </span>
          </div>
        </SummaryCard>
      </div>

      {/* 3. Visual Workflow Pipeline / Stepper */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-border/40 pb-4">
          <div>
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">Production Stage Pipeline
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              Live tracking from order reception to workshop delivery.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-secondary">Current Stage:</span>
            <StatusBadge status={order.status} showDot />
          </div>
        </div>

        {isCancelled ? (
          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <div>
              <h4 className="text-sm font-bold">This Order is Cancelled</h4>
              <p className="text-xs mt-1 text-rose-600/90 dark:text-rose-300/90">
                Production has stopped and this order is closed. No further status changes or payments can be recorded.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ORDER_LIFECYCLE_STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const isPast = currentStatusConfig.stepIndex > idx;
              const isCurrent = currentStatusConfig.stepIndex === idx;
              const isFuture = currentStatusConfig.stepIndex < idx;

              const statusColorStyles = {
                amber: {
                  activeBorder: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
                  iconBox: "bg-amber-500 text-white",
                  pill: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
                },
                blue: {
                  activeBorder: "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
                  iconBox: "bg-blue-500 text-white",
                  pill: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
                },
                purple: {
                  activeBorder: "border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300",
                  iconBox: "bg-purple-500 text-white",
                  pill: "bg-purple-500/20 text-purple-700 dark:text-purple-300",
                },
                emerald: {
                  activeBorder: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                  iconBox: "bg-emerald-500 text-white",
                  pill: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
                },
              };

              const colorStyle = statusColorStyles[step.color];

              return (
                <div
                  key={step.key}
                  className={`relative flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                    isCurrent
                      ? `${colorStyle.activeBorder} shadow-xs ring-2 ring-${step.color}-500/20`
                      : isPast
                      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300"
                      : "border-border/60 bg-main/30 text-secondary opacity-60"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                      isPast
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                        ? colorStyle.iconBox
                        : "bg-border text-secondary"
                    }`}
                  >
                    {isPast ? (
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <StepIcon className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate">
                        {step.label}
                      </span>
                      {isCurrent && (
                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md ${colorStyle.pill}`}
                        >
                          Active
                        </span>
                      )}
                      {isPast && (
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Done
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted truncate mt-0.5">
                      {isPast
                        ? "Completed stage"
                        : isCurrent
                        ? "In progress now"
                        : "Upcoming stage"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Status Transition Action Buttons */}
        {allowedTransitions.length > 0 && (
          <div className="mt-5 pt-4 border-t border-border/50 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-secondary font-medium">
              Available Status Actions:
            </span>
            <div className="flex flex-wrap gap-2.5">
              <Can permission="orders.update">
                {allowedTransitions.map((targetStatus) => {
                  const targetConfig = STATUS_CONFIG[targetStatus];
                  const isCancelAction = targetStatus === "cancelled";

                  const actionButtonStyles = {
                    in_progress:
                      "bg-blue-600 hover:bg-blue-700 text-white shadow-xs",
                    ready:
                      "bg-purple-600 hover:bg-purple-700 text-white shadow-xs",
                    completed:
                      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs",
                    cancelled: "",
                  };

                  if (isCancelAction) {
                    return (
                      <Button
                        key={targetStatus}
                        variant="ghostDanger"
                        size="sm"
                        leftIcon={XCircle}
                        onClick={() => setCancellingOrder(true)}
                        disabled={updateMutation.isPending}
                      >
                        Cancel Order
                      </Button>
                    );
                  }

                  const TargetIcon = targetConfig?.icon || Check;

                  return (
                    <button
                      key={targetStatus}
                      type="button"
                      onClick={() =>
                        updateMutation.mutate({
                          id: order._id,
                          data: { status: targetStatus },
                        })
                      }
                      disabled={updateMutation.isPending}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        actionButtonStyles[targetStatus] ||
                        "bg-accent text-white hover:bg-accent-hover"
                      }`}
                    >
                      <TargetIcon className="w-3.5 h-3.5" />
                      Mark as {ORDER_STATUS_LABELS[targetStatus]}
                    </button>
                  );
                })}
              </Can>
            </div>
          </div>
        )}
      </div>

      {/* 4. Main Body: Order Information & Financials */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2 Cols): Items, Description & Payments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Description & Notes */}
          <DetailSection title="Description & Notes">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-secondary uppercase tracking-wider block mb-1">
                  Description
                </span>
                <p className="text-sm text-primary leading-relaxed whitespace-pre-wrap">
                  {order.description || order.items?.[0]?.description || "No description provided."}
                </p>
              </div>

              {order.notes && (
                <div className="pt-3 border-t border-border/50">
                  <span className="text-xs font-semibold text-secondary uppercase tracking-wider block mb-1">
                    Notes
                  </span>
                  <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">
                    {order.notes}
                  </p>
                </div>
              )}
            </div>
          </DetailSection>

          {/* Customer Payments Log (Complies with Permission Architecture) */}
          <Can permission="customerPayments.read">
            <DetailSection
              title="Customer Payments History"
              className="relative"
            >
              <div className="space-y-4">
                {/* Financial overview mini banner */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-main/50 border border-border/50">
                  <div>
                    <span className="text-xs text-secondary block">Agreed Total</span>
                    <span className="text-sm sm:text-base font-bold text-primary tabular-nums">
                      <MoneyDisplay amount={order.agreedAmount} />
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-teal-700 dark:text-teal-300 block font-medium">
                      Paid to Date
                    </span>
                    <span className="text-sm sm:text-base font-bold text-teal-600 dark:text-teal-400 tabular-nums">
                      <MoneyDisplay amount={totalPaid} />
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-xs text-secondary block">Remaining Due</span>
                    <span
                      className={`text-sm sm:text-base font-bold tabular-nums ${
                        remainingBalance > 0
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      <MoneyDisplay amount={remainingBalance} />
                    </span>
                  </div>
                </div>

                <DataTable
                  columns={paymentColumns}
                  data={payments}
                  keyExtractor={(row) => row._id}
                  isLoading={paymentsQuery.isLoading}
                  emptyState={
                    <div className="text-center py-6 text-secondary text-sm">
                      <Receipt className="w-8 h-8 mx-auto mb-2 text-muted opacity-50" />
                      <p>No customer payments recorded for this order yet.</p>
                      <Can permission="customerPayments.create">
                        {remainingBalance > 0 && !isCancelled && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="mt-3"
                            leftIcon={Plus}
                            onClick={() => setPaymentModalOpen(true)}
                          >
                            Record Initial Payment
                          </Button>
                        )}
                      </Can>
                    </div>
                  }
                />
              </div>
            </DetailSection>
          </Can>
        </div>

        {/* Right Column (1 Col): Customer Card, Timeline & System Info */}
        <div className="space-y-6">
          {/* Customer & Agreement Card */}
          <DetailSection title="Customer Information">
            <div className="space-y-3">
              <DetailItem
                label="Customer Name"
                value={
                  <span className="font-semibold text-primary">
                    {order.customer?.name || order.customerName}
                  </span>
                }
              />
              <DetailItem
                label="Phone Number"
                value={
                  order.customerPhone || order.customer?.phone ? (
                    <a
                      href={`tel:${order.customerPhone || order.customer?.phone}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {order.customerPhone || order.customer?.phone}
                    </a>
                  ) : (
                    "-"
                  )
                }
              />
              <DetailItem
                label="Agreement Date"
                value={formatDate(order.date || order.createdAt)}
              />
              <DetailItem
                label="Expected Delivery"
                value={
                  <span className="font-semibold text-primary">
                    {formatDate(order.expectedCompletionDate)}
                  </span>
                }
              />
              {order.customer?._id && can("customers.read") && (
                <div className="pt-2">
                  <Link
                    to={`/customers/${order.customer?._id || order.customer}`}
                    className="w-full text-center py-2 px-3 rounded-lg border border-border bg-surface hover:bg-main text-xs font-semibold text-primary flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-blue-500" /> View Customer History
                  </Link>
                </div>
              )}
            </div>
          </DetailSection>

          {/* Status Timeline History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <DetailSection title="Status Audit Timeline">
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
                {order.statusHistory.map((historyItem, idx) => {
                  const historyConfig =
                    STATUS_CONFIG[historyItem.status] || STATUS_CONFIG.pending;
                  return (
                    <div key={idx} className="relative">
                      <span
                        className={`absolute -left-6 top-1 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-surface ${
                          historyConfig.bgLight
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            historyItem.status === "completed"
                              ? "bg-emerald-500"
                              : historyItem.status === "in_progress"
                              ? "bg-blue-500"
                              : historyItem.status === "ready"
                              ? "bg-purple-500"
                              : historyItem.status === "cancelled"
                              ? "bg-rose-500"
                              : "bg-amber-500"
                          }`}
                        />
                      </span>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <StatusBadge
                            status={historyItem.status}
                            className="text-[11px] px-2 py-0.5"
                          />
                          <span className="text-[11px] text-muted">
                            {formatDateTime(historyItem.changedAt)}
                          </span>
                        </div>
                        {historyItem.changedBy && (
                          <span className="text-xs text-secondary mt-0.5">
                            by {historyItem.changedBy?.name || order.createdBy?.name || "System"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </DetailSection>
          )}

          {/* System Info Section */}
          <SystemInfoSection
            id={order._id}
            idLabel="Order ID"
            createdAt={order.createdAt}
            updatedAt={order.updatedAt}
            extraItems={[
              { label: "Order Number", value: order.orderNumber || "-" },
              {
                label: "Created By",
                value: order.createdBy?.name || "Unknown User",
              },
            ]}
          />
        </div>
      </div>

      {/* 5. Modals & Dialogs */}
      {/* Edit Order Modal */}
      <Modal
        isOpen={isEditModalOpen}
        title="Edit Order Details"
        onClose={() => setEditModalOpen(false)}
      >
        <OrderForm
          initialData={order}
          customers={customers}
          onClose={() => setEditModalOpen(false)}
          onSubmit={(data) =>
            updateMutation.mutateAsync({ id: order._id, data })
          }
        />
      </Modal>

      {/* Direct Payment Modal */}
      <OrderPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        order={order}
        remainingBalance={remainingBalance}
        onSubmit={(data) => createPaymentMutation.mutateAsync(data)}
      />

      {/* Cancel Order Confirm Dialog */}
      <ConfirmDialog
        isOpen={cancellingOrder}
        title="Cancel Order"
        description="Are you sure you want to cancel this order? Cancelled orders cannot be re-opened. Any customer payments must be voided beforehand."
        confirmLabel="Cancel Order"
        variant="danger"
        isSubmitting={updateMutation.isPending}
        onConfirm={() =>
          updateMutation.mutate({
            id: order._id,
            data: { status: "cancelled" },
          })
        }
        onCancel={() => setCancellingOrder(false)}
      />

      {/* Void Payment Dialog */}
      <VoidReasonDialog
        isOpen={!!voidingPayment}
        title="Void Customer Payment"
        message={`Are you sure you want to void payment of ${voidingPayment?.amount} ETB? This action cannot be undone.`}
        confirmLabel="Void Payment"
        isLoading={voidPaymentMutation.isPending}
        onConfirm={(reason) =>
          voidPaymentMutation.mutateAsync({
            id: voidingPayment._id,
            voidReason: reason,
          })
        }
        onCancel={() => setVoidingPayment(null)}
      />
    </div>
  );
};

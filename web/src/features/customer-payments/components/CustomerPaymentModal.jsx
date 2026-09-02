import React, { useMemo } from "react";
import { Save, X, Plus } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { usePermission } from "../../../hooks/usePermission";
import { getCustomers } from "../../customers/api";
import { getOrders } from "../../orders/api";
import { FormField } from "../../../components/ui/FormField";
import { Select } from "../../../components/ui/Select";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { FormRootError } from "../../../components/ui/FormRootError";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { CurrencyInput } from "../../../components/ui/CurrencyInput";
import { applyServerErrors, unwrapListResponse } from "../../../utils/apiResponse";

const paymentSchema = z.object({
  customer: z.string().min(1, "Customer is required"),
  order: z.string().min(1, "Order is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  notes: z.string().optional(),
  paymentDate: z.string().min(1, "Payment date is required"),
});

export const CustomerPaymentModal = ({
  isOpen,
  onClose,
  onSubmit,
  preSelectedCustomer = null,
  preSelectedOrder = null,
}) => {
  const { can } = usePermission();
  const isPreSelected = Boolean(preSelectedCustomer && preSelectedOrder);

  const { data: customersData } = useQuery({
    queryKey: ["customers", "list"],
    queryFn: () => getCustomers({ limit: 1000 }),
    enabled: can("customers.read") && isOpen && !isPreSelected,
  });
  const customers = unwrapListResponse(customersData).items || [];

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      customer: preSelectedCustomer?._id || preSelectedCustomer || "",
      order: preSelectedOrder?._id || preSelectedOrder || "",
      amount: "",
      notes: "",
      paymentDate: new Date().toISOString().split("T")[0],
    },
  });

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      const remaining = preSelectedOrder ? Math.max(0, preSelectedOrder.agreedAmount - (preSelectedOrder.totalPaid || 0)) : "";
      reset({
        customer: preSelectedCustomer?._id || preSelectedCustomer || "",
        order: preSelectedOrder?._id || preSelectedOrder || "",
        amount: remaining > 0 ? remaining : "",
        notes: "",
        paymentDate: new Date().toISOString().split("T")[0],
      });
    }
  }, [isOpen, reset, preSelectedCustomer, preSelectedOrder]);

  const selectedCustomer = watch("customer");
  const selectedOrderId = watch("order");

  // Automatically reset the order selection when the customer changes, but only if not pre-selected
  React.useEffect(() => {
    if (!isPreSelected && selectedCustomer && selectedCustomer !== (preSelectedCustomer?._id || preSelectedCustomer)) {
      setValue("order", "");
    }
  }, [selectedCustomer, setValue, isPreSelected, preSelectedCustomer]);

  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["orders-by-customer", selectedCustomer],
    queryFn: () => getOrders({ customer: selectedCustomer, limit: 100 }),
    enabled: !!selectedCustomer && can("orders.read") && isOpen && !isPreSelected,
  });

  const orders = useMemo(() => {
    const list = unwrapListResponse(ordersData).items || [];
    return list.filter((o) => {
      const remaining = (o.agreedAmount || 0) - (o.totalPaid || 0);
      return o.status !== "cancelled" && o.status !== "completed" && remaining > 0;
    });
  }, [ordersData]);

  const selectedOrderObj = useMemo(() => {
    if (isPreSelected) return preSelectedOrder;
    return orders.find((o) => o._id === selectedOrderId);
  }, [orders, selectedOrderId, isPreSelected, preSelectedOrder]);

  const handleFormSubmit = async (data) => {
    try {
      const payload = {
        order: data.order,
        amount: data.amount,
        paymentDate: new Date(data.paymentDate).toISOString(),
        note: data.notes?.trim() ? data.notes.trim() : undefined,
      };

      await onSubmit(payload);
    } catch (error) {
      applyServerErrors(setError, error);
    }
  };

  return (
    <Modal isOpen={isOpen} title="Receive Customer Payment" onClose={onClose}>
      <form className="space-y-3 p-4 sm:p-5" onSubmit={handleSubmit(handleFormSubmit)}>
        <FormRootError error={errors.root} />

        {isPreSelected ? (
          <div className="rounded-xl border border-finance-in/20 bg-finance-in/5 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-secondary">Customer:</span>
              <span className="font-semibold text-primary">
                {preSelectedCustomer?.name || preSelectedCustomer?.customerName || preSelectedCustomer}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1 pt-1 border-t border-finance-in/10">
              <span className="text-secondary">Order Total:</span>
              <span className="font-semibold text-primary">
                <MoneyDisplay amount={preSelectedOrder?.agreedAmount} />
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1 pt-1 border-t border-finance-in/10">
              <span className="text-finance-in font-medium">Remaining Due:</span>
              <span className="font-bold text-finance-in">
                <MoneyDisplay amount={Math.max(0, (preSelectedOrder?.agreedAmount || 0) - (preSelectedOrder?.totalPaid || 0))} />
              </span>
            </div>
          </div>
        ) : (
          <>
            <FormField label="Customer" required error={errors.customer?.message}>
              <Controller
                name="customer"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={customers.map((c) => ({ value: c._id, label: c.name }))}
                    placeholder="Select a customer"
                    error={errors.customer?.message}
                  />
                )}
              />
            </FormField>

            <FormField label="Order" required error={errors.order?.message}>
              <Controller
                name="order"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    disabled={!selectedCustomer || isLoadingOrders}
                    placeholder={
                      !selectedCustomer
                        ? "Select a customer first"
                        : isLoadingOrders
                        ? "Loading customer orders..."
                        : orders.length === 0
                        ? "No active orders found for this customer"
                        : "Select an order"
                    }
                    options={orders.map((o) => ({
                      value: o._id,
                      label: `${o.orderNumber ? `[${o.orderNumber}] ` : ""}${o.description || o.items?.[0]?.description || "Order"} - ${o.agreedAmount} ETB`,
                    }))}
                    error={errors.order?.message}
                  />
                )}
              />
              {!selectedCustomer ? (
                <p className="text-xs text-secondary mt-1">Select a customer first to see their orders.</p>
              ) : isLoadingOrders ? (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Loading customer orders...</p>
              ) : orders.length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">This customer has no active orders.</p>
              ) : null}
            </FormField>

            {selectedOrderObj && (
              <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-2.5 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-secondary">Selected Order:</span>
                  <span className="font-semibold text-primary">
                    {selectedOrderObj.orderNumber ? `#${selectedOrderObj.orderNumber}` : "Order Details"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary">Agreed Total:</span>
                  <span className="font-bold text-primary">
                    <MoneyDisplay amount={selectedOrderObj.agreedAmount} />
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary">Order Stage:</span>
                  <StatusBadge status={selectedOrderObj.status} showDot className="text-[10px] py-0 px-2" />
                </div>
              </div>
            )}
          </>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Amount (ETB)" required error={errors.amount?.message}>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <CurrencyInput {...field} error={errors.amount?.message} />
              )}
            />
          </FormField>

          <FormField label="Payment Date" required error={errors.paymentDate?.message}>
            <Input type="date" {...register("paymentDate")} error={errors.paymentDate?.message} />
          </FormField>
        </div>

        <FormField label="Notes" error={errors.notes?.message}>
          <Textarea {...register("notes")} rows={2} error={errors.notes?.message} />
        </FormField>

        <div className="flex justify-end gap-2.5 pt-3 mt-1 border-t border-border/50">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} leftIcon={X}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} leftIcon={Save}>
            Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
};

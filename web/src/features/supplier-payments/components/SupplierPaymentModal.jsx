import React from "react";
import { Save, X, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePermission } from "../../../hooks/usePermission";
import { getSuppliers, createSupplier } from "../../suppliers/api";
import { SupplierForm } from "../../suppliers/components/SupplierForm";
import { getPurchases } from "../../purchases/api";
import { unwrapListResponse, applyServerErrors } from "../../../utils/apiResponse";
import { getLocalISODate } from "../../../utils/formatters";

import { Modal } from "../../../components/ui/Modal";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { CreatableSelect } from "../../../components/ui/CreatableSelect";
import { Textarea } from "../../../components/ui/Textarea";
import { Button } from "../../../components/ui/Button";
import { CurrencyInput } from "../../../components/ui/CurrencyInput";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { FormRootError } from "../../../components/ui/FormRootError";

const paymentSchema = z.object({
  supplier: z.string().min(1, "Supplier is required"),
  purchase: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  notes: z.string().optional(),
  paymentDate: z.string().min(1, "Payment date is required"),
});

export const SupplierPaymentModal = ({
  isOpen,
  onClose,
  onSubmit,
  preSelectedSupplier = null,
  preSelectedPurchase = null,
}) => {
  const { can } = usePermission();

  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers", "list"],
    queryFn: () => getSuppliers({ limit: 1000 }),
    enabled: can("suppliers.read") && isOpen,
  });
  const suppliers = unwrapListResponse(suppliersData).items || [];

  const {
    register,
    control,
    handleSubmit,
    watch,
    setError,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      supplier: preSelectedSupplier?._id || "",
      purchase: preSelectedPurchase?._id || "",
      amount: preSelectedPurchase ? Math.max(0, preSelectedPurchase.totalAmount - (preSelectedPurchase.allocatedAmount || 0)) || "" : "",
      notes: "",
      paymentDate: getLocalISODate(),
    },
  });

  // Reset form when opened with new pre-selections
  React.useEffect(() => {
    if (isOpen) {
      const remaining = preSelectedPurchase ? Math.max(0, preSelectedPurchase.totalAmount - (preSelectedPurchase.allocatedAmount || 0)) : "";
      reset({
        supplier: preSelectedSupplier?._id || "",
        purchase: preSelectedPurchase?._id || "",
        amount: remaining > 0 ? remaining : "",
        notes: "",
        paymentDate: getLocalISODate(),
      });
    }
  }, [isOpen, preSelectedSupplier, preSelectedPurchase, reset]);

  const selectedSupplier = watch("supplier");
  
  // Handle supplier change side-effects
  React.useEffect(() => {
    if (!selectedSupplier) return;
    
    // Skip if it's the pre-selected supplier (initial load)
    if (preSelectedSupplier && selectedSupplier === preSelectedSupplier._id) {
       return;
    }

    const sObj = suppliers.find(s => s._id === selectedSupplier);
    setValue("purchase", ""); // Clear purchase when supplier changes
    
    // Only set amount if we haven't touched it yet, to avoid overriding user input
    // We can just set it directly if we want the original behavior:
    if (sObj && sObj.balance > 0) {
      setValue("amount", sObj.balance, { shouldValidate: true, shouldDirty: true });
    } else {
      setValue("amount", "", { shouldValidate: false });
    }
  }, [selectedSupplier, suppliers, setValue, preSelectedSupplier]);

  const selectedSupplierObj = React.useMemo(() => {
    if (preSelectedSupplier && selectedSupplier === preSelectedSupplier._id) {
      return preSelectedSupplier;
    }
    return suppliers.find((s) => s._id === selectedSupplier);
  }, [suppliers, selectedSupplier, preSelectedSupplier]);

  const { data: purchasesData } = useQuery({
    queryKey: ["purchases", "list", "by-supplier", selectedSupplier],
    queryFn: () => getPurchases({ 
      supplier: selectedSupplier, 
      limit: 100, 
      status: "active",
      paymentStatuses: "UNPAID,PARTIALLY_PAID"
    }),
    enabled: !!selectedSupplier && can("purchases.read") && isOpen,
    staleTime: 0,
  });
  
  const rawPurchases = unwrapListResponse(purchasesData).items || [];
  
  // Ensure the pre-selected purchase is always in the dropdown list even if it exceeds the limit
  const purchases = React.useMemo(() => {
    const list = [...rawPurchases];
    if (preSelectedPurchase && !list.find((p) => p._id === preSelectedPurchase._id)) {
      list.push(preSelectedPurchase);
    }
    return list;
  }, [rawPurchases, preSelectedPurchase]);

  const handleFormSubmit = async (data) => {
    try {
      const payload = {
        type: data.purchase ? "SPECIFIC" : "GENERAL",
        supplier: data.supplier,
        amount: data.amount,
        date: new Date(data.paymentDate).toISOString(),
        note: data.notes,
      };
      if (data.purchase) {
        payload.purchaseId = data.purchase;
      }

      await onSubmit(payload);
      onClose(); // Automatically close modal on successful submit
    } catch (error) {
      applyServerErrors(setError, error);
    }
  };

  return (
    <Modal isOpen={isOpen} title="Record Payment to Supplier" onClose={onClose}>
      <form className="space-y-4 p-6" onSubmit={handleSubmit(handleFormSubmit)}>
        <FormRootError error={errors.root} />
        <Controller
          name="supplier"
          control={control}
          render={({ field }) => (
            <CreatableSelect
              label="Supplier"
              required
              name="supplier"
              {...field}
              setValue={setValue}
              error={errors.supplier?.message}
              options={suppliers.map((s) => ({ value: s._id, label: s.name }))}
              placeholder="Select a supplier"
              disabled={!!preSelectedSupplier}
              createTitle="New Supplier"
              FormComponent={SupplierForm}
              createMutationFn={createSupplier}
              queryKey={["suppliers"]}
            />
          )}
        />
        {selectedSupplierObj && (
          <div className="mt-[-8px]">
            <p className="text-xs text-secondary mt-1 flex gap-1 items-center">
              Outstanding Balance: 
              <MoneyDisplay 
                amount={selectedSupplierObj.balance || 0} 
                variant={(selectedSupplierObj.balance || 0) > 0 ? "financeOut" : (selectedSupplierObj.balance || 0) < 0 ? "financeIn" : "default"} 
              />
            </p>
          </div>
        )}

        <FormField label="Purchase (Optional)" error={errors.purchase?.message}>
          <Controller
            name="purchase"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                onChange={(e) => {
                  field.onChange(e); // Trigger react-hook-form
                  const purchaseId = e.target.value;
                  if (purchaseId) {
                    const pObj = purchases.find(p => p._id === purchaseId);
                    if (pObj) {
                      const remaining = Math.max(0, pObj.totalAmount - (pObj.allocatedAmount || 0));
                      if (remaining > 0) {
                        setValue("amount", remaining, { shouldValidate: true, shouldDirty: true });
                      } else {
                        setValue("amount", "", { shouldValidate: false });
                      }
                    }
                  } else {
                    // Reverted back to general payment, use supplier balance
                    if (selectedSupplierObj && selectedSupplierObj.balance > 0) {
                      setValue("amount", selectedSupplierObj.balance, { shouldValidate: true, shouldDirty: true });
                    } else {
                      setValue("amount", "", { shouldValidate: false });
                    }
                  }
                }}
                disabled={!selectedSupplier || !!preSelectedPurchase}
                placeholder="Apply to general balance"
                options={purchases.map((p) => ({
                  value: p._id,
                  label: `${p.purchaseNumber} - ${p.totalAmount} ETB`,
                }))}
                error={errors.purchase?.message}
              />
            )}
          />
          {!selectedSupplier && (
            <p className="text-xs text-secondary mt-1">Select a supplier first</p>
          )}
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <Input
              type="date"
              {...register("paymentDate")}
              error={errors.paymentDate?.message}
            />
          </FormField>
        </div>

        <FormField label="Notes" error={errors.notes?.message}>
          <Textarea
            {...register("notes")}
            rows={2}
            error={errors.notes?.message}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
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

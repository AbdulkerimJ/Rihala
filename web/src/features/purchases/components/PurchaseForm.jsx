import React from "react";
import { useQuery } from "@tanstack/react-query";
import { usePermission } from "../../../hooks/usePermission";
import { getSuppliers, createSupplier } from "../../suppliers/api";
import { SupplierForm } from "../../suppliers/components/SupplierForm";
import { getMaterials, createMaterial } from "../../materials/api";
import { MaterialForm } from "../../materials/components/MaterialForm";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { applyServerErrors, unwrapListResponse } from "../../../utils/apiResponse";
import { getLocalISODate } from "../../../utils/formatters";
import { Save, X, Plus, Trash2 } from "lucide-react";
import { Controller } from "react-hook-form";
import { FormRootError } from "../../../components/ui/FormRootError";
import { CreatableSelect } from "../../../components/ui/CreatableSelect";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { CurrencyInput } from "../../../components/ui/CurrencyInput";
import { Textarea } from "../../../components/ui/Textarea";

const purchaseItemSchema = z.object({
  material: z.string().min(1, "Material is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unitPrice: z.coerce.number().nonnegative("Unit price cannot be negative"),
});

const purchaseSchema = z.object({
  supplier: z.string().min(1, "Supplier is required"),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  notes: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, "At least one item is required"),
  recordPayment: z.boolean().optional(),
  initialPayment: z.object({
    amount: z.coerce.number().positive("Payment amount must be positive").optional(),
    paymentDate: z.string().optional(),
    note: z.string().optional(),
  }).optional(),
}).superRefine((data, ctx) => {
  if (data.recordPayment) {
    if (!data.initialPayment?.amount) {
      ctx.addIssue({ path: ["initialPayment", "amount"], code: z.ZodIssueCode.custom, message: "Amount is required" });
    }
    if (!data.initialPayment?.paymentDate) {
      ctx.addIssue({ path: ["initialPayment", "paymentDate"], code: z.ZodIssueCode.custom, message: "Date is required" });
    }
  }
});

export const PurchaseForm = ({ initialData, onSubmit, onClose, isFullyPaid }) => {
  const { can } = usePermission();

  const { data: suppliersData } = useQuery({ 
    queryKey: ["suppliers", "list", { status: "active" }], 
    queryFn: () => getSuppliers({ limit: 1000, status: "active" }),
    enabled: can("suppliers.read")
  });
  const { data: materialsData } = useQuery({ 
    queryKey: ["materials", "list", { status: "active" }], 
    queryFn: () => getMaterials({ limit: 1000, status: "active" }),
    enabled: can("materials.read")
  });
  
  const suppliers = unwrapListResponse(suppliersData).items || [];
  const materials = unwrapListResponse(materialsData).items || [];

  const { register, control, handleSubmit, watch, setError, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(purchaseSchema),
    defaultValues: initialData || {
      supplier: "",
      purchaseDate: getLocalISODate(),
      notes: "",
      items: [{ material: "", quantity: "", unitPrice: "" }],
      recordPayment: false,
      initialPayment: {
        amount: "",
        paymentDate: getLocalISODate(),
        note: "",
      }
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");
  const watchSupplier = watch("supplier");
  const watchRecordPayment = watch("recordPayment");
  const selectedSupplierObj = React.useMemo(() => {
    return suppliers.find((s) => s._id === watchSupplier);
  }, [suppliers, watchSupplier]);

  const totalAmount = watchItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);

  React.useEffect(() => {
    if (watchRecordPayment && !initialData) {
      setValue("initialPayment.amount", totalAmount, { shouldValidate: true });
    }
  }, [watchRecordPayment, totalAmount, initialData, setValue]);

  const handleFormSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        date: new Date(data.purchaseDate).toISOString(),
        note: data.notes,
      };
      delete payload.purchaseDate;
      delete payload.notes;
      delete payload.recordPayment;
      
      if (data.recordPayment && !initialData) {
        payload.initialPayment = {
          amount: Number(data.initialPayment.amount),
          date: new Date(data.initialPayment.paymentDate).toISOString(),
          type: "SPECIFIC",
          note: data.initialPayment.note || undefined,
        };
      } else {
        delete payload.initialPayment;
      }
      
      if (isFullyPaid) {
        delete payload.items;
      }

      await onSubmit(payload);
    } catch (error) {
      applyServerErrors(setError, error);
    }
  };

  return (
    <form className="space-y-3 p-4 sm:p-5 overflow-y-auto max-h-[80vh]" onSubmit={handleSubmit(handleFormSubmit)}>
      <FormRootError error={errors.root} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <CreatableSelect
            label="Supplier"
            required
            name="supplier"
            register={register}
            setValue={setValue}
            error={errors.supplier?.message}
            disabled={!!initialData}
            options={suppliers.map(s => ({ value: s._id, label: s.name }))}
            placeholder="Select a supplier"
            createTitle="New Supplier"
            FormComponent={SupplierForm}
            createMutationFn={createSupplier}
            queryKey={["suppliers"]}
          />
          {selectedSupplierObj && (
            <p className="text-xs text-secondary mt-1 flex gap-1 items-center">
              Current Balance: 
              <MoneyDisplay 
                amount={selectedSupplierObj.balance || 0} 
                variant={(selectedSupplierObj.balance || 0) > 0 ? "financeOut" : (selectedSupplierObj.balance || 0) < 0 ? "financeIn" : "default"} 
              />
            </p>
          )}
        </div>
        
        <FormField label="Purchase Date" required error={errors.purchaseDate?.message}>
          <Input type="date" {...register("purchaseDate")} error={errors.purchaseDate?.message} />
        </FormField>
      </div>

      <div className="pt-4 border-t border-border/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-primary">Purchase Items {isFullyPaid && <span className="text-xs font-normal text-warning ml-2">(Locked - Fully Paid)</span>}</h3>
          {!isFullyPaid && (
            <Button type="button" variant="secondary" size="sm" onClick={() => append({ material: "", quantity: "", unitPrice: "" })}>
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
          )}
        </div>
        
        {errors.items?.root && <p className="text-xs text-danger mb-2">{errors.items.root.message}</p>}

        <div className="space-y-3">
          {fields.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-start bg-main/50 p-3 rounded-lg border border-border/50">
              <div className="col-span-12 sm:col-span-5">
                <CreatableSelect
                  label="Material"
                  name={`items.${index}.material`}
                  register={register}
                  setValue={setValue}
                  options={materials.map(m => ({ value: m._id, label: `${m.name} (${m.unit})` }))}
                  placeholder="Select material"
                  error={errors.items?.[index]?.material?.message}
                  disabled={isFullyPaid}
                  createTitle="New Material"
                  FormComponent={MaterialForm}
                  createMutationFn={createMaterial}
                  queryKey={["materials"]}
                />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <FormField label="Quantity" error={errors.items?.[index]?.quantity?.message}>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Qty"
                    {...register(`items.${index}.quantity`)}
                    error={errors.items?.[index]?.quantity?.message}
                    disabled={isFullyPaid}
                  />
                </FormField>
              </div>
              <div className="col-span-5 sm:col-span-3">
                <FormField label="Unit Price (ETB)" error={errors.items?.[index]?.unitPrice?.message}>
                  <Controller
                    name={`items.${index}.unitPrice`}
                    control={control}
                    render={({ field }) => (
                      <CurrencyInput
                        {...field}
                        placeholder="Unit Price"
                        error={errors.items?.[index]?.unitPrice?.message}
                        disabled={isFullyPaid}
                      />
                    )}
                  />
                </FormField>
              </div>
              <div className="col-span-1 flex justify-end pt-2">
                {fields.length > 1 && !isFullyPaid && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-secondary hover:text-danger p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end items-center gap-2 mt-4 pt-3 border-t border-border/50">
          <span className="text-sm font-medium text-secondary">Total:</span>
          <span className="text-lg font-bold text-accent"><MoneyDisplay amount={totalAmount} /></span>
        </div>
      </div>

      <FormField label="Notes" error={errors.notes?.message}>
        <Textarea {...register("notes")} rows={2} error={errors.notes?.message} placeholder="Optional purchase notes" />
      </FormField>

      {!initialData && (
        <div className="pt-4 mt-4 border-t border-border/50">
          <div className="flex justify-end mb-3">
            <label className="flex items-center gap-2 cursor-pointer w-max">
              <input 
                type="checkbox" 
                {...register("recordPayment")} 
                className="rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
              />
              <span className="text-sm font-medium text-primary cursor-pointer select-none">Record Payment Now</span>
            </label>
          </div>

          {watchRecordPayment && (
            <div className="bg-main/30 p-4 rounded-lg border border-border/50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Payment Amount (ETB)" required error={errors.initialPayment?.amount?.message}>
                  <Controller
                    name="initialPayment.amount"
                    control={control}
                    render={({ field }) => (
                      <CurrencyInput
                        {...field}
                        placeholder="Amount"
                        error={errors.initialPayment?.amount?.message}
                      />
                    )}
                  />
                </FormField>
                <FormField label="Payment Date" required error={errors.initialPayment?.paymentDate?.message}>
                  <Input type="date" {...register("initialPayment.paymentDate")} error={errors.initialPayment?.paymentDate?.message} />
                </FormField>
              </div>
              <FormField label="Payment Note" error={errors.initialPayment?.note?.message}>
                <Textarea {...register("initialPayment.note")} rows={1} error={errors.initialPayment?.note?.message} placeholder="Optional payment note" />
              </FormField>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2.5 pt-4 mt-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} leftIcon={X}>Cancel</Button>
        <Button type="submit" isLoading={isSubmitting} leftIcon={Save}>Save Purchase</Button>
      </div>
    </form>
  );
};

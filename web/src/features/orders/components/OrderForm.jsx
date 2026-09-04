import React, { useMemo } from "react";
import { Save, X, Plus } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getAllowedOrderTransitions, ORDER_STATUS_LABELS } from "../constants";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { CurrencyInput } from "../../../components/ui/CurrencyInput";
import { Textarea } from "../../../components/ui/Textarea";
import { Select } from "../../../components/ui/Select";
import { CreatableSelect } from "../../../components/ui/CreatableSelect";
import { FormRootError } from "../../../components/ui/FormRootError";
import { applyServerErrors } from "../../../utils/apiResponse";
import { getLocalISODate } from "../../../utils/formatters";
import { CustomerForm } from "../../customers/components/CustomerForm";
import { createCustomer } from "../../customers/api";

const orderSchema = z.object({
  customer: z.string().min(1, "Customer is required"),
  description: z.string().min(1, "Description is required"),
  agreedAmount: z.coerce.number().min(1, "Amount must be at least 1"),
  expectedCompletionDate: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
  status: z
    .enum(["pending", "in_progress", "ready", "completed", "cancelled"])
    .optional(),
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

export const OrderForm = ({ initialData, customers = [], onSubmit, onClose }) => {
  const isEditing = !!initialData;
  const allowedStatuses = isEditing
    ? getAllowedOrderTransitions(initialData.status)
    : [];

  const availableCustomers = useMemo(() => {
    const list = customers.filter(
      (c) =>
        c.status === "active" ||
        c._id === initialData?.customer?._id ||
        c._id === initialData?.customer
    );

    if (initialData?.customer) {
      const custId = initialData.customer?._id || initialData.customer;
      const exists = list.some((c) => c._id === custId);
      if (!exists) {
        list.unshift(
          typeof initialData.customer === "object"
            ? initialData.customer
            : { _id: initialData.customer, name: initialData.customerName || "Current Customer" }
        );
      }
    }

    return list;
  }, [customers, initialData]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: initialData
      ? {
          customer: initialData.customer?._id || initialData.customer || "",
          description:
            initialData.description || initialData.items?.[0]?.description || "",
          agreedAmount: initialData.agreedAmount || "",
          expectedCompletionDate: initialData.expectedCompletionDate
            ? String(initialData.expectedCompletionDate).slice(0, 10)
            : "",
          notes: initialData.notes || "",
          status: initialData.status || "pending",
        }
      : {
          customer: "",
          description: "",
          agreedAmount: "",
          expectedCompletionDate: "",
          notes: "",
          recordPayment: false,
          initialPayment: {
            amount: "",
            paymentDate: getLocalISODate(),
            note: "",
          },
        },
  });

  const watchRecordPayment = watch("recordPayment");

  const handleFormSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        description: data.description.trim(),
        date: initialData?.date || new Date().toISOString(),
        expectedCompletionDate: new Date(
          data.expectedCompletionDate
        ).toISOString(),
      };
      
      delete payload.recordPayment;
      
      if (data.recordPayment && !initialData) {
        payload.initialPayment = {
          amount: Number(data.initialPayment.amount),
          paymentDate: new Date(data.initialPayment.paymentDate).toISOString(),
          note: data.initialPayment.note || undefined,
        };
      } else {
        delete payload.initialPayment;
      }

      await onSubmit(payload);
    } catch (error) {
      applyServerErrors(setError, error);
    }
  };

  return (
    <form className="space-y-3 p-4 sm:p-5" onSubmit={handleSubmit(handleFormSubmit)}>
      <FormRootError error={errors.root} />
      <CreatableSelect
        label="Customer"
        required
        name="customer"
        register={register}
        setValue={setValue}
        error={errors.customer?.message}
        options={availableCustomers.map((c) => ({
          value: c._id,
          label: c.name,
        }))}
        placeholder="Select customer"
        createTitle="New Customer"
        FormComponent={CustomerForm}
        createMutationFn={createCustomer}
        queryKey={["customers"]}
      />

      <FormField
        label="Description"
        required
        error={errors.description?.message}
      >
        <Textarea
          placeholder="Describe the agreed furniture/design"
          {...register("description")}
          rows={3}
          error={errors.description?.message}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField
          label="Agreed Amount (ETB)"
          required
          error={errors.agreedAmount?.message}
        >
          <Controller
            name="agreedAmount"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                {...field}
                error={errors.agreedAmount?.message}
              />
            )}
          />
        </FormField>

        <FormField
          label="Expected Completion Date"
          required
          error={errors.expectedCompletionDate?.message}
        >
          <Input
            type="date"
            {...register("expectedCompletionDate")}
            error={errors.expectedCompletionDate?.message}
          />
        </FormField>
      </div>

      <FormField label="Notes" error={errors.notes?.message}>
        <Textarea
          placeholder="Optional notes"
          {...register("notes")}
          rows={2}
          error={errors.notes?.message}
        />
      </FormField>

      {isEditing && (
        <FormField label="Status" error={errors.status?.message}>
          <Select
            {...register("status")}
            error={errors.status?.message}
            options={[
              {
                value: initialData.status,
                label: ORDER_STATUS_LABELS[initialData.status] || initialData.status,
              },
              ...allowedStatuses.map((status) => ({
                value: status,
                label: ORDER_STATUS_LABELS[status],
              })),
            ]}
          />
        </FormField>
      )}

      {!isEditing && (
        <div className="pt-4 mt-2 border-t border-border/50">
          <label className="flex items-center gap-2 cursor-pointer mb-3 w-max">
            <input 
              type="checkbox" 
              {...register("recordPayment")} 
              className="rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
            />
            <span className="text-sm font-medium text-primary cursor-pointer select-none">Record Payment Now</span>
          </label>

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

      <div className="flex justify-end gap-2.5 pt-3 mt-1 border-t border-border/50">
        <Button type="button"
          variant="ghost"
          onClick={onClose}
          disabled={isSubmitting} leftIcon={X}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting} leftIcon={Save}>
          {isEditing ? "Save Changes" : "Save Order"}
        </Button>
      </div>
    </form>
  );
};

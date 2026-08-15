import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getAllowedOrderTransitions, ORDER_STATUS_LABELS } from "../constants";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { Select } from "../../../components/ui/Select";
import { FormRootError } from "../../../components/ui/FormRootError";
import { applyServerErrors } from "../../../utils/apiResponse";

const orderSchema = z.object({
  customer: z.string().min(1, "Customer is required"),
  description: z.string().min(1, "Description is required"),
  agreedAmount: z.coerce.number().min(1, "Amount must be at least 1"),
  expectedCompletionDate: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
  status: z
    .enum(["pending", "in_progress", "ready", "completed", "cancelled"])
    .optional(),
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
    handleSubmit,
    setError,
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
        },
  });

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

      await onSubmit(payload);
    } catch (error) {
      applyServerErrors(setError, error);
    }
  };

  return (
    <form className="space-y-4 p-6" onSubmit={handleSubmit(handleFormSubmit)}>
      <FormRootError error={errors.root} />
      <FormField label="Customer" required error={errors.customer?.message}>
        <Select
          {...register("customer")}
          placeholder="Select customer"
          error={errors.customer?.message}
          options={availableCustomers.map((c) => ({
            value: c._id,
            label: c.name,
          }))}
        />
      </FormField>

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="Agreed Amount (ETB)"
          required
          error={errors.agreedAmount?.message}
        >
          <Input
            type="number"
            placeholder="0"
            {...register("agreedAmount")}
            error={errors.agreedAmount?.message}
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
          {isEditing ? "Save Changes" : "Save Order"}
        </Button>
      </div>
    </form>
  );
};

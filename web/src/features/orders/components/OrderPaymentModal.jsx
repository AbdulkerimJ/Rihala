import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "../../../components/ui/Modal";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { Button } from "../../../components/ui/Button";
import { FormRootError } from "../../../components/ui/FormRootError";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { applyServerErrors } from "../../../utils/apiResponse";

const directPaymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  paymentDate: z.string().min(1, "Payment date is required"),
  notes: z.string().optional(),
});

export const OrderPaymentModal = ({
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
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(directPaymentSchema),
    defaultValues: {
      amount: remainingBalance > 0 ? remainingBalance : "",
      paymentDate: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        amount: remainingBalance > 0 ? remainingBalance : "",
        paymentDate: new Date().toISOString().split("T")[0],
        notes: "",
      });
    }
  }, [isOpen, remainingBalance, reset]);

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit({
        order: order._id,
        amount: Number(data.amount),
        paymentDate: new Date(data.paymentDate).toISOString(),
        note: data.notes?.trim() ? data.notes.trim() : undefined,
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

        <div className="rounded-xl border border-finance-in/20 bg-finance-in/5 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-secondary">Customer:</span>
            <span className="font-semibold text-primary">
              {order?.customer?.name || order?.customerName}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-secondary">Order Total:</span>
            <span className="font-semibold text-primary">
              <MoneyDisplay amount={order?.agreedAmount} />
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1 pt-1 border-t border-finance-in/10">
            <span className="text-finance-in font-medium">
              Remaining Due:
            </span>
            <span className="font-bold text-finance-in">
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
              max={remainingBalance}
              placeholder="0"
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

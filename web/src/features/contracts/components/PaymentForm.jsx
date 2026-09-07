import { useForm, Controller } from "react-hook-form";
import { FormRootError } from "../../../components/ui/FormRootError";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { Button } from "../../../components/ui/Button";
import { CurrencyInput } from "../../../components/ui/CurrencyInput";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getLocalISODate } from "../../../utils/formatters";
import { applyServerErrors } from "../../../utils/apiResponse";
import { Save, X } from "lucide-react";

const paymentSchema = z.object({
  amount: z.coerce.number({ error: "Amount is required" }).positive("Amount must be greater than 0"),
  paymentDate: z.string().min(1, "Date is required"),
  note: z.string().trim().optional().or(z.literal(""))
});

export const PaymentForm = ({ contract, onSubmit, onClose }) => {
  const { register, control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: contract.stats.payableAmount, paymentDate: getLocalISODate(), note: "" }
  });

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      applyServerErrors(setError, error);
    }
  };

  return (
    <form className="space-y-4 p-6" onSubmit={handleSubmit(handleFormSubmit)}>
      <FormRootError error={errors.root} />
      <div className="bg-accent/5 p-3 rounded-md mb-4 border border-accent/20">
        <p className="text-sm text-primary">Max payable amount: <strong className="text-accent"><MoneyDisplay amount={contract.stats.payableAmount} /></strong></p>
      </div>
      <FormField label="Amount (ETB)" required error={errors.amount?.message}>
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <CurrencyInput
              {...field}
              max={contract.stats.payableAmount}
              placeholder="0"
              error={errors.amount?.message}
            />
          )}
        />
      </FormField>
      <FormField label="Payment Date" required error={errors.paymentDate?.message}>
        <Input type="date" {...register("paymentDate")} error={errors.paymentDate?.message} />
      </FormField>
      <FormField label="Note (Optional)" error={errors.note?.message}>
        <Textarea {...register("note")} rows={2} error={errors.note?.message} />
      </FormField>
      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} leftIcon={X}>Cancel</Button>
        <Button type="submit" isLoading={isSubmitting} leftIcon={Save}>Record Payment</Button>
      </div>
    </form>
  );
};

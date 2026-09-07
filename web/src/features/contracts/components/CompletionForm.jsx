import { useForm } from "react-hook-form";
import { FormRootError } from "../../../components/ui/FormRootError";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { Button } from "../../../components/ui/Button";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getLocalISODate } from "../../../utils/formatters";
import { applyServerErrors } from "../../../utils/apiResponse";
import { Save, X } from "lucide-react";

const completionSchema = z.object({
  quantity: z.coerce.number({ error: "Quantity is required" }).int("Quantity must be an integer").min(1, "Quantity must be at least 1"),
  recordedAt: z.string().min(1, "Date is required"),
  note: z.string().trim().optional().or(z.literal("")),
});

export const CompletionForm = ({ contract, onSubmit, onClose }) => {
  const maxQty = Math.max(0, (contract.quantity || 0) - (contract.stats?.completedQuantity || 0));
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(completionSchema),
    defaultValues: { quantity: maxQty > 0 ? maxQty : 1, recordedAt: getLocalISODate(), note: "" }
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
        <p className="text-sm text-primary">Remaining to complete: <strong className="text-accent">{maxQty}</strong> units.</p>
      </div>
      <FormField label="Quantity Completed" required error={errors.quantity?.message}>
        <Input type="number" max={maxQty} {...register("quantity")} error={errors.quantity?.message} />
      </FormField>
      <FormField label="Completion Date" required error={errors.recordedAt?.message}>
        <Input type="date" {...register("recordedAt")} error={errors.recordedAt?.message} />
      </FormField>
      <FormField label="Note (Optional)" error={errors.note?.message}>
        <Textarea {...register("note")} rows={2} error={errors.note?.message} />
      </FormField>
      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} leftIcon={X}>Cancel</Button>
        <Button type="submit" isLoading={isSubmitting} leftIcon={Save}>Record Completion</Button>
      </div>
    </form>
  );
};

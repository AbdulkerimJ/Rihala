import { Save, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ethiopianPhone } from "../../../utils/validation";
import { applyServerErrors } from "../../../utils/apiResponse";
import { ACTIVE_INACTIVE_OPTIONS } from "../../../constants/options";
import { FormRootError } from "../../../components/ui/FormRootError";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui/Button";

const supplierSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
  phone: ethiopianPhone,
  address: z.string().trim().max(255, "Address cannot exceed 255 characters").optional().or(z.literal("")),
  notes: z.string().trim().max(1000, "Notes cannot exceed 1000 characters").optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const SupplierForm = ({ initialData, onSubmit, onClose }) => {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: initialData || {
      name: "",
      phone: "",
      address: "",
      notes: "",
      status: "active",
    },
  });

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      applyServerErrors(setError, error);
    }
  };

  return (
    <form className="space-y-3 p-4 sm:p-5" onSubmit={handleSubmit(handleFormSubmit)}>
      <FormRootError error={errors.root} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Name" required error={errors.name?.message}>
          <Input {...register("name")} error={errors.name?.message} />
        </FormField>

        <FormField label="Phone" required error={errors.phone?.message}>
          <Input {...register("phone")} inputMode="tel" error={errors.phone?.message} placeholder="e.g. 0911234567" />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Address" error={errors.address?.message}>
          <Input {...register("address")} error={errors.address?.message} />
        </FormField>
      </div>

      <FormField label="Notes" error={errors.notes?.message}>
        <Textarea {...register("notes")} rows={2} error={errors.notes?.message} />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Status" error={errors.status?.message}>
          <Select
            {...register("status")}
            options={ACTIVE_INACTIVE_OPTIONS}
            error={errors.status?.message}
          />
        </FormField>
      </div>

      <div className="flex justify-end gap-2.5 pt-3 mt-1 border-t border-border/50">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} leftIcon={X}>Cancel</Button>
        <Button type="submit" isLoading={isSubmitting} leftIcon={Save}>Save Supplier</Button>
      </div>
    </form>
  );
};

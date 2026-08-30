import React from "react";
import { Save, X, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import { Button } from "../../../components/ui/Button";
import { FormRootError } from "../../../components/ui/FormRootError";
import { applyServerErrors } from "../../../utils/apiResponse";
import { ACTIVE_INACTIVE_OPTIONS } from "../../../constants/options";

const contractorSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  phone: z
    .string({ error: "Phone number is required." })
    .trim()
    .min(1, "Phone number is required.")
    .max(20, "Phone cannot exceed 20 characters"),
  notes: z
    .string()
    .trim()
    .max(1000, "Notes cannot exceed 1000 characters")
    .optional()
    .or(z.literal("")),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const ContractorForm = ({ initialData, onSubmit, onClose }) => {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(contractorSchema),
    defaultValues: initialData || {
      name: "",
      phone: "",
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
    <form className="space-y-4 p-6" onSubmit={handleSubmit(handleFormSubmit)}>
      <FormRootError error={errors.root} />
      <FormField label="Name" required error={errors.name?.message}>
        <Input
          {...register("name")}
          error={errors.name?.message}
          placeholder="e.g. Ali Ahmed"
        />
      </FormField>

      <FormField label="Phone" required error={errors.phone?.message}>
        <Input
          {...register("phone")}
          inputMode="tel"
          error={errors.phone?.message}
          placeholder="e.g. 0911234567 or +251911234567"
        />
      </FormField>

      <FormField label="Notes" error={errors.notes?.message}>
        <Textarea
          {...register("notes")}
          rows={3}
          error={errors.notes?.message}
          placeholder="Optional notes"
        />
      </FormField>

      <FormField label="Status" error={errors.status?.message}>
        <Select
          {...register("status")}
          error={errors.status?.message}
          options={ACTIVE_INACTIVE_OPTIONS}
        />
      </FormField>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} leftIcon={X}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting} leftIcon={Save}>
          Save Contractor
        </Button>
      </div>
    </form>
  );
};

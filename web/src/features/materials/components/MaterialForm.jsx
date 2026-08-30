import React from "react";
import { Save, X, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui/Button";
import { FormRootError } from "../../../components/ui/FormRootError";
import { applyServerErrors } from "../../../utils/apiResponse";
import { ACTIVE_INACTIVE_OPTIONS } from "../../../constants/options";

export const CATEGORIES = [
  "MDF",
  "Wood",
  "Fabric",
  "Foam",
  "Safarian",
  "Nails",
  "Paint",
  "Adhesives",
  "Hardware",
  "Chemicals",
  "Other",
];

export const UNITS = [
  { value: "piece", label: "Piece" },
  { value: "kg", label: "Kilogram (kg)" },
  { value: "meter", label: "Meter (m)" },
  { value: "liter", label: "Liter (l)" },
  { value: "roll", label: "Roll" },
];

const materialSchema = z.object({
  name: z
    .string({ error: "Material name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: "Category is required" }),
  }),
  unit: z.enum(["piece", "kg", "meter", "liter", "roll"], {
    errorMap: () => ({ message: "Unit of measurement is required" }),
  }),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const MaterialForm = ({ initialData, onSubmit, onClose }) => {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(materialSchema),
    defaultValues: initialData || {
      name: "",
      category: "MDF",
      unit: "piece",
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
      <FormField label="Material Name" required error={errors.name?.message}>
        <Input {...register("name")} error={errors.name?.message} placeholder="e.g. Oak Timber" />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Category" required error={errors.category?.message}>
          <Select
            {...register("category")}
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            error={errors.category?.message}
          />
        </FormField>
        
        <FormField label="Unit of Measurement" required error={errors.unit?.message}>
          <Select
            {...register("unit")}
            options={UNITS}
            error={errors.unit?.message}
          />
        </FormField>
      </div>

      <FormField label="Status" error={errors.status?.message}>
        <Select
          {...register("status")}
          error={errors.status?.message}
          options={ACTIVE_INACTIVE_OPTIONS}
        />
      </FormField>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} leftIcon={X}>Cancel</Button>
        <Button type="submit" isLoading={isSubmitting} leftIcon={Save}>Save Material</Button>
      </div>
    </form>
  );
};

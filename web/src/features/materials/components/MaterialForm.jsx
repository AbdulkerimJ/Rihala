import { Save, X } from "lucide-react";
import { FormRootError } from "../../../components/ui/FormRootError";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui/Button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
    <form className="space-y-3 p-4 sm:p-5" onSubmit={handleSubmit(handleFormSubmit)}>
      <FormRootError error={errors.root} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Material Name" required error={errors.name?.message}>
          <Input {...register("name")} error={errors.name?.message} placeholder="e.g. Oak Timber" />
        </FormField>
        
        <FormField label="Category" required error={errors.category?.message}>
          <Select
            {...register("category")}
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            error={errors.category?.message}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Unit of Measurement" required error={errors.unit?.message}>
          <Select
            {...register("unit")}
            options={UNITS}
            error={errors.unit?.message}
          />
        </FormField>

        <FormField label="Status" error={errors.status?.message}>
          <Select
            {...register("status")}
            error={errors.status?.message}
            options={ACTIVE_INACTIVE_OPTIONS}
          />
        </FormField>
      </div>

      <div className="flex justify-end gap-2.5 pt-3 mt-1 border-t border-border/50">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} leftIcon={X}>Cancel</Button>
        <Button type="submit" isLoading={isSubmitting} leftIcon={Save}>Save Material</Button>
      </div>
    </form>
  );
};
